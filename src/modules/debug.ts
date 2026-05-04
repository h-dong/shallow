import type {
  DebugTimelineEvent,
  MockCall,
  MockConfiguration,
  PropsRecord,
  TreeNode,
  TriggerInteraction,
} from "../types";
import { getName, isElement, isRecord } from "./utils";

type DebuggableOutput = {
  nodes: () => TreeNode[];
  interactions?: () => TriggerInteraction[];
  mockCalls?: () => MockCall[];
  timelineEvents?: () => DebugTimelineEvent[];
};

const isDebuggableOutput = (value: unknown): value is DebuggableOutput => {
  return isRecord(value) && typeof value.nodes === "function";
};

const formatDebugValue = (value: unknown): string => {
  if (typeof value === "function") {
    return "fn";
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean" || value == null) {
    return String(value);
  }

  if (isElement(value)) {
    return `<${getName(value.type)} />`;
  }

  if (Array.isArray(value)) {
    return `[${value.map(formatDebugValue).join(", ")}]`;
  }

  if (isRecord(value)) {
    return JSON.stringify(value);
  }

  return String(value);
};

const formatDebugProps = (props: PropsRecord) => {
  const entries = Object.entries(props).filter(
    ([key, value]) => key !== "children" || typeof value === "string" || typeof value === "number",
  );

  if (entries.length === 0) {
    return "";
  }

  return ` { ${entries.map(([key, value]) => `${key}: ${formatDebugValue(value)}`).join(", ")} }`;
};

const formatDebugTree = (nodes: TreeNode[], depth = 0): string => {
  if (nodes.length === 0) {
    return "[]";
  }

  return nodes
    .flatMap((node) => {
      const indent = "  ".repeat(depth);
      const line = `${indent}${node.typeName}${formatDebugProps(node.props)}`;
      const children = formatDebugTree(node.children, depth + 1);

      return children === "[]" ? [line] : [line, children];
    })
    .join("\n");
};

const hasCallError = (
  call: Pick<MockCall, "error">,
): call is Pick<MockCall, "error"> & {
  error: unknown;
} => "error" in call;

const formatDebugMockCall = (call: MockCall, index: number) => {
  const args = call.args.map(formatDebugValue).join(", ");

  if (hasCallError(call)) {
    return `${index + 1}. ${call.name}(${args}) threw ${formatDebugValue(call.error)}`;
  }

  return `${index + 1}. ${call.name}(${args}) => ${formatDebugValue(call.result)}`;
};

const formatDebugMockConfiguration = (mock: MockConfiguration) => {
  if ("value" in mock) {
    return `mock ${mock.name}.${mock.method}(${formatDebugValue(mock.value)})`;
  }

  return `mock ${mock.name}.${mock.method}()`;
};

const formatDebugInteraction = (interaction: TriggerInteraction) => {
  const args = interaction.args.map(formatDebugValue).join(", ");
  const result =
    interaction.result === undefined ? "" : ` => ${formatDebugValue(interaction.result)}`;

  return `${interaction.typeName}.${interaction.propName}(${args})${result}`;
};

const formatDebugTimelineEvent = (event: DebugTimelineEvent, index: number) => {
  if (event.kind === "mock-config") {
    return `${index + 1}. ${formatDebugMockConfiguration(event.mock)}`;
  }

  if (event.kind === "mock-call") {
    return formatDebugMockCall(event.call, index);
  }

  if (event.kind === "trigger") {
    return `${index + 1}. trigger ${formatDebugInteraction(event.interaction)}`;
  }

  return `${index + 1}. ${event.kind} ${event.componentName}${formatDebugProps(event.props)}`;
};

const formatDebugTimeline = (events: DebugTimelineEvent[]) => {
  if (events.length === 0) {
    return "No timeline events recorded.";
  }

  return events.map(formatDebugTimelineEvent).join("\n");
};

const formatDebugMocks = (calls: MockCall[]) => {
  if (calls.length === 0) {
    return "No mock calls recorded.";
  }

  return calls.map(formatDebugMockCall).join("\n");
};

const formatDebugDefault = (tree: string, timeline: string, mocks: string) => {
  return [`Timeline:`, timeline, "", "Mocks:", mocks, "", "Component tree:", tree].join("\n");
};

const getDebugCaller = () => {
  const stack = new Error().stack?.split("\n").slice(1) ?? [];
  const caller = stack.find(
    (line) =>
      !line.includes("getDebugCaller") &&
      !line.includes("formatDebugOutput") &&
      !line.includes("writeDebugOutput") &&
      !line.includes("debug") &&
      !line.includes("src/modules/shallow") &&
      !line.includes("src/modules/debug") &&
      !line.includes("node_modules"),
  );

  return caller?.trim();
};

type TestExpectState = {
  currentTestName?: string;
  testPath?: string;
};

type TestExpect = {
  getState?: () => TestExpectState;
};

export const getDebugTestInfo = () => {
  const expect = (globalThis as typeof globalThis & { expect?: TestExpect }).expect;
  return expect?.getState?.();
};

const ANSI = {
  blue: "\u001B[34m",
  bold: "\u001B[1m",
  cyan: "\u001B[36m",
  dim: "\u001B[2m",
  green: "\u001B[32m",
  magenta: "\u001B[35m",
  reset: "\u001B[0m",
  yellow: "\u001B[33m",
} as const;

const color = (value: string, ...codes: string[]) => {
  return `${codes.join("")}${value}${ANSI.reset}`;
};

let hasWrittenDebugOutput = false;

const formatDebugContentBlock = (contents: string) => {
  if (!contents) {
    return `${color("│", ANSI.dim)}  ${color("(empty)", ANSI.dim)}`;
  }

  return contents
    .split("\n")
    .map((line) => `${color("│", ANSI.dim)}  ${line}`)
    .join("\n");
};

const writeDebugOutput = (message: string) => {
  const process = (
    globalThis as typeof globalThis & {
      process?: {
        stderr?: { write?: (message: string) => unknown };
        stdout?: { write?: (message: string) => unknown };
      };
    }
  ).process;
  const stream = process?.stderr ?? process?.stdout;
  const output = `${hasWrittenDebugOutput ? "" : "\n"}${message}\n\n`;
  hasWrittenDebugOutput = true;

  if (stream?.write) {
    stream.write(output);
    return;
  }

  console.log(output);
};

const formatDebugOutput = (section: string, contents: string) => {
  const caller = getDebugCaller();
  const testInfo = getDebugTestInfo();
  const testName = testInfo?.currentTestName;
  const detailRows = [
    testName ? `${color("│", ANSI.dim)}  ${color("test", ANSI.yellow)}     ${testName}` : undefined,
    caller ? `${color("│", ANSI.dim)}  ${color("callsite", ANSI.yellow)} ${caller}` : undefined,
  ].filter(Boolean);

  return [
    color("╭─ Shallow Debug", ANSI.bold, ANSI.cyan),
    ...detailRows,
    `${color("├─", ANSI.dim)} ${color(section, ANSI.bold, ANSI.magenta)}`,
    formatDebugContentBlock(contents),
    color("╰─", ANSI.dim),
  ].join("\n");
};

const indentDebugContents = (contents: string) => {
  return contents
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
};

const writeDebugSection = (section: string, contents: string) => {
  writeDebugOutput(formatDebugOutput(section, indentDebugContents(contents)));
  return contents;
};

const runAfterCurrentCall = (callback: () => void) => {
  if (typeof globalThis.queueMicrotask === "function") {
    globalThis.queueMicrotask(callback);
    return;
  }

  void Promise.resolve().then(callback);
};

export const createDebug = (output: unknown) => {
  const tree = () => formatDebugTree(isDebuggableOutput(output) ? output.nodes() : []);
  const timeline = () =>
    formatDebugTimeline(isDebuggableOutput(output) ? (output.timelineEvents?.() ?? []) : []);
  const mocks = () =>
    formatDebugMocks(isDebuggableOutput(output) ? (output.mockCalls?.() ?? []) : []);
  let shouldWriteDefault = true;
  const cancelDefault = () => {
    shouldWriteDefault = false;
  };
  const defaultDebug = () => {
    cancelDefault();
    writeDebugSection("Default", formatDebugDefault(tree(), timeline(), mocks()));
    return undefined;
  };
  const debugApi = {
    default: defaultDebug,
    tree: () => {
      cancelDefault();
      return writeDebugSection("Component tree", tree());
    },
    timeline: () => {
      cancelDefault();
      return writeDebugSection("Timeline", timeline());
    },
    mocks: () => {
      cancelDefault();
      return writeDebugSection("Mocks", mocks());
    },
  };

  runAfterCurrentCall(() => {
    if (shouldWriteDefault) {
      defaultDebug();
    }
  });

  return debugApi;
};
