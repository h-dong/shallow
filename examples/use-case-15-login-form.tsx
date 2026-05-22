import { EmailField } from "./use-case-15-email-field";

type LoginFormProps = {
  email?: string;
  disabled?: boolean;
  onSubmit?: (email: string) => void;
};

export function LoginForm({ email = "", disabled = false, onSubmit }: LoginFormProps) {
  return (
    <form id="login-form" data-testid="login-form" onSubmit={() => onSubmit?.(email)}>
      <EmailField value={email} disabled={disabled} />
      <button type="submit" name="submit" disabled={disabled}>
        Sign in
      </button>
    </form>
  );
}
