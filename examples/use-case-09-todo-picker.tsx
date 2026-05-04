type TodoRowProps = {
  title: string;
  onSelect: () => void;
};

export function TodoRow({ title, onSelect }: TodoRowProps) {
  return (
    <li>
      <button onClick={onSelect}>{title}</button>
    </li>
  );
}

type TodoPickerProps = {
  todos: Array<{
    id: string;
    title: string;
  }>;
  onSelect: (id: string) => void;
};

export function TodoPicker({ todos, onSelect }: TodoPickerProps) {
  return (
    <ul>
      {todos.map((todo) => (
        <TodoRow key={todo.id} title={todo.title} onSelect={() => onSelect(todo.id)} />
      ))}
    </ul>
  );
}
