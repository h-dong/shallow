import { shallow } from "../src";
import { TodoList, TodoRow } from "./use-case-08-todo-list";

describe("TodoList", () => {
  const { render } = shallow(TodoList, {
    defaultProps: {
      todos: [
        { id: "1", title: "Write PRD", done: true },
        { id: "2", title: "Build MVP", done: false },
      ],
    },
  });

  test("render one row per todo", () => {
    const output = render();

    expect(output.findAll(TodoRow)).toHaveLength(2);
  });

  test("render first todo row", () => {
    const output = render();
    const rows = output.findAll(TodoRow);

    expect(rows[0]).toHaveProps({
      id: "1",
      title: "Write PRD",
      done: true,
    });
  });

  test("render second todo row", () => {
    const output = render();
    const rows = output.findAll(TodoRow);

    expect(rows[1]).toHaveProps({
      id: "2",
      title: "Build MVP",
      done: false,
    });
  });
});
