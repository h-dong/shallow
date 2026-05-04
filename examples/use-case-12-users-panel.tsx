export function Spinner({ label }: { label: string }) {
  return <span>{label}</span>;
}

export function ErrorBanner({ message }: { message: string }) {
  return <div role="alert">{message}</div>;
}

export function EmptyState({ title }: { title: string }) {
  return <section>{title}</section>;
}

type User = {
  id: string;
  name: string;
};

export function UserList({ users }: { users: User[] }) {
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

type UsersPanelProps = {
  status: "loading" | "error" | "success";
  users: User[];
};

export function UsersPanel({ status, users }: UsersPanelProps) {
  if (status === "loading") {
    return <Spinner label="Loading users" />;
  }

  if (status === "error") {
    return <ErrorBanner message="Could not load users" />;
  }

  if (users.length === 0) {
    return <EmptyState title="No users" />;
  }

  return <UserList users={users} />;
}
