const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string): Intl.NumberFormat {
  let f = formatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    });
    formatters.set(currency, f);
  }
  return f;
}

/** Formats integer cents, e.g. 109900 → "$1,099.00 USD". */
export function formatMoney(
  cents: number,
  currency = "USD",
  { withCode = true }: { withCode?: boolean } = {},
): string {
  const value = formatter(currency).format(cents / 100);
  return withCode ? `${value} ${currency}` : value;
}

/** Converts a decimal amount (e.g. from a form) to integer cents without float drift. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}
