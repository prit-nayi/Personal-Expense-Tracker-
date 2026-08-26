import { format, parseISO } from 'date-fns';

export function formatCurrency(amount: string | number | null | undefined, currency: string = 'USD'): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '$0.00';
  }
  const numeric = Number(amount);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch (e) {
    return `$${numeric.toFixed(2)}`;
  }
}

export function formatDate(dateString: string | null | undefined, formatStr: string = 'MMM dd, yyyy'): string {
  if (!dateString) return '';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return format(date, formatStr);
  } catch (e) {
    return dateString;
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  return formatDate(dateString, 'MMM dd, yyyy h:mm a');
}
