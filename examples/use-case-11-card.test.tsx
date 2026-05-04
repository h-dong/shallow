import { shallow } from "../src";
import { Card } from "./use-case-11-card";

describe("Card", () => {
  const { render } = shallow(Card, {
    defaultProps: {
      title: "Profile",
      children: <span>Ada Lovelace</span>,
    },
  });

  test("render title", () => {
    const output = render();

    expect(output).toRenderText("Profile");
  });

  test("render children", () => {
    const output = render();

    expect(output).toRenderText("Ada Lovelace");
  });
});
