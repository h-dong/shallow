import { useMemo, useState } from "react";
import { shallowHook } from "./shallow-hook";

function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);

  return {
    count,
    increment: () => setCount((value) => value + 1),
  };
}

function useDoubled(value: number) {
  return useMemo(() => value * 2, [value]);
}

describe("shallowHook", () => {
  test("returns the initial hook result", () => {
    const { result } = shallowHook(() => useCounter(3));

    expect(result.current.count).toBe(3);
  });

  test("updates result.current after rerender", () => {
    const { result, rerender } = shallowHook(() => useCounter());

    result.current.increment();
    rerender();

    expect(result.current.count).toBe(1);
  });

  test("recomputes memoized values when dependencies change", () => {
    let input = 2;
    const { result, rerender } = shallowHook(() => useDoubled(input));

    expect(result.current).toBe(4);

    input = 5;
    rerender();

    expect(result.current).toBe(10);
  });

  test("leaves an empty output tree and clears it on unmount", () => {
    const { output, unmount } = shallowHook(() => useCounter());

    expect(output).not.toBeRendered();

    unmount();

    expect(output).not.toBeRendered();
  });
});
