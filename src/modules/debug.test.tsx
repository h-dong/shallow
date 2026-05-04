import type { DebugTimelineEvent, MockCall, TreeNode } from "../types";
import { createDebug, getDebugTestInfo } from "./debug";
import { createNode } from "./tree";

function Child() {
  return null;
}

const createDebugOutput = ({
  mockCalls = [],
  nodes = [],
  timelineEvents = [],
}: {
  mockCalls?: MockCall[];
  nodes?: TreeNode[];
  timelineEvents?: DebugTimelineEvent[];
} = {}) => ({
  mockCalls: () => mockCalls,
  nodes: () => nodes,
  timelineEvents: () => timelineEvents,
});

describe("debug", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("returns stable placeholders for unknown output", () => {
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const debug = createDebug(undefined);

    expect(debug.tree()).toBe("[]");
    expect(debug.timeline()).toBe("No timeline events recorded.");
    expect(debug.mocks()).toBe("No mock calls recorded.");
    expect(debug.default()).toBeUndefined();
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Shallow Debug"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Component tree"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Default"));
  });

  test("formats component trees", () => {
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const debug = createDebug(
      createDebugOutput({
        nodes: [
          createNode("section", { children: <Child />, id: "root" }, [
            createNode(
              Child,
              {
                active: true,
                children: "Nested",
                count: 2,
                label: "child",
                onSelect: () => undefined,
              },
              [createNode("#text", { children: "Text" })],
            ),
          ]),
        ],
      }),
    );

    expect(debug.tree()).toBe(
      [
        'section { id: "root" }',
        '  Child { active: true, children: "Nested", count: 2, label: "child", onSelect: fn }',
        '    #text { children: "Text" }',
      ].join("\n"),
    );
    expect(write).toHaveBeenCalledWith(expect.stringContaining("debug > formats component trees"));
  });

  test("does not write the default view when a specific view is used", async () => {
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const debug = createDebug(
      createDebugOutput({
        nodes: [createNode("span", { children: "Ready" })],
      }),
    );

    expect(debug.tree()).toBe('span { children: "Ready" }');
    await Promise.resolve();

    expect(write).not.toHaveBeenCalledWith(expect.stringContaining("Default"));
  });

  test("formats timeline events and mock calls", () => {
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const mockCalls: MockCall[] = [
      { args: [], name: "useFlag", result: true },
      { args: ["id"], error: "boom", name: "load" },
    ];
    const debug = createDebug(
      createDebugOutput({
        mockCalls,
        timelineEvents: [
          {
            kind: "mock-config",
            mock: { method: "returnFull", name: "useFlag", value: false },
          },
          {
            componentName: "Host",
            kind: "render",
            props: { onSelect: () => undefined },
          },
          { call: mockCalls[0]!, kind: "mock-call" },
          { call: mockCalls[1]!, kind: "mock-call" },
          {
            interaction: {
              args: ["1"],
              propName: "onSelect",
              result: "selected",
              typeName: "Child",
            },
            kind: "trigger",
          },
          {
            componentName: "Host",
            kind: "rerender",
            props: { children: "Text" },
          },
        ],
      }),
    );

    expect(debug.timeline()).toBe(
      [
        "1. mock useFlag.returnFull(false)",
        "2. render Host { onSelect: fn }",
        "3. useFlag() => true",
        '4. load("id") threw "boom"',
        '5. trigger Child.onSelect("1") => "selected"',
        '6. rerender Host { children: "Text" }',
      ].join("\n"),
    );
    expect(debug.mocks()).toBe(["1. useFlag() => true", '2. load("id") threw "boom"'].join("\n"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Timeline"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Mocks"));
  });

  test("writes a default combined debug view when created", async () => {
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    createDebug(
      createDebugOutput({
        nodes: [createNode("span", { children: "Ready" })],
        timelineEvents: [{ componentName: "Host", kind: "render", props: {} }],
      }),
    );
    await Promise.resolve();

    expect(write).toHaveBeenCalledWith(expect.stringContaining("Default"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Timeline:"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Mocks:"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Component tree:"));
  });

  test("reads the active test state", () => {
    expect(getDebugTestInfo()?.currentTestName).toContain("reads the active test state");
  });
});
