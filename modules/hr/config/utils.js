/**
 * Utility functions for HR Metrics Dashboard
 */

import { EMPLOYEE_RATES } from '../config/metrics-config.js';

/**
 * Get hourly rate for a specific employee
 * @param {string} employeeName - The name of the employee
 * @returns {number} - Hourly rate
 */
export function getHourlyRate(employeeName) {
  if (!employeeName) return EMPLOYEE_RATES.default;
  
  // Convert to lowercase and remove any email domain if present
  const normalizedName = employeeName.toLowerCase().split('@')[0];
  return EMPLOYEE_RATES[normalizedName] || EMPLOYEE_RATES.default;
}

/**
 * Parse start date from a week range string
 * @param {string} weekRange - Week range string (e.g., "Mar 10 – Mar 15 (2025)")
 * @returns {Date} - Parsed date
 */
export function parseStartDateFromWeekRange(weekRange) {
  try {
    // Format example: "Mar 10 – Mar 15 (2025)"
    const match = weekRange.match(/([A-Za-z]+)\s+(\d+)/);
    if (match) {
      const month = match[1];
      const day = parseInt(match[2]);
      const year = weekRange.match(/\((\d{4})\)/) ? 
        parseInt(weekRange.match(/\((\d{4})\)/)[1]) : 
        new Date().getFullYear();
      
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      return new Date(year, monthMap[month], day);
    }
    return new Date(0); // Default to epoch if parsing fails
  } catch (e) {
    console.error("Error parsing date from:", weekRange, e);
    return new Date(0);
  }
}

/**
 * Compare two week ranges for sorting
 * @param {string} a - First week range
 * @param {string} b - Second week range
 * @returns {number} - Comparison result (-1, 0, 1)
 */
export function compareWeekRanges(a, b) {
  const dateA = parseStartDateFromWeekRange(a);
  const dateB = parseStartDateFromWeekRange(b);
  return dateA - dateB;
}

/**
 * Generate shades of a color
 * @param {string} hex - Base color in hex format
 * @param {number} percent - Percentage to adjust (-100 to 100)
 * @returns {string} - Adjusted color in hex format
 */
export function adjustColor(hex, percent) {
  // Remove the # if present
  hex = hex.replace(/^#/, '');
  
  // Convert to RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust color
  r = Math.round(r * (100 + percent) / 100);
  g = Math.round(g * (100 + percent) / 100);
  b = Math.round(b * (100 + percent) / 100);
  
  // Ensure values are in valid range
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  
  // Convert back to hex
  return `#${(r.toString(16).padStart(2, '0'))}${(g.toString(16).padStart(2, '0'))}${(b.toString(16).padStart(2, '0'))}`;
}

/**
 * Format a number as currency
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(value, decimals = 2) {
  return `$${value.toFixed(decimals)}`;
}

/**
 * Get task categories (exclude metadata columns)
 * @param {Array} data - Raw data array
 * @returns {Array} - Array of task category names
 */
export function getTaskCategories(data) {
  if (!data || data.length === 0) return [];
  
  return Object.keys(data[0]).filter(key => 
    !['Date', 'User', 'Week Range'].includes(key)
  );
}

/**
 * Filter data by week range
 * @param {Array} data - Raw data array
 * @param {string} startWeek - Start week (or 'all')
 * @param {string} endWeek - End week (or 'all')
 * @returns {Array} - Filtered data array
 */
export function filterDataByWeekRange(data, startWeek, endWeek) {
  if (startWeek === 'all' && endWeek === 'all') {
    return [...data];
  }
  
  return data.filter(row => {
    const weekRange = row['Week Range'];
    
    // If only start week is specified
    if (startWeek !== 'all' && endWeek === 'all') {
      return compareWeekRanges(weekRange, startWeek) >= 0;
    }
    
    // If only end week is specified
    if (startWeek === 'all' && endWeek !== 'all') {
      return compareWeekRanges(weekRange, endWeek) <= 0;
    }
    
    // If both are specified
    return compareWeekRanges(weekRange, startWeek) >= 0 && 
           compareWeekRanges(weekRange, endWeek) <= 0;
  });
}

/**
 * Validate week selection
 * @param {string} startWeek - Start week
 * @param {string} endWeek - End week
 * @returns {boolean} - True if valid
 */
export function validateWeekSelection(startWeek, endWeek) {
  if (startWeek === 'all' || endWeek === 'all') {
    return true;
  }
  
  return compareWeekRanges(startWeek, endWeek) <= 0;
}