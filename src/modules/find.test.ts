import { finalizeFind, findTreeNodes } from "./find";
import { createNode } from "./tree";

const readText = (node: ReturnType<typeof createNode>) => {
  const children = node.props.children;
  return typeof children === "string" ? children : "";
};

describe("findTreeNodes", () => {
  test("throws when criteria are empty", () => {
    expect(() => findTreeNodes([], {}, readText)).toThrow(
      "find requires a type or at least one matcher.",
    );
  });

  test("matches typed roots and descendants", () => {
    const root = createNode("button", { children: "Save" });
    const section = createNode("section", {}, [root]);

    expect(
      findTreeNodes([], { type: "button" }, readText, { includeRoots: [root] }),
    ).toEqual([root]);
    expect(findTreeNodes([section], { type: "button" }, readText, { childrenOnly: true })).toEqual(
      [root],
    );
  });

  test("returns undefined for optional misses", () => {
    expect(findTreeNodes([createNode("span", {})], { text: "missing", optional: true }, readText)).toEqual(
      [],
    );
    expect(
      finalizeFind(
        [],
        { text: "missing", optional: true },
        (node) => ({ props: () => node.props }) as never,
        (nodes) => nodes as never,
      ),
    ).toBeUndefined();
    expect(() =>
      finalizeFind(
        [],
        { text: "missing" },
        (node) => ({ props: () => node.props }) as never,
        (nodes) => nodes as never,
      ),
    ).toThrow("Expected output to render a matching node, but it was not found.");
  });

  test("filters type matches with extra criteria", () => {
    const button = createNode("button", { name: "save", children: "Save" });
    const other = createNode("button", { name: "cancel", children: "Cancel" });

    expect(
      findTreeNodes([button, other], { type: "button", name: "save" }, readText),
    ).toEqual([button]);
  });
});
