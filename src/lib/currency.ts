/**
 * Formats a numerical amount with currency symbol and locale-appropriate grouping.
 * Nepalese Rupees format: Rs. 60,000
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = 'Rs.'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num) || num === null || num === undefined) {
    return `${currency} 0`;
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Format with commas, 2 decimal places if there are cents, else integer
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: absNum % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(absNum);

  return `${isNegative ? '-' : ''}${currency} ${formatted}`;
}

export function formatCompactCurrency(
  amount: number | string | null | undefined,
  currency: string = 'Rs.'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num) || num === null || num === undefined) {
    return `${currency} 0`;
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  if (absNum >= 10000000) {
    return `${isNegative ? '-' : ''}${currency} ${(absNum / 10000000).toFixed(1)}Cr`;
  }
  if (absNum >= 100000) {
    return `${isNegative ? '-' : ''}${currency} ${(absNum / 100000).toFixed(1)}L`;
  }
  if (absNum >= 1000) {
    return `${isNegative ? '-' : ''}${currency} ${(absNum / 1000).toFixed(1)}k`;
  }

  return formatCurrency(amount, currency);
}
