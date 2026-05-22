import React from "react";
import { withReactDispatcher } from "./react-dispatcher";

describe("withReactDispatcher", () => {
  test("provides shallow hook implementations while the callback runs", () => {
    const Context = React.createContext("default");
    const contextValues = new Map<unknown, unknown>([[Context, "provided"]]);

    const result = withReactDispatcher(contextValues, () => {
      const [count, setCount] = React.useState(() => 1);
      setCount((value: number) => value + 1);

      return {
        callback: React.useCallback(() => "callback", []),
        context: React.useContext(Context),
        id: React.useId(),
        memo: React.useMemo(() => count * 2, []),
        ref: React.useRef("current"),
      };
    });

    expect(result.callback()).toBe("callback");
    expect(result.context).toBe("provided");
    expect(result.id).toBe("shallow-id");
    expect(result.memo).toBe(2);
    expect(result.ref).toEqual({ current: "current" });
  });

  test("runs callbacks when React internals are unavailable", () => {
    const reactWithInternals = React as typeof React & {
      __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?: {
        H?: unknown;
      };
    };
    const key = "__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE";
    const previousInternals = reactWithInternals[key];
    delete reactWithInternals[key];

    const value = withReactDispatcher(new Map(), () => "ok");

    expect(value).toBe("ok");

    reactWithInternals[key] = previousInternals;
  });

  test("supports effect and debug hook no-ops", () => {
    withReactDispatcher(new Map(), () => {
      React.useEffect(() => undefined);
      React.useLayoutEffect(() => undefined);
      React.useInsertionEffect(() => undefined);
      React.useDebugValue("state");
    });
  });

  test("falls back to the context default value", () => {
    const Context = React.createContext("default");

    const value = withReactDispatcher(new Map(), () => React.useContext(Context));

    expect(value).toBe("default");
  });

  test("restores React internals after errors", () => {
    const reactWithInternals = React as typeof React & {
      __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?: { H?: unknown };
    };
    const internals =
      reactWithInternals.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    const previousDispatcher = internals?.H;
    const error = new Error("boom");

    expect(() =>
      withReactDispatcher(new Map(), () => {
        throw error;
      }),
    ).toThrow(error);
    expect(internals?.H).toBe(previousDispatcher);
  });
});
