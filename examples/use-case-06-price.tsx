type PriceProps = {
  amount: number;
  currency: string;
};

export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function Price({ amount, currency }: PriceProps) {
  return <span>{formatCurrency(amount, currency)}</span>;
}
