type EmailFieldProps = {
  value?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
};

export function EmailField({ value = "", disabled = false, onChange }: EmailFieldProps) {
  return (
    <input
      id="email-input"
      data-testid="email-input"
      type="email"
      name="email"
      role="textbox"
      className="email-input"
      value={value}
      disabled={disabled}
      aria-label="Email address"
      onChange={(event) => onChange?.(event.target.value)}
    />
  );
}
