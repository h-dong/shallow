import React from "react";
import {
  createReactDispatcherRuntime,
  resetReactDispatcherRuntime,
  withReactDispatcher,
} from "./react-dispatcher";
import { createDebug, getDebugTestInfo } from "./debug";
import { createNode, createOutput } from "./tree";
import type {
  ComponentImplementation,
  DebugTimelineEvent,
  MockApi,
  MockCall,
  MockConfiguration,
  MockState,
  PropsRecord,
  ShallowRenderType,
  TreeNode,
  UnknownFunction,
} from "../types";
import { childrenToArray, getName, isElement, isRecord } from "./utils";

const REACT_CONTEXT = Symbol.for("react.context");

type ShallowOptions<Props extends object> = {
  defaultProps?: Partial<Props>;
  wrapper?: ComponentImplementation<{ children: React.ReactNode }>;
};

type ReactContextType = {
  $$typeof?: symbol;
};

const isReactContextType = (value: unknown): value is ReactContextType => {
  return isRecord(value) && value.$$typeof === REACT_CONTEXT;
};

const isComponentFunction = (value: unknown): value is (props: PropsRecord) => React.ReactNode =>
  typeof value === "function";

const toPropsRecord = (value: unknown): PropsRecord => (isRecord(value) ? value : {});

type ExternalMockFunction = {
  getMockImplementation?: () => UnknownFunction | undefined;
  mockImplementation?: (implementation: UnknownFunction) => unknown;
  mockReturnValue?: (value: unknown) => unknown;
};

const isExternalMockFunction = (value: unknown): value is ExternalMockFunction => {
  if (typeof value !== "function" && !isRecord(value)) {
    return false;
  }

  const candidate = value as Partial<ExternalMockFunction>;

  return (
    typeof candidate.mockReturnValue === "function" ||
    typeof candidate.mockImplementation === "function"
  );
};

export const shallow = <Props extends object>(
  Component: React.ComponentType<Props>,
  options: ShallowOptions<Props> = {},
) => {
  const mocksByTarget = new Map<unknown, MockState>();
  const mocksByName = new Map<string, MockState>();
  let activeMockRecorder: ((call: MockCall) => void) | undefined;
  let pendingTimelineEvents: Array<{
    event: DebugTimelineEvent;
    testName: string | undefined;
  }> = [];

  const recordPendingTimelineEvent = (event: DebugTimelineEvent) => {
    pendingTimelineEvents.push({
      event,
      testName: getDebugTestInfo()?.currentTestName,
    });
  };

  const drainPendingTimelineEvents = () => {
    const testName = getDebugTestInfo()?.currentTestName;
    const events: DebugTimelineEvent[] = [];

    pendingTimelineEvents = pendingTimelineEvents.filter((item) => {
      if (item.testName === testName) {
        events.push(item.event);
        return false;
      }

      return item.testName === undefined && testName !== undefined;
    });

    return events;
  };

  const getMock = (target: unknown) => {
    if (!mocksByTarget.has(target)) {
      const state: MockState = {
        calls: [],
        name: getName(target as ShallowRenderType | Record<string, unknown>),
      };
      mocksByTarget.set(target, state);
      mocksByName.set(state.name, state);
    }

    return mocksByTarget.get(target)!;
  };

  const getNamedMock = (name: string) => mocksByName.get(name);

  const traverse = (
    value: unknown,
    rootComponent: React.ComponentType<Props>,
    contextValues: Map<unknown, unknown>,
    hookRuntime: ReturnType<typeof createReactDispatcherRuntime>,
  ): TreeNode[] => {
    if (value == null || typeof value === "boolean") {
      return [];
    }

    if (Array.isArray(value)) {
      return value.flatMap((item) => traverse(item, rootComponent, contextValues, hookRuntime));
    }

    if (typeof value === "string" || typeof value === "number") {
      return [createNode("#text", { children: String(value) })];
    }

    if (!isElement(value)) {
      return [];
    }

    const type = value.type;
    const props = toPropsRecord(value.props);

    if (type === React.Fragment) {
      return traverse(props.children, rootComponent, contextValues, hookRuntime);
    }

    if (isReactContextType(type)) {
      const previous = contextValues.get(type);
      contextValues.set(type, props.value);
      const children = traverse(props.children, rootComponent, contextValues, hookRuntime);

      if (previous === undefined) {
        contextValues.delete(type);
      } else {
        contextValues.set(type, previous);
      }

      return children;
    }

    if (typeof type === "string") {
      return [
        createNode(
          type,
          props,
          childrenToArray(props.children).flatMap((child) =>
            traverse(child, rootComponent, contextValues, hookRuntime),
          ),
        ),
      ];
    }

    if (isComponentFunction(type)) {
      const mockState = getNamedMock(getName(type));
      const shouldExecute = type === rootComponent || getName(type).endsWith("Provider");

      if (shouldExecute) {
        const rendered = withReactDispatcher(contextValues, () => type(props), hookRuntime);
        return traverse(rendered, rootComponent, contextValues, hookRuntime);
      }

      const node = createNode(type as ShallowRenderType, props);

      if (mockState?.componentImplementation) {
        const componentImplementation = mockState.componentImplementation;
        const rendered = withReactDispatcher(
          contextValues,
          () => componentImplementation(props),
          hookRuntime,
        );
        node.children = traverse(rendered, rootComponent, contextValues, hookRuntime);
      } else {
        node.children = childrenToArray(props.children).flatMap((child) =>
          traverse(child, rootComponent, contextValues, hookRuntime),
        );
      }

      return [node];
    }

    return [];
  };

  const render = (props: Partial<Props> = {}, renderOptions: ShallowOptions<Props> = {}) => {
    let currentProps = {
      ...options.defaultProps,
      ...props,
    } as PropsRecord;
    const hookRuntime = createReactDispatcherRuntime();
    const output = createOutput(
      (nextProps: PropsRecord = {}) => {
        currentProps = {
          ...currentProps,
          ...nextProps,
        };

        output.addTimelineEvents(drainPendingTimelineEvents());
        output.addTimelineEvent({
          componentName: getName(Component as ShallowRenderType),
          kind: "rerender",
          props: currentProps,
        });
        output.setTree(renderCurrent());
        return output;
      },
      (interaction) => {
        output.addInteraction(interaction);
        output.addTimelineEvent({ interaction, kind: "trigger" });
        output.addTimelineEvent({
          componentName: getName(Component as ShallowRenderType),
          kind: "rerender",
          props: currentProps,
        });
        output.setTree(renderCurrent());
      },
      drainPendingTimelineEvents(),
    );

    const renderCurrent = () => {
      resetReactDispatcherRuntime(hookRuntime);

      const contextValues = new Map<unknown, unknown>();
      let element: React.ReactNode = React.createElement(Component, currentProps as Props);
      const wrappers = [options.wrapper, renderOptions.wrapper].filter(
        (wrapper): wrapper is ComponentImplementation<{ children: React.ReactNode }> =>
          Boolean(wrapper),
      );

      for (let index = wrappers.length; index > 0; index -= 1) {
        const wrapper = wrappers[index - 1];

        if (!wrapper) {
          continue;
        }

        element = withReactDispatcher(
          contextValues,
          () => wrapper({ children: element }),
          hookRuntime,
        );
      }

      const previousMockRecorder = activeMockRecorder;
      activeMockRecorder = (call) => {
        output.addMockCall(call);
        output.addTimelineEvent({ call, kind: "mock-call" });
      };

      try {
        return traverse(element, Component, contextValues, hookRuntime);
      } finally {
        activeMockRecorder = previousMockRecorder;
      }
    };

    output.addTimelineEvent({
      componentName: getName(Component as ShallowRenderType),
      kind: "render",
      props: currentProps,
    });

    return output.setTree(renderCurrent());
  };

  const mock = <Target>(target: Target): MockApi<Target> => {
    const state = getMock(target);
    const externalMock = isExternalMockFunction(target) ? target : undefined;
    const recordMockConfiguration = (configuration: Omit<MockConfiguration, "name">) => {
      recordPendingTimelineEvent({
        kind: "mock-config",
        mock: {
          name: state.name,
          ...configuration,
        },
      });
    };
    const applyMockImplementation = (implementation: UnknownFunction) => {
      state.implementation = implementation;
      externalMock?.mockImplementation?.((...args) => {
        try {
          const result = implementation(...args);
          const call = { name: state.name, args, result };
          state.calls.push(call);
          activeMockRecorder?.(call);
          return result;
        } catch (error) {
          const call = { name: state.name, args, error };
          state.calls.push(call);
          activeMockRecorder?.(call);
          throw error;
        }
      });
    };
    const api: MockApi<Target> = {
      returnFull: (value: unknown) => {
        state.kind = "full";
        state.value = value;
        recordMockConfiguration({ method: "returnFull", value });
        applyMockImplementation(() => value);
        return api;
      },
      return: (value: unknown) => {
        const previousImplementation =
          state.implementation ?? externalMock?.getMockImplementation?.();
        state.kind = "partial";
        state.value = value;
        recordMockConfiguration({ method: "return", value });
        applyMockImplementation((...args) => {
          const actual = previousImplementation?.(...args);

          return isRecord(actual) && isRecord(value) ? { ...actual, ...value } : value;
        });
        return api;
      },
      callsFake: (implementation: (...args: unknown[]) => unknown) => {
        state.kind = "fake";
        recordMockConfiguration({ method: "callsFake" });
        applyMockImplementation(implementation as UnknownFunction);
        return api;
      },
      throws: (error: unknown) => {
        state.kind = "throw";
        state.value = error;
        recordMockConfiguration({ method: "throws", value: error });
        applyMockImplementation(() => {
          throw error;
        });
        return api;
      },
      component: (implementation) => {
        state.componentImplementation =
          (implementation as ComponentImplementation | undefined) ??
          ((props) => (props.children as React.ReactNode) ?? null);
        recordMockConfiguration({ method: "component" });
        return api;
      },
      reset: () => {
        delete state.kind;
        delete state.value;
        delete state.implementation;
        delete state.componentImplementation;
        state.calls = [];
        recordMockConfiguration({ method: "reset" });
        return api;
      },
      calls: () => state.calls,
      renders: () => [],
    };

    return api;
  };

  return {
    render,
    mock,
    debug: createDebug,
  };
};
