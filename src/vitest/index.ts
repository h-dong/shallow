import { expect } from "vitest";
import { matchesCriteria } from "../modules/query";
import { getRenderedNodeText } from "../modules/tree";
import { getName, partialMatch } from "../modules/utils";
import type { PropsRecord, QueryCriteria, ShallowRenderType, TreeNode } from "../types";

const matcherFlag = "__shallowMatchersRegistered";

type ShallowOutputLike = {
  text?: () => string;
  find?: (type: ShallowRenderType) => { props: () => PropsRecord };
  findAll?: (type: ShallowRenderType) => Array<{ props: () => PropsRecord }>;
  nodes?: () => TreeNode[];
};

type ShallowNodeLike = {
  props: () => PropsRecord;
  text?: () => string;
  elementTag?: () => string;
  findAll?: (type: ShallowRenderType) => Array<{ props: () => PropsRecord }>;
};

const readNodeText = (node: TreeNode) => getRenderedNodeText(node);

const getOuterNode = (received: { nodes?: () => TreeNode[] }): TreeNode | undefined =>
  received.nodes?.()[0];

const isComponentNode = (received: unknown): received is ShallowNodeLike =>
  typeof received === "object" &&
  received !== null &&
  "props" in received &&
  typeof (received as ShallowNodeLike).props === "function" &&
  !("nodes" in received);

const outerText = (received: ShallowOutputLike) => {
  const outer = getOuterNode(received);

  if (outer) {
    return getRenderedNodeText(outer);
  }

  return received.text?.() ?? "";
};

const matchesOuter = (received: ShallowOutputLike, criteria: QueryCriteria) => {
  const outer = getOuterNode(received);

  return outer ? matchesCriteria(outer, criteria, readNodeText) : false;
};

const toTreeNode = (received: ShallowNodeLike): TreeNode => {
  const tag = received.elementTag?.() ?? "";

  return {
    type: tag,
    typeName: tag,
    props: received.props(),
    children: [],
  };
};

const matchesReceived = (
  received: ShallowOutputLike | ShallowNodeLike,
  criteria: QueryCriteria,
) => {
  if (isComponentNode(received)) {
    const node = toTreeNode(received);

    return matchesCriteria(node, criteria, () => received.text?.() ?? "");
  }

  return matchesOuter(received, criteria);
};

const elementText = (received: ShallowOutputLike | ShallowNodeLike) => {
  if (isComponentNode(received)) {
    return received.text?.() ?? "";
  }

  return outerText(received);
};

const getOuterProps = (received: ShallowOutputLike): PropsRecord | undefined =>
  getOuterNode(received)?.props;

const getProps = (received: ShallowOutputLike | ShallowNodeLike): PropsRecord | undefined =>
  isComponentNode(received) ? received.props() : getOuterProps(received);

const elementLabel = (received: unknown) =>
  isComponentNode(received) ? "element" : "outer element";

const isDisabled = (props: PropsRecord) => Boolean(props.disabled);

const isChecked = (props: PropsRecord) => props.checked === true;

export const registerMatchers = () => {
  const globalScope = globalThis as typeof globalThis & Record<string, unknown>;

  if (globalScope[matcherFlag]) {
    return;
  }

  globalScope[matcherFlag] = true;

  expect.extend({
    toBeRendered(received: unknown) {
      const pass =
        received === undefined || received === null
          ? false
          : isComponentNode(received)
            ? true
            : typeof received === "object" && "nodes" in received
              ? ((received as ShallowOutputLike).nodes?.() ?? []).length > 0
              : false;
      const label =
        received === undefined || received === null
          ? "result"
          : isComponentNode(received)
            ? "element"
            : "output";

      return {
        pass,
        message: () => `Expected ${label} ${this.isNot ? "not " : ""}to be rendered.`,
      };
    },
    toRenderText(received: ShallowOutputLike | ShallowNodeLike, expected: string | RegExp) {
      const text = elementText(received);
      const pass = expected instanceof RegExp ? expected.test(text) : text.includes(expected);

      return {
        pass,
        message: () =>
          `Expected rendered text ${this.isNot ? "not " : ""}to include ${String(expected)}. Actual text: ${text}`,
      };
    },
    toHaveText(received: ShallowOutputLike | ShallowNodeLike, expected: string | RegExp) {
      const text = elementText(received);
      const pass = expected instanceof RegExp ? expected.test(text) : text.includes(expected);

      return {
        pass,
        message: () =>
          `Expected text ${this.isNot ? "not " : ""}to include ${String(expected)}. Actual text: ${text}`,
      };
    },
    toHaveName(received: ShallowOutputLike | ShallowNodeLike, expected: string) {
      const pass = matchesReceived(received, { name: expected });

      return {
        pass,
        message: () =>
          `Expected ${elementLabel(received)} ${this.isNot ? "not " : ""}to have name ${expected}.`,
      };
    },
    toHaveTestId(received: ShallowOutputLike | ShallowNodeLike, expected: string) {
      const pass = matchesReceived(received, { testId: expected });

      return {
        pass,
        message: () =>
          `Expected ${elementLabel(received)} ${this.isNot ? "not " : ""}to have test id ${expected}.`,
      };
    },
    toHaveId(received: ShallowOutputLike | ShallowNodeLike, expected: string) {
      const pass = matchesReceived(received, { id: expected });

      return {
        pass,
        message: () =>
          `Expected ${elementLabel(received)} ${this.isNot ? "not " : ""}to have id ${expected}.`,
      };
    },
    toHaveLabel(received: ShallowOutputLike | ShallowNodeLike, expected: string) {
      const pass = matchesReceived(received, { labelText: expected });

      return {
        pass,
        message: () =>
          `Expected ${elementLabel(received)} ${this.isNot ? "not " : ""}to have label ${expected}.`,
      };
    },
    toHaveRole(received: ShallowOutputLike | ShallowNodeLike, expected: string) {
      const pass = matchesReceived(received, { role: expected });

      return {
        pass,
        message: () =>
          `Expected ${elementLabel(received)} ${this.isNot ? "not " : ""}to have role ${expected}.`,
      };
    },
    toHaveClass(received: ShallowOutputLike | ShallowNodeLike, expected: string) {
      const pass = matchesReceived(received, { className: expected });

      return {
        pass,
        message: () =>
          `Expected ${elementLabel(received)} ${this.isNot ? "not " : ""}to have class ${expected}.`,
      };
    },
    toBeElement(received: ShallowOutputLike | ShallowNodeLike, expected: ShallowRenderType) {
      const pass = matchesReceived(received, { type: expected });
      const label = getName(expected);

      return {
        pass,
        message: () =>
          `Expected ${elementLabel(received)} ${this.isNot ? "not " : ""}to be ${label}.`,
      };
    },
    toBeEnabled(received: ShallowOutputLike | ShallowNodeLike) {
      const props = getProps(received);
      const pass = props !== undefined && !isDisabled(props);

      return {
        pass,
        message: () =>
          `Expected ${elementLabel(received)} ${this.isNot ? "not " : ""}to be enabled. disabled=${String(props?.disabled)}`,
      };
    },
    toBeDisabled(received: ShallowOutputLike | ShallowNodeLike) {
      const props = getProps(received);
      const pass = props !== undefined && isDisabled(props);

      return {
        pass,
        message: () =>
          `Expected ${elementLabel(received)} ${this.isNot ? "not " : ""}to be disabled. disabled=${String(props?.disabled)}`,
      };
    },
    toBeChecked(received: ShallowOutputLike | ShallowNodeLike) {
      const props = getProps(received);
      const pass = props !== undefined && isChecked(props);

      return {
        pass,
        message: () =>
          `Expected ${elementLabel(received)} ${this.isNot ? "not " : ""}to be checked. checked=${String(props?.checked)}`,
      };
    },
    toBeUnchecked(received: ShallowOutputLike | ShallowNodeLike) {
      const props = getProps(received);
      const pass = props !== undefined && !isChecked(props);

      return {
        pass,
        message: () =>
          `Expected ${elementLabel(received)} ${this.isNot ? "not " : ""}to be unchecked. checked=${String(props?.checked)}`,
      };
    },
    toHaveValue(
      received: ShallowOutputLike | ShallowNodeLike,
      expected: string | number | readonly string[] | null,
    ) {
      const props = getProps(received);
      const pass = props !== undefined && partialMatch(props.value, expected);

      return {
        pass,
        message: () =>
          `Expected ${elementLabel(received)} ${this.isNot ? "not " : ""}to have value ${JSON.stringify(expected)}. Actual value: ${JSON.stringify(props?.value)}`,
      };
    },
    toHaveProps(received: unknown, expected: PropsRecord | string, value?: unknown) {
      if (typeof expected === "string") {
        const props =
          typeof received === "object" && received !== null
            ? getProps(received as ShallowOutputLike | ShallowNodeLike)
            : undefined;
        const pass = props ? partialMatch(props[expected], value) : false;

        return {
          pass,
          message: () =>
            `Expected ${elementLabel(received)} prop ${expected} ${this.isNot ? "not " : ""}to equal ${JSON.stringify(value)}.`,
        };
      }

      const actualProps =
        typeof received === "object" && received !== null
          ? (getProps(received as ShallowOutputLike | ShallowNodeLike) ?? {})
          : {};
      const pass = partialMatch(actualProps, expected);

      return {
        pass,
        message: () =>
          `Expected props ${this.isNot ? "not " : ""}to match ${JSON.stringify(expected)}.`,
      };
    },
    toRender(
      received: ShallowOutputLike | ShallowNodeLike,
      type: ShallowRenderType,
      expectedProps?: PropsRecord,
    ) {
      const nodes = received.findAll?.(type) ?? [];
      const pass =
        expectedProps === undefined
          ? nodes.length > 0
          : nodes.some((node) => partialMatch(node.props(), expectedProps));
      const scope = isComponentNode(received) ? "element" : "output";

      return {
        pass,
        message: () => `Expected ${scope} ${this.isNot ? "not " : ""}to render ${getName(type)}.`,
      };
    },
    toRenderLabelText(
      received: ShallowOutputLike | ShallowNodeLike,
      type: ShallowRenderType,
      expected: string,
    ) {
      const nodes = received.findAll?.(type) ?? [];
      const pass = nodes.some((node) => partialMatch(node.props(), { "aria-label": expected }));
      const scope = isComponentNode(received) ? "element" : "output";

      return {
        pass,
        message: () =>
          `Expected ${scope} ${this.isNot ? "not " : ""}to render ${getName(type)} with label text ${expected}.`,
      };
    },
  });
};
