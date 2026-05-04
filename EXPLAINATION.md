# Source Implementation Explanation

This project implements a small React shallow-rendering test utility.

The public API is exported from `src/index.ts`. The main entry point is
`shallow(Component)`, which returns helpers for rendering a component,
mocking dependencies, and inspecting debug output.

## Rendering

The core renderer lives in `src/modules/shallow.ts`.

Calling `render()` creates a React element for the root component, executes
that root component, and converts the rendered output into a plain tree of
nodes. This tree is made of `TreeNode` objects, where each node stores:

- the original type
- a display name
- comparable props
- child nodes

The renderer handles common React output shapes:

- `null`, `undefined`, and booleans render nothing.
- strings and numbers become `#text` nodes.
- arrays are flattened.
- fragments are unwrapped.
- host elements such as `div` and `button` are traversed.
- child components are preserved as shallow component nodes.

Only the root component is executed by default. Child components are not
executed unless they are provider-like components or have a mocked component
implementation.

## React Hooks

`src/modules/react-dispatcher.ts` provides a minimal hook environment by
temporarily replacing React's internal dispatcher while a component function
runs.

It supports lightweight versions of hooks such as:

- `useState`
- `useContext`
- `useMemo`
- `useCallback`
- `useRef`
- `useEffect`
- `useLayoutEffect`
- `useId`

This is not a full React renderer. It is only enough to let shallow-rendered
components execute predictable hook logic during tests.

## Output Tree

`src/modules/tree.ts` builds the queryable test output.

The output object supports:

- `find(type)`
- `findAll(type)`
- `text()`
- `rerender(nextProps)`
- `unmount()`
- `nodes()`

Found nodes support:

- `props()`
- `text()`
- nested `find()` and `findAll()`
- `trigger(propName, ...args)` for invoking callback props

## Mocking

`shallow(Component).mock(target)` creates mock state for a component or
function-like dependency. The mock API supports:

- `returnFull(value)`
- `return(value)`
- `callsFake(implementation)`
- `throws(error)`
- `component(implementation)`
- `reset()`
- `calls()`
- `renders()`

Mocks are stored by both target identity and target display name. This allows
example-specific code to look up mocks by names such as `useCurrentUser`.

## Utilities

`src/modules/utils.ts` contains small shared helpers:

- `getName()` resolves display names for components and host types.
- `isElement()` wraps React element detection.
- `childrenToArray()` normalizes React children.
- `getComparableProps()` removes React-only props such as `key` and `ref`.
- `partialMatch()` powers subset-style prop matching.

## Vitest Matchers

`src/modules/vitest.ts` registers custom Vitest matchers:

- `toRenderText(expected)`
- `toRender(type, expectedProps?)`
- `toHaveProps(expectedProps)`

These matchers make tests read closer to the intent of shallow rendering,
while relying on the output tree and partial prop matching internally.

## Current Limitations

The implementation is intentionally lightweight. It does not behave like a
complete React renderer, and some mocking behavior is still example-specific.
It is best understood as a focused shallow testing prototype rather than a
drop-in replacement for React Testing Library or Enzyme.
