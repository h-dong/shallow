import { shallow } from "../src";
import { EmptyState } from "./use-case-02-empty-state";

describe("EmptyState", () => {
  const { render } = shallow(EmptyState, {
    defaultProps: {
      title: "No projects",
    },
  });

  test("render only title", () => {
    const output = render();

    expect(output).toRenderText("No projects");
  });

  test("render description when provided", () => {
    const output = render({
      description: "Create your first project to get started.",
    });

    expect(output).toRenderText("Create your first project");
  });

  test("render without description when unavailable", () => {
    const output = render();

    expect(output).not.toRenderText("Create your first project");
  });

  test("render action when provided", () => {
    const output = render({
      action: <button>Create project</button>,
    });

    expect(output).toRenderText("Create project");
  });

  test("render without action when unavailable", () => {
    const output = render();

    expect(output).not.toRenderText("Create project");
  });
});
