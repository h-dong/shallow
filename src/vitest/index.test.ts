import { createNode } from "../modules/tree";
import { registerMatchers } from ".";

function Badge() {
  return null;
}

describe("vitest matchers", () => {
  test("registers matchers once", () => {
    expect(registerMatchers()).toBeUndefined();
  });

  test("matches rendered text with strings and regular expressions", () => {
    const output = { text: () => "Status: Active" };

    expect(output).toRenderText("Active");
    expect(output).toHaveText("Active");
    expect(output).toRenderText(/Status/);
    expect(() => expect(output).toRenderText("Disabled")).toThrow(
      "Expected rendered text to include Disabled. Actual text: Status: Active",
    );
    expect(() => expect(output).not.toRenderText("Active")).toThrow(
      "Expected rendered text not to include Active. Actual text: Status: Active",
    );
  });

  test("matches outer element text from the rendered tree", () => {
    const output = {
      nodes: () => [
        createNode("section", { children: "Hello " }, [
          createNode("strong", { children: "world" }),
        ]),
      ],
    };

    expect(output).toRenderText("Hello world");
    expect(output).toHaveText(/world/);
  });

  test("matches whether output is rendered", () => {
    const output = {
      nodes: () => [createNode("div", { children: "Loaded" })],
    };
    const emptyOutput = {
      nodes: () => [],
    };

    expect(output).toBeRendered();
    expect(() => expect(emptyOutput).toBeRendered()).toThrow("Expected output to be rendered.");
    expect(() => expect(output).not.toBeRendered()).toThrow("Expected output not to be rendered.");
  });

  test("matches outer element attributes", () => {
    const output = {
      nodes: () => [
        createNode("button", {
          id: "save-button-id",
          name: "submit",
          role: "button",
          className: "btn primary",
          "aria-label": "Save changes",
          "data-testid": "save-button-test-id",
          children: "Save",
        }),
      ],
    };

    expect(output).toHaveName("submit");
    expect(output).toHaveTestId("save-button-test-id");
    expect(output).toHaveId("save-button-id");
    expect(output).toHaveLabel("Save changes");
    expect(output).toHaveRole("button");
    expect(output).toHaveClass("primary");
    expect(output).toBeElement("button");
    expect(output).toHaveProps("children", "Save");
    expect(() => expect(output).toHaveName("cancel")).toThrow(
      "Expected outer element to have name cancel.",
    );
  });

  test("matches outer element host tags and component types", () => {
    function SaveButton() {
      return null;
    }

    const hostOutput = {
      nodes: () => [createNode("button", { children: "Save" })],
    };
    const componentOutput = {
      nodes: () => [createNode(SaveButton, { children: "Save" })],
    };

    expect(hostOutput).toBeElement("button");
    expect(componentOutput).toBeElement(SaveButton);
    expect(() => expect(hostOutput).toBeElement("form")).toThrow(
      "Expected outer element to be form.",
    );
  });

  test("matches outer element form state", () => {
    const enabledInput = {
      nodes: () => [createNode("input", { value: "Ada", disabled: false })],
    };
    const disabledInput = {
      nodes: () => [createNode("input", { value: "Ada", disabled: true })],
    };
    const checkedInput = {
      nodes: () => [createNode("input", { type: "checkbox", checked: true })],
    };
    const uncheckedInput = {
      nodes: () => [createNode("input", { type: "checkbox", checked: false })],
    };

    expect(enabledInput).toBeEnabled();
    expect(enabledInput).toHaveValue("Ada");
    expect(disabledInput).toBeDisabled();
    expect(checkedInput).toBeChecked();
    expect(uncheckedInput).toBeUnchecked();
    expect(() => expect(disabledInput).toBeEnabled()).toThrow(
      "Expected outer element to be enabled. disabled=true",
    );
  });

  test("matches rendered nodes by type and props", () => {
    const badgeNodes = [
      {
        props: () => ({ label: "Active", tone: "success" }),
      },
    ];
    const output = {
      find: (type: unknown) => (type === Badge ? badgeNodes[0] : undefined),
      findAll: (type: unknown) => (type === Badge ? badgeNodes : []),
    };

    expect(output).toRender(Badge);
    expect(output).toRender(Badge, { tone: "success" });
    expect(() => expect(output).toRender("Missing")).toThrow("Expected output to render Missing.");
  });

  test("matches rendered nodes by label text", () => {
    const badgeNodes = [
      {
        props: () => ({ "aria-label": "Active status", tone: "success" }),
      },
    ];
    const output = {
      find: (type: unknown) => (type === Badge ? badgeNodes[0] : undefined),
      findAll: (type: unknown) => (type === Badge ? badgeNodes : []),
    };

    expect(output).toRenderLabelText(Badge, "Active status");
    expect(() => expect(output).toRenderLabelText(Badge, "Inactive status")).toThrow(
      "Expected output to render Badge with label text Inactive status.",
    );
    expect(() => expect(output).not.toRenderLabelText(Badge, "Active status")).toThrow(
      "Expected output not to render Badge with label text Active status.",
    );
  });

  test("matches unrendered output with not.toBeRendered", () => {
    const output = {
      nodes: () => [],
    };
    const nonEmptyOutput = {
      nodes: () => [{ type: Badge }],
    };

    expect(output).not.toBeRendered();
    expect(() => expect(nonEmptyOutput).not.toBeRendered()).toThrow(
      "Expected output not to be rendered.",
    );
    expect(nonEmptyOutput).toBeRendered();
  });

  test("matches attributes on found nodes", () => {
    const node = {
      props: () => ({
        name: "search",
        className: "search-button",
        children: "Search",
      }),
      text: () => "Search",
      elementTag: () => "button",
    };

    expect(node).toHaveClass("search-button");
    expect(node).toHaveName("search");
    expect(node).toHaveText("Search");
    expect(node).toHaveLabel("Search");
    expect(node).toBeElement("button");
    expect(() => expect(node).toHaveClass("clear-button")).toThrow(
      "Expected element to have class clear-button.",
    );
  });

  test("matches form state on found nodes", () => {
    const checkedInput = {
      props: () => ({ type: "checkbox", checked: true }),
    };
    const uncheckedInput = {
      props: () => ({ type: "checkbox", checked: false }),
    };
    const disabledInput = {
      props: () => ({ value: "Ada", disabled: true }),
    };

    expect(checkedInput).toBeChecked();
    expect(uncheckedInput).toBeUnchecked();
    expect(disabledInput).toBeDisabled();
    expect(() => expect(uncheckedInput).toBeChecked()).toThrow(
      "Expected element to be checked. checked=false",
    );
  });

  test("matches component node props", () => {
    const node = {
      props: () => ({ label: "Active", tone: "success" }),
    };

    expect(node).toHaveProps({ label: "Active" });
    expect(() => expect(node).toHaveProps({ tone: "danger" })).toThrow(
      'Expected props to match {"tone":"danger"}.',
    );
    expect(() => expect(node).not.toHaveProps({ tone: "success" })).toThrow(
      'Expected props not to match {"tone":"success"}.',
    );
  });
});
