import { childrenToArray, getComparableProps, getName, isElement, partialMatch } from "./utils";

describe("utils", () => {
  test("gets display names for host, named, displayName, and anonymous types", () => {
    function NamedComponent() {
      return null;
    }
    const DisplayComponent = () => null;
    DisplayComponent.displayName = "Displayed";

    expect(getName("section")).toBe("section");
    expect(getName(NamedComponent)).toBe("NamedComponent");
    expect(getName(DisplayComponent)).toBe("Displayed");
    expect(getName({})).toBe("Anonymous");
  });

  test("detects React elements and normalizes children", () => {
    const element = <span>Child</span>;

    expect(isElement(element)).toBe(true);
    expect(isElement("Child")).toBe(false);
    expect(childrenToArray(["A", null, "B"])).toEqual(["A", "B"]);
  });

  test("copies comparable props without reading key or ref", () => {
    const props = {
      id: "todo-1",
      key: "internal-key",
      ref: "internal-ref",
      title: "Write tests",
    };

    expect(getComparableProps(props)).toEqual({
      id: "todo-1",
      title: "Write tests",
    });
    expect(getComparableProps()).toEqual({});
  });

  test("partially matches primitive, function, arrays, and objects", () => {
    const callback = () => undefined;

    expect(partialMatch("same", "same")).toBe(true);
    expect(partialMatch(callback, callback)).toBe(true);
    expect(partialMatch([1, { done: true }, 3], [1, { done: true }])).toBe(true);
    expect(partialMatch({ nested: { value: 1 }, extra: true }, { nested: { value: 1 } })).toBe(
      true,
    );
  });

  test("rejects mismatched partial values", () => {
    const element = <span />;

    expect(partialMatch("actual", "expected")).toBe(false);
    expect(
      partialMatch(
        () => undefined,
        () => undefined,
      ),
    ).toBe(false);
    expect(partialMatch(element, <span />)).toBe(false);
    expect(partialMatch([1], [1, 2])).toBe(false);
    expect(partialMatch({ value: 1 }, { value: 2 })).toBe(false);
    expect(partialMatch(null, { value: 1 })).toBe(false);
  });
});
