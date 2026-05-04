import { shallow } from "../src";
import { Button, UserActions } from "./use-case-05-user-actions";

describe("UserActions", () => {
  const { render } = shallow(UserActions, {
    defaultProps: {
      name: "Ada",
      onEdit: vi.fn(),
    },
  });

  test("render button", () => {
    const output = render();

    expect(output).toRender(Button, {
      children: "Edit profile",
    });
  });

  test("click on button calls onEdit with user name", () => {
    const onEdit = vi.fn();

    const output = render({
      onEdit,
    });

    output.find(Button).trigger("onClick");

    expect(onEdit).toHaveBeenCalledWith("Ada");
  });
});
