import type { ShallowHookRenderApi } from "../types";
import { shallow } from "./shallow";

export function shallowHook<Result>(useHook: () => Result): ShallowHookRenderApi<Result> {
  let current!: Result;

  function HookHarness() {
    current = useHook();
    return null;
  }

  const output = shallow(HookHarness).render();

  return {
    output,
    result: {
      get current() {
        return current;
      },
    },
    rerender: () => output.rerender(),
    unmount: () => output.unmount(),
  };
}
