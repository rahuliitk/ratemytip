export function formatNumber(num: number): string {
  if (Math.abs(num) >= 1e7) {
    return `${(num / 1e7).toFixed(2)}Cr`;
  }
  if (Math.abs(num) >= 1e5) {
    return `${(num / 1e5).toFixed(2)}L`;
  }
  if (Math.abs(num) >= 1e3) {
    return `${(num / 1e3).toFixed(1)}K`;
  }
  return num.toFixed(2);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}
