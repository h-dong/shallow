import type {
  ComponentNode,
  ComponentNodeList,
  FindCriteria,
  FindOptions,
  QueryCriteria,
  ShallowRenderType,
  TreeNode,
} from "../types";
import { hasQueryCriteria, matchesCriteria, queryTreeNodes } from "./query";
import { getName } from "./utils";

export type TextReader = (node: TreeNode) => string;

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

const matchesType = (node: TreeNode, type: ShallowRenderType) => {
  if (node.type === type) {
    return true;
  }

  return getName(type) === node.typeName;
};

const hasCriteriaBeyondType = (criteria: QueryCriteria) =>
  criteriaKeys.some((key) => key !== "type" && criteria[key] !== undefined);

export const isShallowRenderType = (value: unknown): value is ShallowRenderType =>
  typeof value === "string" || typeof value === "function";

export const toFindCriteria = (
  typeOrCriteria: ShallowRenderType | FindCriteria,
  options?: FindOptions,
): FindCriteria => {
  if (isShallowRenderType(typeOrCriteria)) {
    return { ...options, type: typeOrCriteria };
  }

  return { ...options, ...typeOrCriteria };
};

export const isTypeOnlyFind = (criteria: FindCriteria) =>
  criteria.type !== undefined && !hasCriteriaBeyondType(criteria) && !criteria.optional;

const collectByType = (nodes: TreeNode[], type: ShallowRenderType): TreeNode[] => {
  const matches: TreeNode[] = [];

  const visit = (node: TreeNode) => {
    if (matchesType(node, type)) {
      matches.push(node);
    }

    for (const child of node.children) {
      visit(child);
    }
  };

  for (const node of nodes) {
    visit(node);
  }

  return matches;
};

export type InternalFindCriteria = FindCriteria & { all?: boolean };

export const findTreeNodes = (
  nodes: TreeNode[],
  criteria: InternalFindCriteria,
  readText: TextReader,
  options: { includeRoots?: TreeNode[]; childrenOnly?: boolean } = {},
): TreeNode[] => {
  const { all: _all, optional: _optional, ...queryCriteria } = criteria;

  if (!hasQueryCriteria(queryCriteria)) {
    throw new Error("find requires a type or at least one matcher.");
  }

  if (queryCriteria.type !== undefined) {
    const typeMatches: TreeNode[] = [];

    if (options.includeRoots?.length) {
      for (const root of options.includeRoots) {
        if (matchesType(root, queryCriteria.type)) {
          typeMatches.push(root);
        }

        typeMatches.push(...collectByType(root.children, queryCriteria.type));
      }
    }

    if (!options.childrenOnly) {
      typeMatches.push(...collectByType(nodes, queryCriteria.type));
    } else {
      for (const node of nodes) {
        typeMatches.push(...collectByType([node], queryCriteria.type));
      }
    }

    if (!hasCriteriaBeyondType(queryCriteria)) {
      return typeMatches;
    }

    return typeMatches.filter((node) => matchesCriteria(node, queryCriteria, readText));
  }

  return queryTreeNodes(
    nodes,
    queryCriteria,
    readText,
    options.includeRoots ? { includeRoots: options.includeRoots } : {},
  );
};

export type FindResult = ComponentNode | ComponentNodeList | undefined;

export const finalizeFind = (
  matches: TreeNode[],
  criteria: InternalFindCriteria,
  createNode: (node: TreeNode) => ComponentNode,
  createList: (nodes: TreeNode[]) => ComponentNodeList,
): FindResult => {
  if (criteria.all) {
    return createList(matches);
  }

  const match = matches[0];

  if (!match) {
    if (criteria.optional) {
      return undefined;
    }

    const target = criteria.type ? getName(criteria.type) : "a matching node";
    throw new Error(`Expected output to render ${target}, but it was not found.`);
  }

  return createNode(match);
};
