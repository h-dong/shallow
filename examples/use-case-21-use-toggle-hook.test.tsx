import { shallowHook } from "../src";
import { useToggle } from "./use-case-21-use-toggle-hook";

describe("useToggle", () => {
  test("starts from the initial value", () => {
    const { result } = shallowHook(() => useToggle(true));

    expect(result.current.on).toBe(true);
  });

  test("toggles after rerender", () => {
    const { result, rerender } = shallowHook(() => useToggle());

    result.current.toggle();
    rerender();

    expect(result.current.on).toBe(true);

    result.current.toggle();
    rerender();

    expect(result.current.on).toBe(false);
  });

  test("unmount clears shallow output", () => {
    const { output, unmount } = shallowHook(() => useToggle());

    expect(output).not.toBeRendered();

    unmount();

    expect(output).not.toBeRendered();
  });
});
