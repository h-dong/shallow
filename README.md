# @hdong/shallow

`shallow` is a React component testing library that runs components without a real DOM by simulating the small parts of React rendering and hooks needed for shallow tests.

A library for testing React components like they are pure functions. `shallow` is a React component testing library that runs components without a real DOM by simulating the small parts of React rendering and hooks needed for shallow tests.

## Performance

Because `shallow` does not mount into jsdom (or other DOM implementations), it avoids a lot of work that DOM-based tools do: creating DOM nodes, running DOM queries, handling browser-like APIs, React DOM reconciliation, and cleanup between tests. It just executes the component function, walks the returned React elements, and records a lightweight tree.

So this kind of test can be faster, especially for component logic tests where you only need to assert:

- Which child components render
- What props they receive
- What text is produced
- What happens when a callback prop is triggered
- How hooks/state affect output

The caveat is that it is not equivalent to real DOM rendering. It will not catch issues involving actual browser behavior, accessibility semantics, layout, focus, form behavior, portals, real effects, event propagation, or React DOM integration. So it’s usually best as a faster unit-test layer, not a total replacement for React Testing Library (RTL) tests.

### Some Non-scientific Comparison Metrics

Based on basic local test runs on the same React components and almost identical unit tests (RTL v.s. shallow), there were the results:

| Test style            | Samples | Average | Median |   Min |   Max |
| --------------------- | ------: | ------: | -----: | ----: | ----: |
| React Testing Library |      11 |   768ms |  695ms | 650ms | 1.13s |
| `@hdong/shallow`      |      11 |   397ms |  359ms | 331ms | 661ms |

That is roughly a **1.9x faster** average runtime, or a **48% reduction** in
test time.

Note: real world usages may vary, feel free to share your own data points and we can update this.

## Installation

```sh
pnpm add -D @hdong/shallow
```

This package expects `react` and `vitest` to be installed in your project.

## Vitest Setup

Register the custom matchers from a Vitest setup file:

```ts
// setupTest.ts
import { registerMatchers } from "@hdong/shallow/vitest";

registerMatchers();
```

Then point Vitest at that file:

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./setupTest.ts"],
  },
});
```

If you use Vitest globals, add the global types to your TypeScript config:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

## Usage

```tsx
// button.tsx
type ButtonProps = {
  children?: ReactNode;
  onClick?: () => void;
};

export function Button({ onClick, children }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}


// user-actions.tsx
import { Button } from './button.tsx';

export function UserActions({ name, onEdit }: { name: string; onEdit: (name: string) => void }) {
  return <Button onClick={() => onEdit(name)}>Edit profile</Button>;
}


// user-actions.test.tsx
import type { ReactNode } from "react";
import { shallow } from "@hdong/shallow";

import { Button } from './button.tsx';
import { UserActions } from 'user-actions.tsx';

test("calls an action from a shallow child", () => {
  const onEdit = vi.fn();
  const output = shallow(UserActions).render({ name: "Ada", onEdit });

  output.find(Button).click();

  expect(onEdit).toHaveBeenCalledWith("Ada");
});
```

## API

### `shallow(Component, options?)`

Creates a test API for a React component.

```ts
const { render, mock, debug } = shallow(Component, {
  defaultProps: {},
  wrapper: Wrapper,
});
```

### `render(props?, options?)`

Renders the root component and returns an output object.

The output supports:

- `find(type)`
- `findAll(type)`
- `text()`
- `rerender(nextProps)`
- `unmount()`
- `nodes()`

Found nodes support:

- `props()`
- `text()`
- `find(type)`
- `findAll(type)`
- `trigger(propName, ...args)`
- `click(...args)`

### `mock(target)`

Creates mock behavior for a component or function-like dependency.

```ts
const api = shallow(Component);

api.mock(Child).component((props) => <span>{props.children}</span>);
api.mock(useCurrentUser).return({ name: "Ada" });
```

Shallow mocks keep their own state. Vitest cleanup such as
`afterEach(() => vi.restoreAllMocks())`, `afterEach(() => vi.resetAllMocks())`,
or calling `mock.restore()` / `mock.reset()` on a `vi.fn()` does not clear
shallow's mock registry, component mock implementations, or recorded shallow
output history. Create a fresh `shallow(Component)` API per test, or call
`api.mock(target).reset()` for shallow mocks that must be cleared.

### Vitest Matchers

After `registerMatchers()` runs, these matchers are available:

- `toRenderText(expected)`
- `toRender(type, expectedProps?)`
- `toHaveProps(expectedProps)`

## Development

The npm package is built with `tsup`.

```sh
pnpm install
pnpm test:run
pnpm run build
pnpm pack --dry-run
```
