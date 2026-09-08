/**
 * Returns current local date formatted as YYYY-MM-DD
 */
export const getTodayLocalDate = (dateObj = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats an ISO or date string to readable display date
 */
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-');
    if (y && m && d) {
      const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};
