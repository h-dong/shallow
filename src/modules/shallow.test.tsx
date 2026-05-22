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
});
