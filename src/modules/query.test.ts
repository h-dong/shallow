import {
  assertQueryCriteria,
  hasQueryCriteria,
  matchesCriteria,
  queryNodeScope,
  queryTreeNodes,
} from "./query";
import { createNode } from "./tree";

const readText = (node: ReturnType<typeof createNode>) => {
  const children = node.props.children;
  return typeof children === "string" ? children : "";
};

describe("query", () => {
  test("requires at least one matcher", () => {
    expect(hasQueryCriteria({})).toBe(false);
    expect(hasQueryCriteria({ type: "button" })).toBe(true);
    expect(() => assertQueryCriteria({})).toThrow(
      "query criteria must include at least one matcher.",
    );
  });

  test("matches type, props, test id, text, label, class, role, and name", () => {
    const button = createNode("button", {
      id: "save-btn",
      name: "submit",
      role: "button",
      className: "btn primary",
      "aria-label": "Save changes",
      "data-testid": "save-button",
      children: "Save",
    });

    expect(matchesCriteria(button, { type: "button" }, readText)).toBe(true);
    expect(matchesCriteria(button, { props: { name: "submit" } }, readText)).toBe(true);
    expect(matchesCriteria(button, { id: "save-btn" }, readText)).toBe(true);
    expect(matchesCriteria(button, { testId: "save-button" }, readText)).toBe(true);
    expect(matchesCriteria(button, { text: "Save" }, readText)).toBe(true);
    expect(matchesCriteria(button, { text: /save/i }, readText)).toBe(true);
    expect(matchesCriteria(button, { labelText: "Save changes" }, readText)).toBe(true);
    expect(matchesCriteria(button, { labelText: "Save" }, readText)).toBe(true);

    const labeledComponent = createNode("PrimaryButton", { label: "Continue" });
    expect(matchesCriteria(labeledComponent, { labelText: "Continue" }, readText)).toBe(true);
    expect(matchesCriteria(button, { className: "primary" }, readText)).toBe(true);
    expect(matchesCriteria(button, { role: "button" }, readText)).toBe(true);
    expect(matchesCriteria(button, { name: "submit" }, readText)).toBe(true);
    expect(matchesCriteria(button, { name: "missing" }, readText)).toBe(false);
    expect(matchesCriteria(button, { className: "primary" }, readText)).toBe(true);
    expect(matchesCriteria(createNode("div", { className: 1 }), { className: "x" }, readText)).toBe(
      false,
    );
    expect(matchesCriteria(createNode("nav", { role: "navigation" }), { role: "nav" }, readText)).toBe(
      true,
    );
    expect(matchesCriteria(createNode("button", {}), { role: "button" }, readText)).toBe(true);
    expect(matchesCriteria(button, { labelText: "Missing" }, readText)).toBe(false);
  });

  test("queries scoped roots and nodes", () => {
    const root = createNode("section", {}, [createNode("button", { children: "Save" })]);

    expect(queryTreeNodes([], { text: "Save" }, readText, { includeRoots: [root] })).toHaveLength(1);
    expect(
      queryTreeNodes([], { type: "section" }, readText, { includeRoots: [root] }),
    ).toHaveLength(1);
    expect(queryNodeScope(root, { type: "button" }, readText)?.props.children).toBe("Save");
  });
});
