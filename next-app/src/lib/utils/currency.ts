export const TAKA_SYMBOL = '৳';

export function formatTaka(amount: number): string {
  const numeric = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
  return `${TAKA_SYMBOL}${formatted}`;
}

