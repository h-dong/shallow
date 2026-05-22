import React from "react";
import type { PropsRecord, ShallowRenderType } from "../types";

type NamedFunction = Function & {
  displayName?: string;
  name?: string;
};

export const isRecord = (value: unknown): value is PropsRecord => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

export const getName = (type: ShallowRenderType | Record<string, unknown>) => {
  if (typeof type === "string") {
    return type;
  }

  if (typeof type === "function") {
    const namedFunction = type as NamedFunction;
    return namedFunction.displayName ?? namedFunction.name ?? "Anonymous";
  }

  if (isRecord(type)) {
    const displayName = type.displayName;
    const name = type.name;

    if (typeof displayName === "string") {
      return displayName;
    }

    if (typeof name === "string") {
      return name;
    }
  }

  return "Anonymous";
};

export const isElement = (value: unknown): value is React.ReactElement<PropsRecord> =>
  React.isValidElement(value);

export const childrenToArray = (children: unknown) =>
  React.Children.toArray(children as React.ReactNode);

export const getComparableProps = (props: PropsRecord = {}) => {
  return Object.fromEntries(
    Object.entries(props).filter(([propName]) => propName !== "key" && propName !== "ref"),
  );
};

export const partialMatch = (actual: unknown, expected: unknown): boolean => {
  if (Object.is(actual, expected)) {
    return true;
  }

  if (typeof expected === "function") {
    return actual === expected;
  }

  if (isElement(expected) || isElement(actual)) {
    return actual === expected;
  }

  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      expected.length <= actual.length &&
      expected.every((item, index) => partialMatch(actual[index], item))
    );
  }

  if (isRecord(expected)) {
    if (!isRecord(actual)) {
      return false;
    }

    return Object.entries(expected).every(([key, value]) => partialMatch(actual[key], value));
  }

  return false;
};
