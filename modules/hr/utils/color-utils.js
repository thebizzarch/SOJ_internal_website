/**
 * Color utilities for the HR Metrics Dashboard
 */

import { CATEGORY_COLORS, TASK_CATEGORIES } from '../config/metrics-config.js';

// Color caches for consistent styling
const TASK_COLOR_CACHE = {};
const TASK_BORDER_COLOR_CACHE = {};
const CATEGORY_COLOR_CACHE = {};
const CATEGORY_BORDER_COLOR_CACHE = {};

/**
 * Initialize color caches for consistent styling
 * @throws {Error} If color initialization fails
 */
export function initializeColorCaches() {
  try {
    // Set up colors for each category
    Object.entries(CATEGORY_COLORS).forEach(([category, baseColor]) => {
      if (!baseColor || typeof baseColor !== 'string') {
        throw new Error(`Invalid color for category: ${category}`);
      }
      CATEGORY_COLOR_CACHE[category] = baseColor + 'CC'; // Add transparency
      CATEGORY_BORDER_COLOR_CACHE[category] = baseColor;
    });
    
    // Set up colors for each task based on its category
    Object.entries(TASK_CATEGORIES).forEach(([category, tasks]) => {
      const baseColor = CATEGORY_COLORS[category];
      if (!baseColor) return;
      
      tasks.forEach((taskName, index) => {
        // Calculate percentage adjustment based on position in category
        let percentAdjustment;
        if (tasks.length === 1) {
          percentAdjustment = 0; // If only one task, use base color
        } else {
          const midPoint = Math.floor(tasks.length / 2);
          const distanceFromMid = index - midPoint;
          percentAdjustment = distanceFromMid * 15; // Adjust by 15% per step
        }
        
        // Apply the color adjustment
        const adjustedColor = adjustColor(baseColor, percentAdjustment);
        TASK_COLOR_CACHE[taskName] = adjustedColor + 'CC'; // Add transparency
        TASK_BORDER_COLOR_CACHE[taskName] = adjustedColor;
      });
    });
  } catch (error) {
    console.error('Failed to initialize color caches:', error);
    throw new Error('Color cache initialization failed');
  }
}

/**
 * Get color for a specific category
 * @param {string} category - Category name
 * @returns {string} - Color value with transparency
 */
export function getCategoryColor(category) {
  return CATEGORY_COLOR_CACHE[category] || '#ccccccCC'; // Default to gray if not found
}

/**
 * Get border color for a specific category
 * @param {string} category - Category name
 * @returns {string} - Color value
 */
export function getCategoryBorderColor(category) {
  return CATEGORY_BORDER_COLOR_CACHE[category] || '#cccccc'; // Default to gray if not found
}

/**
 * Get color for a specific task
 * @param {string} task - Task name
 * @returns {string} - Color value with transparency
 */
export function getTaskColor(task) {
  return TASK_COLOR_CACHE[task] || '#ccccccCC'; // Default to gray if not found
}

/**
 * Get border color for a specific task
 * @param {string} task - Task name
 * @returns {string} - Color value
 */
export function getTaskBorderColor(task) {
  return TASK_BORDER_COLOR_CACHE[task] || '#cccccc'; // Default to gray if not found
}

/**
 * Generate a shade of a color
 * @param {string} hex - Base color in hex format
 * @param {number} percent - Percentage adjustment
 * @returns {string} - Adjusted color
 */
function adjustColor(hex, percent) {
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
 * Clear all color caches
 */
export function clearColorCaches() {
  Object.keys(TASK_COLOR_CACHE).forEach(key => delete TASK_COLOR_CACHE[key]);
  Object.keys(TASK_BORDER_COLOR_CACHE).forEach(key => delete TASK_BORDER_COLOR_CACHE[key]);
  Object.keys(CATEGORY_COLOR_CACHE).forEach(key => delete CATEGORY_COLOR_CACHE[key]);
  Object.keys(CATEGORY_BORDER_COLOR_CACHE).forEach(key => delete CATEGORY_BORDER_COLOR_CACHE[key]);
} 