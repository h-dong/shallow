import type { ReactNode } from "react";

type ButtonProps = {
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function Button({ disabled, onClick, children }: ButtonProps) {
  return (
    <button disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

type SaveBarProps = {
  disabled: boolean;
  onSave: () => void;
};

export function SaveBar({ disabled, onSave }: SaveBarProps) {
  return (
    <footer>
      <Button disabled={disabled} onClick={onSave}>
        Save
      </Button>
    </footer>
  );
}
