import { shallow } from "../src";
import { TodoPicker, TodoRow } from "./use-case-09-todo-picker";

describe("TodoPicker", () => {
  const { render } = shallow(TodoPicker, {
    defaultProps: {
      todos: [
        { id: "1", title: "Write PRD" },
        { id: "2", title: "Build MVP" },
      ],
      onSelect: vi.fn(),
    },
  });

  test("render one row per todo", () => {
    const output = render();

    expect(output.findAll(TodoRow)).toHaveLength(2);
  });

  test("click on row calls onSelect with todo id", () => {
    const onSelect = vi.fn();

    const output = render({
      onSelect,
    });

    const secondRow = output.findAll(TodoRow)[1];

    secondRow.trigger("onSelect");

    expect(onSelect).toHaveBeenCalledWith("2");
  });
});
