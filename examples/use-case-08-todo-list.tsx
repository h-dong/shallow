type TodoRowProps = {
  id: string;
  title: string;
  done: boolean;
};

export function TodoRow({ title, done }: TodoRowProps) {
  return (
    <li>
      {done ? "Done: " : "Todo: "}
      {title}
    </li>
  );
}

type TodoListProps = {
  todos: Array<{
    id: string;
    title: string;
    done: boolean;
  }>;
};

export function TodoList({ todos }: TodoListProps) {
  return (
    <ul>
      {todos.map((todo) => (
        <TodoRow key={todo.id} id={todo.id} title={todo.title} done={todo.done} />
      ))}
    </ul>
  );
}
