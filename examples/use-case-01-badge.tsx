type BadgeProps = {
  label: string;
  tone?: "neutral" | "success" | "danger";
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  return <span data-tone={tone}>{label}</span>;
}
