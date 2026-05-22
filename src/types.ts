import type React from "react";

export type PropsRecord = Record<string, unknown>;
export type UnknownFunction = (...args: unknown[]) => unknown;
export type ComponentImplementation<Props extends object = PropsRecord> = {
  bivarianceHack(props: Props): React.ReactNode;
}["bivarianceHack"];
export type MockComponentProps<Target> =
  Target extends React.ComponentType<infer ComponentProps extends object>
    ? ComponentProps
    : PropsRecord;
export type MockFunctionImplementation<Target> = Target extends (
  ...args: infer Args
) => infer Result
  ? (...args: Args) => Result
  : UnknownFunction;
export type MockReturn<Target> = Target extends (...args: infer _Args) => infer Result
  ? Result
  : unknown;

export type MockApi<Target> = {
  returnFull: (value: MockReturn<Target>) => MockApi<Target>;
  return: (value: unknown) => MockApi<Target>;
  callsFake: (implementation: MockFunctionImplementation<Target>) => MockApi<Target>;
  throws: (error: unknown) => MockApi<Target>;
  component: (
    implementation?: ComponentImplementation<MockComponentProps<Target>>,
  ) => MockApi<Target>;
  reset: () => MockApi<Target>;
  calls: () => MockState["calls"];
  renders: () => unknown[];
};

export type MockCall = {
  name: string;
  args: unknown[];
  result?: unknown;
  error?: unknown;
};

export type MockConfiguration = {
  name: string;
  method: "returnFull" | "return" | "callsFake" | "throws" | "component" | "reset";
  value?: unknown;
};

export type MockState = {
  name: string;
  kind?: "full" | "partial" | "fake" | "throw";
  value?: unknown;
  implementation?: UnknownFunction;
  calls: MockCall[];
  componentImplementation?: ComponentImplementation;
};

/** Host element tag, `"#text"`, display name, or React component type used to locate nodes. */
export type ShallowRenderType = string | React.ComponentType<any> | React.ExoticComponent<any>;

export type QueryCriteria = {
  type?: ShallowRenderType;
  props?: PropsRecord;
  id?: string;
  testId?: string;
  text?: string | RegExp;
  labelText?: string;
  className?: string;
  role?: string;
  name?: string;
};

export type FindOptions = Omit<QueryCriteria, "type"> & {
  /** Return `undefined` instead of throwing when nothing matches. */
  optional?: boolean;
};

export type FindCriteria = QueryCriteria & FindOptions;

export type FindFn = {
  (type: ShallowRenderType): ComponentNode;
  (type: ShallowRenderType, options: FindOptions & { optional: true }): ComponentNode | undefined;
  (type: ShallowRenderType, options?: Omit<FindOptions, "optional">): ComponentNode;
  (criteria: FindCriteria & { optional: true }): ComponentNode | undefined;
  (criteria: FindCriteria): ComponentNode;
};

export type FindAllFn = {
  (type: ShallowRenderType): ComponentNodeList;
  (type: ShallowRenderType, options?: FindOptions): ComponentNodeList;
  (criteria: FindCriteria): ComponentNodeList;
};

export type ComponentNode = {
  props: () => PropsRecord;
  text: () => string;
  elementTag: () => string;
  find: FindFn;
  findAll: FindAllFn;
  trigger: (propName: string, ...args: unknown[]) => unknown;
  click: (...args: unknown[]) => unknown;
};

export type TriggerInteraction = {
  typeName: string;
  propName: string;
  args: unknown[];
  result?: unknown;
};

export type DebugTimelineEvent =
  | {
      kind: "mock-config";
      mock: MockConfiguration;
    }
  | {
      kind: "mock-call";
      call: MockCall;
    }
  | {
      kind: "render" | "rerender";
      componentName: string;
      props: PropsRecord;
    }
  | {
      kind: "trigger";
      interaction: TriggerInteraction;
    };

type TupleOf<Item, Count extends number, Items extends Item[] = []> = Items["length"] extends Count
  ? Items
  : TupleOf<Item, Count, [...Items, Item]>;

export type ComponentNodeList<
  Node extends ComponentNode = ComponentNode,
  IndexedLength extends number = 10,
> = Node[] & TupleOf<Node, IndexedLength>;

export type ShallowOutput = {
  find: FindFn;
  findAll: FindAllFn;
  text: () => string;
  rerender: (nextProps?: PropsRecord) => unknown;
  unmount: () => void;
  nodes: () => TreeNode[];
  interactions: () => TriggerInteraction[];
  mockCalls: () => MockCall[];
  timelineEvents: () => DebugTimelineEvent[];
};

export type ShallowHookResult<Result> = {
  readonly current: Result;
};

export type ShallowHookRenderApi<Result> = {
  output: ShallowOutput;
  result: ShallowHookResult<Result>;
  rerender: () => unknown;
  unmount: () => void;
};

export type TreeNode = {
  type: ShallowRenderType;
  typeName: string;
  props: PropsRecord;
  children: TreeNode[];
};
