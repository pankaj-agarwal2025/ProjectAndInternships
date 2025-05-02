
/**
 * Format date strings for display
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Format null or undefined values for display
 */
export const formatNullable = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  return String(value);
};

/**
 * Get month name from date string
 */
export const getMonthFromDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'long' });
  } catch (error) {
    return '';
  }
};
