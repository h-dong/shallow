import { shallow } from "../src";
import { Badge } from "./use-case-01-badge";

describe("Badge", () => {
  const { render } = shallow(Badge, {
    defaultProps: {
      label: "Active",
    },
  });

  test("render label", () => {
    const output = render();

    expect(output).toRenderText("Active");
  });

  test("render tone", () => {
    const output = render({
      tone: "success",
    });

    expect(output.find("span")).toHaveProps({
      "data-tone": "success",
    });
  });

  test("render default tone", () => {
    const output = render();

    expect(output.find("span")).toHaveProps({
      "data-tone": "neutral",
    });
  });
});
