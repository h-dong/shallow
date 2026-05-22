type PrimaryButtonProps = {
  label: string;
  onClick?: () => void;
};

export function PrimaryButton({ label, onClick }: PrimaryButtonProps) {
  return (
    <button type="button" className="primary-button" onClick={onClick}>
      {label}
    </button>
  );
}

type NativeSubmitProps = {
  label: string;
  onClick?: () => void;
};

export function NativeSubmit({ label, onClick }: NativeSubmitProps) {
  return (
    <button type="submit" className="native-submit" onClick={onClick}>
      {label}
    </button>
  );
}

type SubmitPanelProps = {
  label: string;
  usePrimary?: boolean;
  onClick?: () => void;
};

export function SubmitPanel({ label, usePrimary = false, onClick }: SubmitPanelProps) {
  const clickProps = onClick === undefined ? {} : { onClick };

  if (usePrimary) {
    return <PrimaryButton label={label} {...clickProps} />;
  }

  return <NativeSubmit label={label} {...clickProps} />;
}
