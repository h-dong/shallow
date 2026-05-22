import { assertQueryCriteria, hasQueryCriteria, matchesCriteria } from "./query";
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
  });
});
