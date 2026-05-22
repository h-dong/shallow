import { shallow } from "../src";
import { EmailField } from "./use-case-15-email-field";

describe("EmailField", () => {
  const { render } = shallow(EmailField, {
    defaultProps: {
      value: "ada@example.com",
      onChange: vi.fn(),
    },
  });

  test("asserts outer element matchers", () => {
    const output = render();

    expect(output).toBeRendered();
    expect(output).toBeElement("input");
    expect(output).toHaveId("email-input");
    expect(output).toHaveTestId("email-input");
    expect(output).toHaveName("email");
    expect(output).toHaveLabel("Email address");
    expect(output).toHaveRole("textbox");
    expect(output).toHaveClass("email-input");
    expect(output).toHaveValue("ada@example.com");
    expect(output).toBeEnabled();
    expect(output).toHaveProps("type", "email");
  });

  test("reports disabled state on the outer input", () => {
    const output = render({ disabled: true });

    expect(output).toBeDisabled();
    expect(output).toHaveValue("ada@example.com");
  });
});
