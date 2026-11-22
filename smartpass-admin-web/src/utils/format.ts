import dayjs from 'dayjs';

/**
 * Format date time to "DD/MM/YYYY HH:mm"
 */
export const formatDateTime = (date?: string | Date | null): string => {
  if (!date) return '-';
  return dayjs(date).format('DD/MM/YYYY HH:mm');
};

/**
 * Format date to "DD/MM/YYYY"
 */
export const formatDate = (date?: string | Date | null): string => {
  if (!date) return '-';
  return dayjs(date).format('DD/MM/YYYY');
};

/**
 * Format time string: keep backend "HH:mm" strings as-is
 */
export const formatTime = (time?: string | null): string => {
  if (!time) return '-';
  return time;
};

/**
 * Format VND currency: 150000 -> "150.000 ₫"
 */
export const formatVND = (amount?: number | null): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
};

/**
 * Truncate ObjectId in middle for table display (e.g., "66e...bd9f")
 */
export const truncateId = (id?: string | null, left = 4, right = 4): string => {
  if (!id) return '-';
  if (id.length <= left + right) return id;
  return `${id.slice(0, left)}...${id.slice(-right)}`;
};

/**
 * Mask QR token: first 6 + "…" + last 4
 */
export const maskQrToken = (token?: string | null): string => {
  if (!token) return '-';
  if (token.length <= 10) return token;
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
};

/**
 * Calculate overdue days if dueAt is in the past
 */
export const getOverdueDays = (dueAt?: string | Date | null): number => {
  if (!dueAt) return 0;
  const now = dayjs();
  const due = dayjs(dueAt);
  if (now.isAfter(due)) {
    return Math.max(1, now.diff(due, 'day'));
  }
  return 0;
};

