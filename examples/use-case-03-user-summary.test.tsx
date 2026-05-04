import { shallow } from "../src";
import { Avatar, RolePill, UserSummary } from "./use-case-03-user-summary";

describe("UserSummary", () => {
  const { render } = shallow(UserSummary, {
    defaultProps: {
      user: {
        name: "Ada",
        role: "admin",
        avatarUrl: "/ada.png",
      },
    },
  });

  test("render name", () => {
    const output = render();

    expect(output).toRenderText("Ada");
  });

  test("render avatar", () => {
    const output = render();

    expect(output).toRender(Avatar, {
      name: "Ada",
      src: "/ada.png",
    });
  });

  test("render role", () => {
    const output = render();

    expect(output).toRender(RolePill, {
      role: "admin",
    });
  });
});
