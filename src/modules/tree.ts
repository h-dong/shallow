import type {
  ComponentNode,
  ComponentNodeList,
  DebugTimelineEvent,
  FindAllFn,
  FindCriteria,
  FindFn,
  FindOptions,
  MockCall,
  PropsRecord,
  ShallowRenderType,
  TreeNode,
  TriggerInteraction,
} from "../types";
import {
  finalizeFind,
  findTreeNodes,
  isTypeOnlyFind,
  toFindCriteria,
  type InternalFindCriteria,
} from "./find";
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

export const getRenderedNodeText = (node: TreeNode): string => {
  const nodeText = (current: TreeNode): string =>
    getText(current.props.children) + current.children.map(nodeText).join("");

  return nodeText(node);
};

const readNodeText = (node: TreeNode) => getRenderedNodeText(node);

type AfterTrigger = (interaction: TriggerInteraction) => void;

const createComponentNodeList = (
  nodes: TreeNode[],
  afterTrigger?: AfterTrigger,
): ComponentNodeList =>
  nodes.map((node) => createComponentNode(node, afterTrigger)) as ComponentNodeList;

const toFindScopeOptions = (scope: {
  nodes: TreeNode[];
  includeRoots?: TreeNode[];
  childrenOnly?: boolean;
}) => ({
  ...(scope.includeRoots ? { includeRoots: scope.includeRoots } : {}),
  ...(scope.childrenOnly ? { childrenOnly: scope.childrenOnly } : {}),
});

const createFindHandlers = (
  getScope: (criteria: InternalFindCriteria) => {
    nodes: TreeNode[];
    includeRoots?: TreeNode[];
    childrenOnly?: boolean;
  },
  afterTrigger?: AfterTrigger,
) => {
  const createNode = (treeNode: TreeNode) => createComponentNode(treeNode, afterTrigger);
  const createList = (treeNodes: TreeNode[]) => createComponentNodeList(treeNodes, afterTrigger);

  const run = (
    typeOrCriteria: ShallowRenderType | FindCriteria,
    options: FindOptions | undefined,
    all: boolean,
  ): ComponentNode | ComponentNodeList | undefined => {
    const criteria: InternalFindCriteria = { ...toFindCriteria(typeOrCriteria, options), all };
    const scope = getScope(criteria);
    const matches = findTreeNodes(scope.nodes, criteria, readNodeText, toFindScopeOptions(scope));

    return finalizeFind(matches, criteria, createNode, createList);
  };

  const find = (typeOrCriteria: ShallowRenderType | FindCriteria, options?: FindOptions) =>
    run(typeOrCriteria, options, false) as ComponentNode | undefined;

  const findAll = (typeOrCriteria: ShallowRenderType | FindCriteria, options?: FindOptions) =>
    run(typeOrCriteria, options, true) as ComponentNodeList;

  return { find: find as FindFn, findAll: findAll as FindAllFn };
};

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
    text: () => getRenderedNodeText(node),
    elementTag: () => node.typeName,
    nodes: () => [node],
    ...createFindHandlers((criteria) => {
      const typeOnly = isTypeOnlyFind(criteria);

      return typeOnly
        ? { nodes: node.children, childrenOnly: true }
        : { nodes: node.children, includeRoots: [node] };
    }, afterTrigger),
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
    ...createFindHandlers(() => ({ nodes: tree }), afterTrigger),
    text: () => tree.map(getRenderedNodeText).join(""),
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
  type: ShallowRenderType,
  props: PropsRecord,
  children: TreeNode[] = [],
): TreeNode => ({
  type,
  typeName: getName(type),
  props: getComparableProps(props),
  children,
});
