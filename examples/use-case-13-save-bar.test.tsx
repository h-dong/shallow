import { shallow } from "../src";
import { Button, SaveBar } from "./use-case-13-save-bar";

describe("SaveBar", () => {
  const { render, mock } = shallow(SaveBar, {
    defaultProps: {
      disabled: false,
      onSave: vi.fn(),
    },
  });

  test("render button props", () => {
    const output = render();

    expect(output).toRender(Button, {
      disabled: false,
      children: "Save",
    });
  });

  test("can use a custom child component stub", () => {
    const onSave = vi.fn();

    mock(Button).component(({ disabled, onClick, children }) => (
      <button disabled={disabled} onClick={onClick}>
        {children}
      </button>
    ));

    const output = render({
      onSave,
    });

    output.find(Button).trigger("onClick");

    expect(onSave).toHaveBeenCalledOnce();
  });
});
