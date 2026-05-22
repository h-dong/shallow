import { shallow } from "../src";
import { TaskList, TaskRow } from "./use-case-16-task-list";

describe("TaskList", () => {
  const { render } = shallow(TaskList, {
    defaultProps: {
      tasks: [
        { id: "1", title: "Write tests", done: false },
        { id: "2", title: "Ship feature", done: true },
      ],
      onToggle: vi.fn(),
    },
  });

  test("renders every task row", () => {
    const output = render();

    expect(output).toHaveClass("task-list");
    expect(output).toHaveRole("list");
    expect(output.findAll(TaskRow)).toHaveLength(2);
  });

  test("finds rows by props", () => {
    const output = render();

    expect(output.find(TaskRow, { props: { done: false, title: "Write tests" } })).toHaveProps(
      "title",
      "Write tests",
    );
    expect(output.find(TaskRow, { props: { done: true, title: "Ship feature" } })).toHaveProps(
      "title",
      "Ship feature",
    );
  });

  test("findAll with criteria filters matching rows", () => {
    const output = render();

    expect(output.findAll(TaskRow)).toHaveLength(2);
    expect(output.findAll(TaskRow, { props: { done: true } })).toHaveLength(1);
    expect(output.findAll(TaskRow, { props: { done: false } })).toHaveLength(1);
  });

  test("toggles a task from the matching row", () => {
    const onToggle = vi.fn();
    const output = render({ onToggle });

    output.find(TaskRow, { props: { title: "Write tests" } }).trigger("onToggle");

    expect(onToggle).toHaveBeenCalledWith("1");
  });

  test("finds a row by test id prop on the component", () => {
    const output = render();

    expect(output.find({ testId: "task-Ship feature" }).props().title).toBe("Ship feature");
  });
});
