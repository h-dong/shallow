import { createNode, createOutput } from "./tree";

function TodoRow() {
  return null;
}

describe("tree", () => {
  test("creates nodes with comparable props and type names", () => {
    const node = createNode(TodoRow, { id: "1", key: "hidden" }, [
      createNode("#text", { children: "Write tests" }),
    ]);

    expect(node.type).toBe(TodoRow);
    expect(node.typeName).toBe("TodoRow");
    expect(node.props).toEqual({ id: "1" });
    const textNode = node.children[0];

    if (!textNode) {
      throw new Error("Expected createNode to keep the text child.");
    }

    expect(textNode.typeName).toBe("#text");
  });

  test("finds nodes by component, host type, and display name", () => {
    const output = createOutput(vi.fn());
    const RenamedRow = () => null;
    RenamedRow.displayName = "RenamedRow";
    output.setTree([
      createNode("ul", { children: undefined }, [
        createNode(TodoRow, { title: "First" }),
        createNode(RenamedRow, { title: "Second" }),
      ]),
    ]);

    expect(output.find("ul").props()).toEqual({ children: undefined });
    expect(output.find(TodoRow).props()).toEqual({ title: "First" });
    expect(output.find("RenamedRow").props()).toEqual({ title: "Second" });
    expect(output.findAll(TodoRow)).toHaveLength(1);
  });

  test("finds nodes by partial props", () => {
    const output = createOutput(vi.fn());
    output.setTree([
      createNode("ul", { children: undefined }, [
        createNode(TodoRow, { meta: { id: "1", done: false }, title: "First" }),
        createNode(TodoRow, { meta: { id: "2", done: true }, title: "Second" }),
      ]),
    ]);

    expect(output.find({ type: TodoRow, props: { meta: { id: "2" } } })?.props()).toEqual({
      meta: { id: "2", done: true },
      title: "Second",
    });
    expect(
      output.find({ type: TodoRow, props: { title: "Missing" }, optional: true }),
    ).not.toBeRendered();
  });

  test("finds nodes by partial props", () => {
    const output = createOutput(vi.fn());
    output.setTree([
      createNode("ul", { children: undefined }, [
        createNode(TodoRow, { meta: { id: "1", done: false }, title: "First" }),
        createNode(TodoRow, { meta: { id: "2", done: true }, title: "Second" }),
      ]),
    ]);

    expect(output.find(TodoRow, { props: { title: "First" } }).props()).toEqual({
      meta: { id: "1", done: false },
      title: "First",
    });
    expect(() => output.find(TodoRow, { props: { title: "Missing" } })).toThrow(
      "Expected output to render TodoRow, but it was not found.",
    );
  });

  test("queries nodes with criteria and supports chaining", () => {
    const output = createOutput(vi.fn());
    output.setTree([
      createNode("section", { children: undefined }, [
        createNode("button", { name: "cancel", children: "Cancel" }),
        createNode("button", { name: "submit", children: "Save" }),
      ]),
    ]);

    expect(output.find({ type: "button", name: "submit" }).props()).toEqual({
      name: "submit",
      children: "Save",
    });
    expect(output.find({ text: "Missing", optional: true })).not.toBeRendered();
    expect(output.find("section").find("button", { name: "submit" }).text()).toBe("Save");
    expect(output.findAll("button", { name: "submit" })).toHaveLength(1);

    output.setTree([createNode("button", { name: "submit", children: "Save" })]);
    expect(output.find("button", { name: "submit" }).text()).toBe("Save");
  });

  test("finds nodes by id and test id", () => {
    const output = createOutput(vi.fn());
    output.setTree([
      createNode("section", { id: "container", "data-testid": "container" }, [
        createNode("button", { id: "save-button", "data-testid": "save-button", children: "Save" }),
      ]),
    ]);

    expect(output.find({ id: "save-button" }).props()).toEqual({
      id: "save-button",
      "data-testid": "save-button",
      children: "Save",
    });
    expect(output.find({ id: "missing", optional: true })).not.toBeRendered();
    expect(output.find({ testId: "save-button" }).props()).toEqual({
      id: "save-button",
      "data-testid": "save-button",
      children: "Save",
    });
    expect(output.find({ testId: "missing", optional: true })).not.toBeRendered();
  });

  test("reads nested text from strings, numbers, arrays, and React children", () => {
    const output = createOutput(vi.fn());
    output.setTree([
      createNode("section", { children: ["Count: ", 2, <span key="ignored"> done</span>] }, [
        createNode("strong", { children: "!" }),
      ]),
    ]);

    expect(output.text()).toBe("Count: 2 done!");
    expect(output.find("section").text()).toBe("Count: 2 done!");
  });

  test("triggers callbacks and reports non-functions", () => {
    const onSelect = vi.fn();
    const output = createOutput(vi.fn());
    output.setTree([createNode(TodoRow, { onSelect, title: "First" })]);

    output.find(TodoRow).trigger("onSelect", "1");

    expect(onSelect).toHaveBeenCalledWith("1");
    expect(() => output.find(TodoRow).trigger("title")).toThrow(
      "TodoRow.title is not a function prop.",
    );
  });

  test("clicks nodes by triggering onClick", () => {
    const onClick = vi.fn();
    const afterTrigger = vi.fn();
    const output = createOutput(vi.fn(), afterTrigger);
    output.setTree([createNode("button", { onClick, children: "Save" })]);

    output.find("button").click("event");

    expect(onClick).toHaveBeenCalledWith("event");
    expect(afterTrigger).toHaveBeenCalledOnce();
  });

  test("logs an error when clicking nodes without onClick", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const afterTrigger = vi.fn();
    const output = createOutput(vi.fn(), afterTrigger);
    output.setTree([createNode("button", { children: "Save" })]);

    expect(output.find("button").click()).toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith("button.onClick is not a function prop.");
    expect(afterTrigger).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  test("rerenders, unmounts, and reports missing nodes", () => {
    const rerender = vi.fn();
    const output = createOutput(rerender);
    output.setTree([createNode("span", { children: "Loaded" })]);

    expect(output.rerender({ next: true })).not.toBeRendered();
    expect(rerender).toHaveBeenCalledWith({ next: true });

    output.unmount();

    expect(output).not.toBeRendered();
    expect(() => output.find("span")).toThrow(
      "Expected output to render span, but it was not found.",
    );
  });
});
