import { useAccountSectionState } from "./use-case-04-account-section-state";
export { useAccountSectionState } from "./use-case-04-account-section-state";

type IconProps = {
  name: "chevron-up" | "chevron-down";
};

export function Icon({ name }: IconProps) {
  return <span aria-hidden="true" data-icon={name} />;
}

type DisclosurePanelProps = {
  open: boolean;
  label: string;
};

export function DisclosurePanel({ open, label }: DisclosurePanelProps) {
  if (!open) {
    return null;
  }

  return <div aria-label={label}>Panel content</div>;
}

type AccountSectionProps = {
  title: string;
};

export function AccountSection({ title }: AccountSectionProps) {
  const { isExpanded, toggle } = useAccountSectionState();

  return (
    <section>
      <h2>{title}</h2>
      <button onClick={toggle}>Toggle {title}</button>
      <Icon name={isExpanded ? "chevron-up" : "chevron-down"} />
      <DisclosurePanel open={isExpanded} label={title} />
    </section>
  );
}
