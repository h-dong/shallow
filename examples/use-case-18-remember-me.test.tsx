import { shallow } from "../src";
import { RememberMe } from "./use-case-18-remember-me";

describe("RememberMe", () => {
  const { render } = shallow(RememberMe, {
    defaultProps: {
      checked: false,
      onChange: vi.fn(),
    },
  });

  test("asserts unchecked state on the outer label", () => {
    const output = render();

    expect(output).toBeElement("label");
    expect(output).toHaveClass("remember-me");
    expect(output).toHaveText("Remember me");
    expect(output.find("input", { props: { type: "checkbox" } })).toBeUnchecked();
  });

  test("asserts checked state when opted in", () => {
    const output = render({ checked: true });

    expect(output.find("input", { props: { type: "checkbox" } })).toBeChecked();
  });
});
