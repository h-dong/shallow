import React from "react";

type ReactInternals = {
  H?: unknown;
};

type ReactWithInternals = typeof React & {
  __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?: ReactInternals;
};

type ReactContextLike = {
  _currentValue?: unknown;
};

type StateUpdater = (next: unknown | ((current: unknown) => unknown)) => void;

export type ReactDispatcherRuntime = {
  states: unknown[];
  stateIndex: number;
  refs: Array<{ current: unknown }>;
  refIndex: number;
};

export const createReactDispatcherRuntime = (): ReactDispatcherRuntime => ({
  states: [],
  stateIndex: 0,
  refs: [],
  refIndex: 0,
});

export const resetReactDispatcherRuntime = (runtime: ReactDispatcherRuntime) => {
  runtime.stateIndex = 0;
  runtime.refIndex = 0;
};

export const withReactDispatcher = <Result>(
  contextValues: Map<unknown, unknown>,
  callback: () => Result,
  runtime = createReactDispatcherRuntime(),
): Result => {
  const internals = (React as ReactWithInternals)
    .__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const previousDispatcher = internals?.H;

  if (internals) {
    internals.H = {
      useState: (initial: unknown) => {
        const stateIndex = runtime.stateIndex;
        runtime.stateIndex += 1;

        if (!(stateIndex in runtime.states)) {
          runtime.states[stateIndex] = typeof initial === "function" ? initial() : initial;
        }

        return [
          runtime.states[stateIndex],
          ((next) => {
            const current = runtime.states[stateIndex];
            runtime.states[stateIndex] = typeof next === "function" ? next(current) : next;
          }) satisfies StateUpdater,
        ];
      },
      useContext: (context: ReactContextLike) =>
        contextValues.has(context) ? contextValues.get(context) : context._currentValue,
      useMemo: (factory: () => unknown) => factory(),
      useCallback: <Callback extends (...args: unknown[]) => unknown>(memoizedCallback: Callback) =>
        memoizedCallback,
      useRef: (initial: unknown) => {
        const refIndex = runtime.refIndex;
        runtime.refIndex += 1;

        if (!(refIndex in runtime.refs)) {
          runtime.refs[refIndex] = { current: initial };
        }

        return runtime.refs[refIndex];
      },
      useEffect: () => undefined,
      useLayoutEffect: () => undefined,
      useInsertionEffect: () => undefined,
      useDebugValue: () => undefined,
      useId: () => "shallow-id",
    };
  }

  try {
    return callback();
  } finally {
    if (internals) {
      internals.H = previousDispatcher;
    }
  }
};
