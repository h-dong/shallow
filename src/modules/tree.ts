import type {
  ComponentNode,
  ComponentNodeList,
  DebugTimelineEvent,
  MockCall,
  PropsRecord,
  TreeNode,
  TriggerInteraction,
} from "../types";
import { getComparableProps, getName, isElement } from "./utils";

type CallableProp = (...args: unknown[]) => unknown;

const isCallable = (value: unknown): value is CallableProp => typeof value === "function";

const getText = (value: unknown): string => {
  if (value == null || typeof value === "boolean") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(getText).join("");
  }

  if (isElement(value)) {
    return getText(value.props.children);
  }

  return "";
};

const nodeText = (node: TreeNode): string => {
  return getText(node.props.children) + node.children.map(nodeText).join("");
};

const matchesType = (node: TreeNode, type: unknown) => {
  if (node.type === type) {
    return true;
  }

  return getName(type) === node.typeName;
};

const collect = (nodes: TreeNode[], type: unknown): TreeNode[] => {
  const matches: TreeNode[] = [];

  for (const node of nodes) {
    if (matchesType(node, type)) {
      matches.push(node);
    }

    matches.push(...collect(node.children, type));
  }

  return matches;
};

const toComponentNodeList = (nodes: ComponentNode[]): ComponentNodeList =>
  nodes as ComponentNodeList;

type AfterTrigger = (interaction: TriggerInteraction) => void;

const createComponentNode = (node: TreeNode, afterTrigger?: AfterTrigger): ComponentNode => {
  const trigger = (propName: string, ...args: unknown[]) => {
    const callback = node.props[propName];

    if (!isCallable(callback)) {
      throw new Error(`${node.typeName}.${propName} is not a function prop.`);
    }

    const result = callback(...args);
    afterTrigger?.({
      typeName: node.typeName,
      propName,
      args,
      result,
    });

    return result;
  };
  const click = (...args: unknown[]) => {
    if (!isCallable(node.props.onClick)) {
      console.error(`${node.typeName}.onClick is not a function prop.`);
      return undefined;
    }

    return trigger("onClick", ...args);
  };

  return {
    props: () => node.props,
    text: () => nodeText(node),
    find: (type: unknown) => {
      const child = collect(node.children, type)[0];

      if (!child) {
        throw new Error(
          `Expected ${node.typeName} to render ${getName(type)}, but it was not found.`,
        );
      }

      return createComponentNode(child, afterTrigger);
    },
    findAll: (type: unknown) =>
      toComponentNodeList(
        collect(node.children, type).map((child) => createComponentNode(child, afterTrigger)),
      ),
    trigger,
    click,
  };
};

export const createOutput = (
  rerenderImpl: (nextProps?: PropsRecord) => unknown,
  afterTrigger?: AfterTrigger,
  initialTimelineEvents: DebugTimelineEvent[] = [],
) => {
  let tree: TreeNode[] = [];
  const interactions: TriggerInteraction[] = [];
  const mockCalls: MockCall[] = [];
  const timelineEvents: DebugTimelineEvent[] = [...initialTimelineEvents];

  const output = {
    __shallow: true,
    setTree: (nextTree: TreeNode[]) => {
      tree = nextTree;
      return output;
    },
    find: (type: unknown) => {
      const node = collect(tree, type)[0];

      if (!node) {
        throw new Error(`Expected output to render ${getName(type)}, but it was not found.`);
      }

      return createComponentNode(node, afterTrigger);
    },
    findAll: (type: unknown) =>
      toComponentNodeList(
        collect(tree, type).map((node) => createComponentNode(node, afterTrigger)),
      ),
    text: () => tree.map(nodeText).join(""),
    rerender: rerenderImpl,
    unmount: () => {
      tree = [];
    },
    nodes: () => tree,
    interactions: () => interactions,
    mockCalls: () => mockCalls,
    timelineEvents: () => timelineEvents,
    addInteraction: (interaction: TriggerInteraction) => {
      interactions.push(interaction);
    },
    addMockCall: (call: MockCall) => {
      mockCalls.push(call);
    },
    addTimelineEvent: (event: DebugTimelineEvent) => {
      timelineEvents.push(event);
    },
    addTimelineEvents: (events: DebugTimelineEvent[]) => {
      timelineEvents.push(...events);
    },
  };

  return output;
};

export const createNode = (
  type: unknown,
  props: PropsRecord,
  children: TreeNode[] = [],
): TreeNode => ({
  type,
  typeName: getName(type),
  props: getComparableProps(props),
  children,
});
