import { shallowHook } from "../src";
import { useCounter } from "./use-case-20-use-counter-hook";

describe("useCounter", () => {
  test("starts from the initial count", () => {
    const { result } = shallowHook(() => useCounter(5));

    expect(result.current.count).toBe(5);
  });

  test("increments after rerender", () => {
    const { result, rerender } = shallowHook(() => useCounter());

    result.current.increment();
    rerender();

    expect(result.current.count).toBe(1);
  });

  test("resets to the initial count", () => {
    const { result, rerender } = shallowHook(() => useCounter(2));

    result.current.increment();
    rerender();
    result.current.reset();
    rerender();

    expect(result.current.count).toBe(2);
  });
});
