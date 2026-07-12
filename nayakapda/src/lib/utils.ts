/**
 * Formats a number as Indian Rupee currency string.
 * Example: formatINR(12345.5) → "₹12,345.50"
 *
 * Requirements: 23.4
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Generates a URL-safe slug from a string.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a unique referral code.
 */
export function generateReferralCode(userId: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const prefix = userId.slice(-4).toUpperCase();
  const random = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `NK${prefix}${random}`;
}

/**
 * Formats a date as DD MMM YYYY
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Truncates text to a maximum length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Clamps a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Paginates an array (for client-side pagination)
 */
export function paginate<T>(array: T[], page: number, limit: number): T[] {
  const start = (page - 1) * limit;
  return array.slice(start, start + limit);
}

/**
 * Extracts order summary text for sharing ("Copy Order" feature)
 * Requirements: 6.7
 */
export function generateOrderSummaryText(
  items: Array<{ productName: string; size: string; color: string; qty: number; unitPrice: number }>
): string {
  const lines = items.map(
    (item) =>
      `${item.productName} (${item.size} / ${item.color}) × ${item.qty} = ${formatINR(item.qty * item.unitPrice)}`
  );
  const total = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  return `Order Summary — NayaKapda\n\n${lines.join('\n')}\n\nTotal: ${formatINR(total)}`;
}
