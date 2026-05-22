# Test Better With Shallow

## Examples

Instead of mocking like this

```

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();

  return {
    ...actual,
    useEffect: (effect: () => void) => effect(),
  };
});
```

You could mock like this:

```
const { render, mock } = shallow(SomeComponent);
mock(useEffect).return((effect: () => void) => effect());
```
