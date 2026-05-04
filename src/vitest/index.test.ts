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
