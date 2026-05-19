import { registerMatchers } from ".";
import { createNode } from "../modules/tree";

function Badge() {
  return null;
}

function TextInput() {
  return null;
}

describe("vitest matchers", () => {
  test("registers matchers once", () => {
    expect(registerMatchers()).toBeUndefined();
  });

  test("matches rendered text with strings and regular expressions", () => {
    const output = { text: () => "Status: Active" };

    expect(output).toRenderText("Active");
    expect(output).toRenderText(/Status/);
    expect(() => expect(output).toRenderText("Disabled")).toThrow(
      "Expected rendered text to include Disabled. Actual text: Status: Active",
    );
    expect(() => expect(output).not.toRenderText("Active")).toThrow(
      "Expected rendered text not to include Active. Actual text: Status: Active",
    );
  });

  test("matches rendered nodes by type and props", () => {
    const output = {
      findAll: (type: unknown) =>
        type === Badge
          ? [
              {
                props: () => ({ label: "Active", tone: "success" }),
              },
            ]
          : [],
    };

    expect(output).toRender(Badge);
    expect(output).toRender(Badge, { tone: "success" });
    expect(() => expect(output).toRender("Missing")).toThrow("Expected output to render Missing.");
  });

  test("matches rendered nodes by label text", () => {
    const output = {
      findAll: (type: unknown) =>
        type === Badge
          ? [
              {
                props: () => ({ "aria-label": "Active status", tone: "success" }),
              },
            ]
          : [],
    };

    expect(output).toRenderLabelText(Badge, "Active status");
    expect(() => expect(output).toRenderLabelText(Badge, "Inactive status")).toThrow(
      "Expected output to render Badge with label text Inactive status.",
    );
    expect(() => expect(output).not.toRenderLabelText(Badge, "Active status")).toThrow(
      "Expected output not to render Badge with label text Active status.",
    );
  });

  test("matches label text using Testing Library label associations", () => {
    const output = {
      nodes: () => [
        createNode("label", { htmlFor: "username-input", children: "Username" }),
        createNode("input", { id: "username-input" }),
        createNode("label", { id: "email-label", children: "Email" }),
        createNode("input", { "aria-labelledby": "email-label" }),
        createNode("label", {}, [
          createNode("#text", { children: "Password " }),
          createNode("input", { id: "password-input" }),
        ]),
        createNode("label", {}, [
          createNode("span", { children: "Display name" }),
          createNode("input", { id: "display-name-input" }),
        ]),
        createNode("input", { "aria-label": "Search" }),
      ],
    };

    expect(output).toRenderLabelText("input", "Username");
    expect(output).toRenderLabelText("input", "Email");
    expect(output).toRenderLabelText("input", "Password");
    expect(output).toRenderLabelText("input", "Display name");
    expect(output).toRenderLabelText("input", "Search");
  });

  test("matches React components and regular expressions by label text", () => {
    const output = {
      nodes: () => [
        createNode("label", { htmlFor: "component-input", children: "Account name" }),
        createNode(TextInput, { id: "component-input" }),
      ],
    };

    expect(output).toRenderLabelText(TextInput, /account\s+name/i);
  });

  test("does not match for/htmlFor labels against non-labelable host elements", () => {
    const output = {
      nodes: () => [
        createNode("section", { id: "photos-section" }),
        createNode("label", { htmlFor: "photos-section", children: "Photos" }),
      ],
    };

    expect(() => expect(output).toRenderLabelText("section", "Photos")).toThrow(
      "Expected output to render section with label text Photos.",
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
