type RememberMeProps = {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
};

export function RememberMe({ checked = false, onChange }: RememberMeProps) {
  return (
    <label className="remember-me">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      Remember me
    </label>
  );
}
