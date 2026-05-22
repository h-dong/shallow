export type Task = {
  id: string;
  title: string;
  done: boolean;
};

type TaskRowProps = {
  title: string;
  done: boolean;
  "data-testid"?: string;
  onToggle?: () => void;
};

export function TaskRow({ title, done, onToggle }: TaskRowProps) {
  return (
    <li className="task-item" onClick={onToggle} onKeyDown={onToggle} onKeyUp={onToggle}>
      {done ? "[x]" : "[ ]"} {title}
    </li>
  );
}

type TaskListProps = {
  tasks: Task[];
  onToggle?: (id: string) => void;
};

export function TaskList({ tasks, onToggle }: TaskListProps) {
  return (
    <ul className="task-list" role="list">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          data-testid={`task-${task.title}`}
          title={task.title}
          done={task.done}
          onToggle={() => onToggle?.(task.id)}
        />
      ))}
    </ul>
  );
}
