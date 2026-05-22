import type { QueryCriteria, ShallowRenderType, TreeNode } from "../types";
import { getName, partialMatch } from "./utils";

const criteriaKeys: (keyof QueryCriteria)[] = [
  "type",
  "props",
  "id",
  "testId",
  "text",
  "labelText",
  "className",
  "role",
  "name",
];

export const hasQueryCriteria = (criteria: QueryCriteria): boolean =>
  criteriaKeys.some((key) => criteria[key] !== undefined);

export const assertQueryCriteria = (criteria: QueryCriteria) => {
  if (!hasQueryCriteria(criteria)) {
    throw new Error("query criteria must include at least one matcher.");
  }
};

const matchesType = (node: TreeNode, type: ShallowRenderType) => {
  if (node.type === type) {
    return true;
  }

  return getName(type) === node.typeName;
};

const matchesText = (text: string, expected: string | RegExp) => {
  if (expected instanceof RegExp) {
    return expected.test(text);
  }

  return text.includes(expected);
};

const matchesClassName = (actual: unknown, expected: string) => {
  if (typeof actual !== "string") {
    return false;
  }

  return actual.split(/\s+/).includes(expected);
};

const matchesLabelText = (node: TreeNode, expected: string, readText: TextReader) => {
  if (node.props["aria-label"] === expected || node.props["aria-labelledby"] === expected) {
    return true;
  }

  if (node.props.label === expected) {
    return true;
  }

  const renderedText = readText(node);

  return renderedText === expected || matchesText(renderedText, expected);
};

export type TextReader = (node: TreeNode) => string;

export const matchesCriteria = (
  node: TreeNode,
  criteria: QueryCriteria,
  readText: TextReader,
): boolean => {
  if (criteria.type !== undefined && !matchesType(node, criteria.type)) {
    return false;
  }

  if (criteria.props !== undefined && !partialMatch(node.props, criteria.props)) {
    return false;
  }

  if (criteria.id !== undefined && node.props.id !== criteria.id) {
    return false;
  }

  if (criteria.testId !== undefined && node.props["data-testid"] !== criteria.testId) {
    return false;
  }

  if (criteria.text !== undefined && !matchesText(readText(node), criteria.text)) {
    return false;
  }

  if (criteria.labelText !== undefined && !matchesLabelText(node, criteria.labelText, readText)) {
    return false;
  }

  if (
    criteria.className !== undefined &&
    !matchesClassName(node.props.className, criteria.className)
  ) {
    return false;
  }

  if (criteria.role !== undefined) {
    const role = node.props.role;
    if (role !== criteria.role && node.typeName !== criteria.role) {
      return false;
    }
  }

  if (criteria.name !== undefined) {
    const { name } = node.props;
    const ariaLabel = node.props["aria-label"];

    if (name !== criteria.name && ariaLabel !== criteria.name) {
      return false;
    }
  }

  return true;
};

export const queryTreeNodes = (
  nodes: TreeNode[],
  criteria: QueryCriteria,
  readText: TextReader,
  options: { includeRoots?: TreeNode[] } = {},
): TreeNode[] => {
  assertQueryCriteria(criteria);

  const matches: TreeNode[] = [];

  const visit = (node: TreeNode) => {
    if (matchesCriteria(node, criteria, readText)) {
      matches.push(node);
    }

    for (const child of node.children) {
      visit(child);
    }
  };

  for (const root of options.includeRoots ?? []) {
    if (matchesCriteria(root, criteria, readText)) {
      matches.push(root);
    }

    for (const child of root.children) {
      visit(child);
    }
  }

  for (const node of nodes) {
    visit(node);
  }

  return matches;
};

export const queryNodeScope = (
  root: TreeNode,
  criteria: QueryCriteria,
  readText: TextReader,
): TreeNode | undefined => queryTreeNodes([], criteria, readText, { includeRoots: [root] })[0];
