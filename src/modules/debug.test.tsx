import type { DebugTimelineEvent, MockCall, TreeNode } from "../types";
import * as debugModule from "./debug";
import { createDebug, getDebugTestInfo } from "./debug";
import { createNode, createOutput } from "./tree";

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

  test("formats trees for nodes returned from find", () => {
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const output = createOutput(vi.fn());
    output.setTree([
      createNode("div", { className: "relative min-w-0" }, [
        createNode("div", { className: "relative h-full" }, [
          createNode(
            "div",
            { contentEditable: true, role: "textbox", onPaste: () => undefined },
            [createNode("#text", { children: "Add new todo" })],
          ),
          createNode("span", { className: "placeholder" }, [
            createNode("#text", { children: "Add new todo" }),
          ]),
        ]),
      ]),
    ]);

    const textbox = output.find("div", { props: { role: "textbox" } });
    const debug = createDebug(textbox);

    expect(debug.tree()).toBe(
      [
        'div { contentEditable: true, role: "textbox", onPaste: fn }',
        '  #text { children: "Add new todo" }',
      ].join("\n"),
    );
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
      { args: [["a", "b"], { ok: true }], name: "loadMany", result: { ok: true } },
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
        '4. loadMany(["a", "b"], {"ok":true}) => {"ok":true}',
        '5. trigger Child.onSelect("1") => "selected"',
        '6. rerender Host { children: "Text" }',
      ].join("\n"),
    );
    expect(debug.mocks()).toBe(
      [
        "1. useFlag() => true",
        '2. loadMany(["a", "b"], {"ok":true}) => {"ok":true}',
        '3. load("id") threw "boom"',
      ].join("\n"),
    );
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

  test("omits test metadata when no active test is available", () => {
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    vi.spyOn(debugModule, "getDebugTestInfo").mockReturnValue({});
    const debug = createDebug(
      createDebugOutput({ nodes: [createNode("span", { children: "Ready" })] }),
    );

    debug.tree();

    const output = String(write.mock.calls[0]?.[0]);

    expect(output).not.toContain("test     ");
    vi.restoreAllMocks();
  });

  test("formats unknown debug values", () => {
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const debug = createDebug(
      createDebugOutput({
        mockCalls: [{ args: [Symbol("token")], name: "mark", result: true }],
      }),
    );

    expect(debug.mocks()).toContain("mark");
    expect(write).toHaveBeenCalled();
  });

  test("formats element values, mock methods without values, and empty sections", () => {
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const debug = createDebug(
      createDebugOutput({
        nodes: [createNode("section", { icon: <Child /> })],
        timelineEvents: [
          {
            kind: "mock-config",
            mock: { method: "reset", name: "useFlag" },
          },
        ],
      }),
    );

    expect(debug.tree()).toContain("<Child />");
    expect(debug.timeline()).toContain("mock useFlag.reset()");
  });

  test("falls back to stdout and promise scheduling when stderr is unavailable", async () => {
    const stdoutWrite = vi.fn();
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const queueMicrotask = globalThis.queueMicrotask;
    // @ts-expect-error test fallback scheduling path
    delete globalThis.queueMicrotask;

    type DebugProcess = {
      stderr?: { write?: (message: string) => unknown };
      stdout?: { write?: (message: string) => unknown };
    };
    const globalScope = globalThis as { process?: DebugProcess };
    const originalProcess = globalScope.process;
    globalScope.process = { stdout: { write: stdoutWrite } };

    createDebug(createDebugOutput({ nodes: [createNode("span", { children: "Ready" })] }));
    await Promise.resolve();

    expect(stdoutWrite).toHaveBeenCalled();
    expect(consoleLog).not.toHaveBeenCalled();

    globalThis.queueMicrotask = queueMicrotask;
    if (originalProcess === undefined) {
      delete globalScope.process;
    } else {
      globalScope.process = originalProcess;
    }
    consoleLog.mockRestore();
  });

  test("logs through console when no process streams exist", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
    type DebugProcess = {
      stderr?: { write?: (message: string) => unknown };
      stdout?: { write?: (message: string) => unknown };
    };
    const globalScope = globalThis as { process?: DebugProcess };
    const originalProcess = globalScope.process;
    delete globalScope.process;

    createDebug(createDebugOutput({ nodes: [createNode("span", { children: "Ready" })] }));
    await Promise.resolve();

    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining("Shallow Debug"));

    if (originalProcess === undefined) {
      delete globalScope.process;
    } else {
      globalScope.process = originalProcess;
    }
    consoleLog.mockRestore();
  });
});
