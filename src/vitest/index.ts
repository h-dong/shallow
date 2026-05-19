import { expect } from "vitest";
import type { PropsRecord, TreeNode } from "../types";
import { getName, isElement, partialMatch } from "../modules/utils";

const matcherFlag = "__shallowMatchersRegistered";
type LabelTextMatch = string | RegExp;

type ShallowOutputLike = {
  text?: () => string;
  findAll?: (type: unknown) => Array<{ props: () => PropsRecord }>;
  nodes?: () => TreeNode[];
};

type ShallowNodeLike = {
  props?: () => PropsRecord;
};

const labelableHostTypes = new Set([
  "button",
  "input",
  "meter",
  "output",
  "progress",
  "select",
  "textarea",
]);

const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim();

const matchesLabelText = (actual: string, expected: LabelTextMatch) => {
  const normalizedActual = normalizeText(actual);

  return expected instanceof RegExp
    ? expected.test(normalizedActual)
    : normalizedActual === normalizeText(expected);
};

const getTextFromValue = (value: unknown): string => {
  if (value == null || typeof value === "boolean") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(getTextFromValue).join("");
  }

  if (isElement(value)) {
    return getTextFromValue(value.props.children);
  }

  return "";
};

const isLabelableNode = (node: TreeNode) => {
  if (typeof node.type !== "string") {
    return true;
  }

  if (!labelableHostTypes.has(node.type)) {
    return false;
  }

  return node.type !== "input" || node.props.type !== "hidden";
};

const getNodeText = (node: TreeNode, excludeLabelableDescendants = false, isRoot = true): string => {
  if (!isRoot && excludeLabelableDescendants && isLabelableNode(node)) {
    return "";
  }

  if (node.typeName === "#text") {
    return getTextFromValue(node.props.children);
  }

  if (node.children.length > 0) {
    return node.children
      .map((child) => getNodeText(child, excludeLabelableDescendants, false))
      .join("");
  }

  return getTextFromValue(node.props.children);
};

const getLabelNodeText = (node: TreeNode) => getNodeText(node, true);

const matchesType = (node: TreeNode, type: unknown) => {
  if (node.type === type) {
    return true;
  }

  return getName(type) === node.typeName;
};

const collectNodes = (nodes: TreeNode[]): TreeNode[] =>
  nodes.flatMap((node) => [node, ...collectNodes(node.children)]);

const propString = (props: PropsRecord, propName: string) => {
  const value = props[propName];

  return typeof value === "string" ? value : undefined;
};

const getLabelControlId = (label: TreeNode) =>
  propString(label.props, "htmlFor") ?? propString(label.props, "for");

const containsNode = (root: TreeNode, target: TreeNode): boolean => {
  if (root === target) {
    return true;
  }

  return root.children.some((child) => containsNode(child, target));
};

const firstLabelableDescendant = (node: TreeNode): TreeNode | undefined => {
  for (const child of node.children) {
    if (isLabelableNode(child)) {
      return child;
    }

    const descendant = firstLabelableDescendant(child);

    if (descendant) {
      return descendant;
    }
  }

  return undefined;
};

const getAriaLabelledByTexts = (node: TreeNode, nodesById: Map<string, TreeNode>) => {
  const labelledBy = propString(node.props, "aria-labelledby");

  if (!labelledBy) {
    return [];
  }

  return labelledBy
    .split(/\s+/)
    .map((id) => nodesById.get(id))
    .filter((labelledNode): labelledNode is TreeNode => Boolean(labelledNode))
    .map((labelledNode) =>
      labelledNode.type === "label" ? getLabelNodeText(labelledNode) : getNodeText(labelledNode),
    );
};

const toAriaLabelledByCandidates = (texts: string[]) => {
  const candidates = [texts.join(" "), ...texts];

  if (texts.length > 1) {
    candidates.push(
      ...texts.map((_, index) => texts.filter((_text, itemIndex) => itemIndex !== index).join(" ")),
    );
  }

  return candidates;
};

const treeHasLabelText = (rootNodes: TreeNode[], type: unknown, expected: LabelTextMatch) => {
  const allNodes = collectNodes(rootNodes);
  const candidates = allNodes.filter((node) => matchesType(node, type));
  const labels = allNodes.filter((node) => node.type === "label");
  const nodesById = new Map(
    allNodes
      .map((node) => [propString(node.props, "id"), node] as const)
      .filter((item): item is readonly [string, TreeNode] => item[0] !== undefined),
  );

  return candidates.some((candidate) => {
    const ariaLabel = propString(candidate.props, "aria-label");

    if (ariaLabel && matchesLabelText(ariaLabel, expected)) {
      return true;
    }

    const labelledByTexts = getAriaLabelledByTexts(candidate, nodesById);

    if (
      labelledByTexts.length > 0 &&
      toAriaLabelledByCandidates(labelledByTexts).some((text) => matchesLabelText(text, expected))
    ) {
      return true;
    }

    if (!isLabelableNode(candidate)) {
      return false;
    }

    const candidateId = propString(candidate.props, "id");
    const labelById = candidateId
      ? labels.some(
          (label) =>
            getLabelControlId(label) === candidateId &&
            matchesLabelText(getLabelNodeText(label), expected),
        )
      : false;

    if (labelById) {
      return true;
    }

    return labels.some((label) => {
      if (getLabelControlId(label)) {
        return false;
      }

      return (
        firstLabelableDescendant(label) === candidate &&
        containsNode(label, candidate) &&
        matchesLabelText(getLabelNodeText(label), expected)
      );
    });
  });
};

const fallbackHasAriaLabel = (
  received: ShallowOutputLike,
  type: unknown,
  expected: LabelTextMatch,
) => {
  const nodes = received.findAll?.(type) ?? [];

  return nodes.some((node) => {
    const ariaLabel = propString(node.props(), "aria-label");

    return ariaLabel !== undefined && matchesLabelText(ariaLabel, expected);
  });
};

declare module "vitest" {
  interface Assertion<T> {
    toRenderText(expected: string | RegExp): void;
    toRender(type: unknown, expectedProps?: PropsRecord): void;
    toRenderLabelText(type: unknown, expected: LabelTextMatch): void;
    toHaveProps(expectedProps: PropsRecord): void;
  }

  interface AsymmetricMatchersContaining {
    toRenderText(expected: string | RegExp): void;
    toRender(type: unknown, expectedProps?: PropsRecord): void;
    toRenderLabelText(type: unknown, expected: LabelTextMatch): void;
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
    toRenderLabelText(received: ShallowOutputLike, type: unknown, expected: LabelTextMatch) {
      const rootNodes = received.nodes?.();
      const pass = rootNodes
        ? treeHasLabelText(rootNodes, type, expected)
        : fallbackHasAriaLabel(received, type, expected);

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
