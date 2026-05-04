import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <footer>{action}</footer> : null}
    </section>
  );
}
