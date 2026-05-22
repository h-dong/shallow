import { shallow } from "../src";
import { EmailField } from "./use-case-15-email-field";
import { LoginForm } from "./use-case-15-login-form";

describe("LoginForm", () => {
  const { render } = shallow(LoginForm, {
    defaultProps: {
      email: "ada@example.com",
      onSubmit: vi.fn(),
    },
  });

  test("renders the login form shell", () => {
    const output = render();

    expect(output).toBeRendered();
    expect(output).toBeElement("form");
    expect(output).toHaveId("login-form");
    expect(output).toHaveTestId("login-form");
  });

  test("finds nested field and button with criteria", () => {
    const output = render();

    expect(output.find(EmailField).props()).toMatchObject({
      value: "ada@example.com",
      disabled: false,
    });
    expect(output.find("button", { name: "submit", text: "Sign in" })).toHaveProps({
      type: "submit",
      name: "submit",
    });
  });

  test("chains find through the form to reach the submit button", () => {
    const output = render();

    expect(output.find("form").find("button", { name: "submit" })).toHaveName("submit");
  });

  test("findAll returns both child components in the form", () => {
    const output = render();

    expect(output.findAll("button")).toHaveLength(1);
    expect(output.findAll(EmailField)).toHaveLength(1);
  });

  test("optional find when a field is absent", () => {
    const output = render();

    expect(output.find({ testId: "missing-field", optional: true })).not.toBeRendered();
  });
});
