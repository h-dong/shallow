import { shallow } from "../src";
import { Counter } from "./use-case-14-counter";

describe("Counter", () => {
  const { render } = shallow(Counter);

  test("renders the initial state", () => {
    const output = render();

    expect(output.find("button")).toRenderText("Clicked 0 times");
  });

  test("updates state when the button is clicked", () => {
    const output = render();

    output.find("button").click();

    expect(output.find("button")).toRenderText("Clicked 1 time");
  });
});
