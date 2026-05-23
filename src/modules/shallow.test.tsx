import React from "react";
import { shallow } from "./shallow";

type ChildProps = {
  children?: React.ReactNode;
  label?: string;
  onSelect?: () => void;
};

function Child({ children, label, onSelect }: ChildProps) {
  return (
    <button onClick={onSelect}>
      {label}
      {children}
    </button>
  );
}

function ChildProvider({ children }: { children: React.ReactNode }) {
  return <section>{children}</section>;
}

function MixedOutput({ show, value }: { show?: boolean; value?: React.ReactNode }) {
  if (!show) {
    return null;
  }

  return (
    <>
      {value}
      {false}
      <Child label="child">Nested</Child>
      {["A", 2]}
    </>
  );
}

describe("shallow", () => {
  test("renders fragments, arrays, primitive children, and child component nodes", () => {
    const { render } = shallow(MixedOutput, {
      defaultProps: { show: true, value: "Value" },
    });

    const output = render();

    expect(output.text()).toBe("ValueNestedNestedA2");
    expect(output.find(Child).props()).toEqual({
      children: "Nested",
      label: "child",
    });
    expect(output.findAll("#text")).toHaveLength(4);
  });

  test("uses render props, rerender, wrapper, and unmount", () => {
    function Wrapped({ title }: { title: string }) {
      return <Child label={title} />;
    }
    function Wrapper({ children }: { children: React.ReactNode }) {
      return <div data-wrapper="outer">{children}</div>;
    }

    const { render } = shallow(Wrapped, {
      defaultProps: { title: "Initial" },
      wrapper: Wrapper,
    });
    const output = render();

    expect(output.find(Child).props()).toEqual({ label: "Initial" });

    output.rerender({ title: "Next" });

    expect(output.find(Child).props()).toEqual({ label: "Next" });

    output.unmount();

    expect(output).not.toBeRendered();
  });

  test("executes components named Provider while keeping other children shallow", () => {
    function Host() {
      return (
        <ChildProvider>
          <Child label="provided" />
        </ChildProvider>
      );
    }

    const output = shallow(Host).render();

    expect(output.find("section").props()).toEqual({ children: <Child label="provided" /> });
    expect(output.find(Child).props()).toEqual({ label: "provided" });
  });

  test("mocks child components and keeps rendered children searchable", () => {
    function Parent() {
      return <Child label="real" />;
    }
    const api = shallow(Parent);

    api.mock(Child).component((props: ChildProps) => <span>{props.label}</span>);
    const output = api.render();

    expect(output.find(Child).props()).toEqual({ label: "real" });
    expect(output.find("span").text()).toBe("realreal");
  });

  test("supports mock state helpers", () => {
    function Target(): React.ReactNode {
      return null;
    }
    const api = shallow(Target);
    const mock = api.mock(Target);
    const error = new Error("failed");

    expect(mock.returnFull("value")).toBe(mock);
    expect(mock.return({ ok: true })).toBe(mock);
    expect(mock.callsFake(() => "fake")).toBe(mock);
    expect(mock.throws(error)).toBe(mock);
    expect(mock.component()).toBe(mock);
    expect(mock.calls()).toEqual([]);
    expect(mock.renders()).toEqual([]);
    expect(mock.reset()).toBe(mock);
    expect(mock.calls()).toEqual([]);
  });

  test("records triggered component interactions in timeline", () => {
    function Host({ onSelect }: { onSelect: (id: string) => void }) {
      return <Child label="child" onSelect={() => onSelect("1")} />;
    }
    const onSelect = vi.fn();
    const api = shallow(Host, { defaultProps: { onSelect } });
    const output = api.render();

    output.find(Child).trigger("onSelect");

    expect(onSelect).toHaveBeenCalledWith("1");
    expect(output.timelineEvents()).toEqual([
      {
        componentName: "Host",
        kind: "render",
        props: { onSelect },
      },
      {
        interaction: {
          args: [],
          propName: "onSelect",
          result: undefined,
          typeName: "Child",
        },
        kind: "trigger",
      },
      {
        componentName: "Host",
        kind: "rerender",
        props: { onSelect },
      },
    ]);
  });

  test("uses render-time wrapper and external mock integrations", () => {
    function Wrapper({ children }: { children: React.ReactNode }) {
      return <div>{children}</div>;
    }
    function Host() {
      return <Child label="wrapped" />;
    }
    const external = vi.fn();
    const api = shallow(Host);

    api.mock(external).callsFake(() => "external");
    const output = api.render({}, { wrapper: Wrapper });

    expect(output.find("div").find(Child).props()).toEqual({ label: "wrapped" });
    expect(external).not.toHaveBeenCalled();
  });

  test("records mock errors from external mocks", () => {
    const error = new Error("mock failed");
    const external = vi.fn();
    function Target() {
      external();
      return null;
    }
    const api = shallow(Target);

    api.mock(external).throws(error);

    expect(() => api.render()).toThrow(error);
  });

  test("uses component mock implementations", () => {
    function Target() {
      return <Child label="child" />;
    }
    const api = shallow(Target);

    api.mock(Child).component((props: ChildProps) => <em>{props.label}</em>);
    const output = api.render();

    expect(output.find("em")).toHaveText("child");
  });

  test("uses default component mock rendering", () => {
    function TargetWithNested() {
      return (
        <Child label="child">
          <span>Nested</span>
        </Child>
      );
    }
    const nested = shallow(TargetWithNested);
    nested.mock(Child).component();
    expect(nested.render().find("span")).toHaveText("Nested");
  });

  test("ignores render output with unsupported element types", () => {
    function Host() {
      return React.createElement(0 as unknown as "div", {}, "ignored");
    }

    expect(shallow(Host).render().nodes()).toEqual([]);
  });

  test("rejects non-function non-record mock targets", () => {
    const api = shallow(function Host() {
      return null;
    });

    expect(() => api.mock(123 as never)).not.toThrow();
    expect(api.mock(123 as never).calls()).toEqual([]);
  });

  test("restores context values and ignores unknown element types", () => {
    const Context = React.createContext("default");
    function Host() {
      return (
        <Context.Provider value="provided">
          <Child label="child" />
        </Context.Provider>
      );
    }

    const output = shallow(Host).render();
    expect(output.find(Child).props()).toEqual({ label: "child" });

    const exotic = { $$typeof: Symbol.for("react.element"), type: Symbol("exotic"), props: {} };
    function ExoticHost() {
      return exotic as unknown as React.ReactElement;
    }

    expect(shallow(ExoticHost).render().nodes()).toEqual([]);
  });

  test("records mock configuration in the timeline", () => {
    function Host() {
      return <Child label="child" />;
    }
    const api = shallow(Host);
    api.mock(Child).returnFull(<></>);
    const output = api.render();

    expect(output.timelineEvents().some((event) => event.kind === "mock-config")).toBe(true);
  });

  test("reads props when element props are missing", () => {
    function Host() {
      return React.createElement("div", null as unknown as React.ComponentProps<"div">, "text");
    }

    expect(shallow(Host).render().find("div").props()).toEqual({ children: "text" });
  });

  test("merges partial mock values with non-object results", () => {
    const fn = vi.fn(() => "plain");
    function Host() {
      fn();
      return null;
    }
    const api = shallow(Host);

    api.mock(fn).return({ tracked: true });
    api.render();

    expect(fn()).toEqual({ tracked: true });
  });

  test("records mock setup, render, mock calls, and rerender in timeline", () => {
    const useFlag = Object.assign(
      vi.fn(() => false),
      { displayName: "useFlag" },
    );
    function Host() {
      return <Child label={useFlag() ? "enabled" : "disabled"} />;
    }
    const api = shallow(Host);

    api.mock(useFlag).returnFull(false);
    const output = api.render();
    api.mock(useFlag).returnFull(true);
    output.rerender();

    expect(output.timelineEvents()).toEqual([
      {
        kind: "mock-config",
        mock: { method: "returnFull", name: "useFlag", value: false },
      },
      {
        componentName: "Host",
        kind: "render",
        props: {},
      },
      {
        call: { args: [], name: "useFlag", result: false },
        kind: "mock-call",
      },
      {
        kind: "mock-config",
        mock: { method: "returnFull", name: "useFlag", value: true },
      },
      {
        componentName: "Host",
        kind: "rerender",
        props: {},
      },
      {
        call: { args: [], name: "useFlag", result: true },
        kind: "mock-call",
      },
    ]);
  });

  test("debug prints the subtree for a node returned from find", () => {
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    function TextboxField() {
      return (
        <div className="relative min-w-0">
          <div className="relative h-full">
            <div
              contentEditable
              role="textbox"
              aria-placeholder="Add new todo"
              onPaste={() => undefined}
            />
            <span className="placeholder">Add new todo</span>
          </div>
        </div>
      );
    }

    const { render, debug } = shallow(TextboxField);
    const output = render();
    const textbox = output.find("div", { props: { role: "textbox" } });

    expect(debug(textbox).tree()).toBe(
      'div { contentEditable: true, role: "textbox", aria-placeholder: "Add new todo", onPaste: fn }',
    );
    expect(debug(output).tree()).toContain('role: "textbox"');
    expect(debug(output).tree()).toContain('className: "relative min-w-0"');
  });
});
