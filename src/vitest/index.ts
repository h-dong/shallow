import { expect } from "vitest";
import type { PropsRecord } from "../types";
import { getName, partialMatch } from "../modules/utils";

const matcherFlag = "__shallowMatchersRegistered";

type ShallowOutputLike = {
  text?: () => string;
  findAll?: (type: unknown) => Array<{ props: () => PropsRecord }>;
};

type ShallowNodeLike = {
  props?: () => PropsRecord;
};

declare module "vitest" {
  interface Assertion<T> {
    toRenderText(expected: string | RegExp): void;
    toRender(type: unknown, expectedProps?: PropsRecord): void;
    toRenderLabelText(type: unknown, expected: string): void;
    toHaveProps(expectedProps: PropsRecord): void;
  }

  interface AsymmetricMatchersContaining {
    toRenderText(expected: string | RegExp): void;
    toRender(type: unknown, expectedProps?: PropsRecord): void;
    toRenderLabelText(type: unknown, expected: string): void;
    toHaveProps(expectedProps: PropsRecord): void;
  }
}

export const registerMatchers = () => {
  const globalScope = globalThis as typeof globalThis & Record<string, unknown>;

  if (globalScope[matcherFlag]) {
    return;
  }

  globalScope[matcherFlag] = true;

  expect.extend({
    toRenderText(received: ShallowOutputLike, expected: string | RegExp) {
      const text = received.text?.() ?? "";
      const pass = expected instanceof RegExp ? expected.test(text) : text.includes(expected);

      return {
        pass,
        message: () =>
          `Expected rendered text ${this.isNot ? "not " : ""}to include ${String(expected)}. Actual text: ${text}`,
      };
    },
    toRender(received: ShallowOutputLike, type: unknown, expectedProps?: PropsRecord) {
      const nodes = received.findAll?.(type) ?? [];
      const pass =
        expectedProps === undefined
          ? nodes.length > 0
          : nodes.some((node) => partialMatch(node.props(), expectedProps));

      return {
        pass,
        message: () => `Expected output ${this.isNot ? "not " : ""}to render ${getName(type)}.`,
      };
    },
    toRenderLabelText(received: ShallowOutputLike, type: unknown, expected: string) {
      const nodes = received.findAll?.(type) ?? [];
      const pass = nodes.some((node) => partialMatch(node.props(), { "aria-label": expected }));

      return {
        pass,
        message: () =>
          `Expected output ${this.isNot ? "not " : ""}to render ${getName(type)} with label text ${expected}.`,
      };
    },
    toHaveProps(received: ShallowNodeLike, expectedProps: PropsRecord) {
      const actualProps = received.props?.() ?? {};
      const pass = partialMatch(actualProps, expectedProps);

      return {
        pass,
        message: () =>
          `Expected props ${this.isNot ? "not " : ""}to match ${JSON.stringify(expectedProps)}.`,
      };
    },
  });
};
