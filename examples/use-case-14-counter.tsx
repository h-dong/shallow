import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  const label = count === 1 ? "Clicked 1 time" : `Clicked ${count} times`;

  return <button onClick={() => setCount((value) => value + 1)}>{label}</button>;
}
