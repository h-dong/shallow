import { useCurrentUser } from "./use-case-07-current-user";

type SpinnerProps = {
  label: string;
};

export function Spinner({ label }: SpinnerProps) {
  return <span>{label}</span>;
}

type UserMenuProps = {
  name: string;
  role: "admin" | "member";
};

export function UserMenu({ name, role }: UserMenuProps) {
  return (
    <button>
      {name} ({role})
    </button>
  );
}

export function HeaderAccount() {
  const user = useCurrentUser();

  if (!user) {
    return <Spinner label="Loading account" />;
  }

  return <UserMenu name={user.name} role={user.role} />;
}
