import type { ReactNode } from "react";

type ButtonProps = {
  onClick: () => void;
  children: ReactNode;
};

export function Button({ onClick, children }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}

type UserActionsProps = {
  name: string;
  onEdit: (name: string) => void;
};

export function UserActions({ name, onEdit }: UserActionsProps) {
  return <Button onClick={() => onEdit(name)}>Edit profile</Button>;
}
