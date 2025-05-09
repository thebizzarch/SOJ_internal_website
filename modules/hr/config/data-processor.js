/**
 * Data Processing Module for HR Metrics Dashboard
 * Handles data fetching, parsing, and calculations
 */

import { SPREADSHEET_URL, SPREADSHEET_CONFIG } from './metrics-config.js';
import { getHourlyRate, getTaskCategories } from '../services/utils.js';
import { TASK_CATEGORIES } from '../config/metrics-config.js';
import { DataFetchError } from '../utils/errors.js';

/**
 * Fetch employee data from Google Sheets or uploaded CSV
 * @param {boolean} silent - If true, don't show loading indicators
 * @returns {Promise<Array>} - Array of employee time entries
 */
export async function fetchEmployeeData(silent = false) {
  try {
    // Show loading indicator unless silent refresh
    const loadingMessage = document.getElementById('loading-message');
    if (!silent && loadingMessage) {
      loadingMessage.style.display = 'block';
      loadingMessage.textContent = 'Loading data from Google Sheets...';
    }
    
    // Start refresh icon animation
    const refreshIcon = document.getElementById('refresh-icon');
    if (refreshIcon) {
      refreshIcon.classList.add('spin-animation');
    }
    
    let csvText = null;
    let fetchMethod = '';
    
    // Try multiple methods to fetch the data
    const methods = [
      // Method 1: Using gviz format with CORS proxy
      async () => {
        if (!SPREADSHEET_CONFIG?.spreadsheetId) {
          throw new Error('Spreadsheet ID not configured');
        }
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv`;
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(gvizUrl);
        const response = await fetch(proxyUrl);
        if (response.ok) {
          return { text: await response.text(), method: 'gviz-proxy' };
        }
        throw new Error('Gviz proxy fetch failed');
      },
      
      // Method 2: Direct fetch with CORS proxy
      async () => {
        if (!SPREADSHEET_URL) {
          throw new Error('Spreadsheet URL not configured');
        }
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(SPREADSHEET_URL);
        const response = await fetch(proxyUrl);
        if (response.ok) {
          return { text: await response.text(), method: 'direct-proxy' };
        }
        throw new Error('Direct proxy fetch failed');
      },
      
      // Method 3: Using alternative CORS proxy
      async () => {
        if (!SPREADSHEET_URL) {
          throw new Error('Spreadsheet URL not configured');
        }
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(SPREADSHEET_URL);
        const response = await fetch(proxyUrl);
        if (response.ok) {
          return { text: await response.text(), method: 'allorigins-proxy' };
        }
        throw new Error('AllOrigins proxy fetch failed');
      }
    ];
    
    // Try each method in sequence
    for (const method of methods) {
      try {
        const result = await method();
        csvText = result.text;
        fetchMethod = result.method;
        console.log(`Successfully fetched data using ${fetchMethod} method`);
        break;
      } catch (error) {
        console.warn(`Method ${fetchMethod} failed:`, error);
        continue;
      }
    }
    
    // If all methods failed, show message to upload CSV
    if (!csvText) {
      updateDataSourceIndicator('disconnected', 'Could not connect to Google Sheets');
      
      if (!silent && loadingMessage) {
        loadingMessage.innerHTML = 
          'Could not load data from Google Sheets due to browser security restrictions.<br><br>' +
          'Please use the file upload option to load your CSV file.';
      }
      
      if (refreshIcon) {
        refreshIcon.classList.remove('spin-animation');
      }
      
      // Show fallback text in file import area
      const primaryText = document.getElementById('file-import-primary-text');
      const fallbackText = document.getElementById('file-import-fallback-text');
      if (primaryText && fallbackText) {
        primaryText.classList.add('hidden');
        fallbackText.classList.remove('hidden');
      }
      
      throw new DataFetchError('Failed to fetch data from Google Sheets', {
        lastMethod: fetchMethod
      });
    }
    
    // Parse CSV using Papa Parse
    const parseResult = Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });
    
    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing had errors:', parseResult.errors);
      throw new DataFetchError('Error parsing CSV data', {
        parseErrors: parseResult.errors
      });
    }
    
    if (parseResult.data.length === 0) {
      throw new DataFetchError('No data found in the spreadsheet');
    }
    
    // Update data source indicator
    updateDataSourceIndicator('connected', `Connected to Google Sheets via ${fetchMethod} method`);
    
    // Show primary text in file import area
    const primaryText = document.getElementById('file-import-primary-text');
    const fallbackText = document.getElementById('file-import-fallback-text');
    if (primaryText && fallbackText) {
      primaryText.classList.remove('hidden');
      fallbackText.classList.add('hidden');
    }
    
    // Update last updated time
    const lastUpdated = new Date();
    const lastUpdatedElement = document.getElementById('last-updated-time');
    if (lastUpdatedElement) {
      lastUpdatedElement.textContent = lastUpdated.toLocaleString();
    }
    
    // Stop refresh icon animation
    if (refreshIcon) {
      refreshIcon.classList.remove('spin-animation');
    }
    
    // Hide loading message if not silent
    if (!silent && loadingMessage) {
      loadingMessage.style.display = 'none';
    }
    
    return parseResult.data;
  } catch (error) {
    console.error('Error fetching or parsing data:', error);
    
    // Update data source indicator
    updateDataSourceIndicator('disconnected', 'Error connecting to Google Sheets');
    
    if (!silent) {
      const loadingMessage = document.getElementById('loading-message');
      if (loadingMessage) {
        loadingMessage.innerHTML = 
          `Error: ${error.message} <br><br>Please try using the file upload option instead.`;
      }
    }
    
    const refreshIcon = document.getElementById('refresh-icon');
    if (refreshIcon) {
      refreshIcon.classList.remove('spin-animation');
    }
    
    // Show fallback text in file import area
    const primaryText = document.getElementById('file-import-primary-text');
    const fallbackText = document.getElementById('file-import-fallback-text');
    if (primaryText && fallbackText) {
      primaryText.classList.add('hidden');
      fallbackText.classList.remove('hidden');
    }
    
    throw error;
  }
}

/**
 * Calculate detailed task data by employee
 * @param {Array} employeeData - Filtered employee data
 * @param {Array} taskCategories - List of task categories
 * @returns {Object} - Detailed task data object
 */
export function calculateDetailedTaskData(employeeData, taskCategories) {
  const detailedTaskData = {};
  
  // Initialize the data structure
  taskCategories.forEach(task => {
    detailedTaskData[task] = {
      totalHours: 0,
      totalCost: 0,
      byEmployee: {}
    };
  });
  
  // Populate with employee data
  employeeData.forEach(row => {
    const employeeName = row.User.toLowerCase().split('@')[0];
    const hourlyRate = getHourlyRate(employeeName);
    
    taskCategories.forEach(task => {
      const hours = row[task] || 0;
      if (hours > 0) {
        // Add to task total
        detailedTaskData[task].totalHours += hours;
        detailedTaskData[task].totalCost += hours * hourlyRate;
        
        // Track by employee
        if (!detailedTaskData[task].byEmployee[employeeName]) {
          detailedTaskData[task].byEmployee[employeeName] = {
            hours: 0,
            cost: 0
          };
        }
        
        detailedTaskData[task].byEmployee[employeeName].hours += hours;
        detailedTaskData[task].byEmployee[employeeName].cost += hours * hourlyRate;
      }
    });
  });
  
  return detailedTaskData;
}

/**
 * Calculate total hours per category
 * @param {Array} employeeData - Filtered employee data
 * @param {Array} taskCategories - List of task categories
 * @returns {Object} - Totals by category
 */
export function calculateTotalsByCategory(employeeData, taskCategories) {
  const totalsByCategory = {};
  taskCategories.forEach(category => {
    totalsByCategory[category] = employeeData.reduce((sum, row) => {
      return sum + (row[category] || 0);
    }, 0);
  });
  return totalsByCategory;
}

/**
 * Calculate totals by category type
 * @param {Object} totalsByCategory - Totals by category
 * @returns {Object} - Totals by category type
 */
export function calculateTotalsByType(totalsByCategory) {
  const totalsByType = {};
  Object.entries(TASK_CATEGORIES).forEach(([type, categories]) => {
    totalsByType[type] = categories.reduce((sum, category) => {
      return sum + (totalsByCategory[category] || 0);
    }, 0);
  });
  return totalsByType;
}

/**
 * Create detailed breakdown of hours by activity
 * @param {Object} totalsByCategory - Totals by category
 * @returns {Array} - Detailed breakdown array
 */
export function createDetailedBreakdown(totalsByCategory) {
  const detailedBreakdown = [];
  Object.entries(totalsByCategory).forEach(([category, hours]) => {
    if (hours > 0) {
      // Find which type this category belongs to
      let categoryType = '';
      Object.entries(TASK_CATEGORIES).forEach(([type, categories]) => {
        if (categories.includes(category)) {
          categoryType = type;
        }
      });
      
      detailedBreakdown.push({
        name: category,
        hours: hours,
        type: categoryType
      });
    }
  });
  // Sort by hours in descending order
  return detailedBreakdown.sort((a, b) => b.hours - a.hours);
}

/**
 * Prepare pie chart data from totals by type
 * @param {Object} totalsByType - Totals by category type
 * @returns {Array} - Formatted pie chart data
 */
export function preparePieData(totalsByType) {
  const totalHours = Object.values(totalsByType).reduce((sum, hours) => sum + hours, 0);
  return Object.entries(totalsByType)
    .filter(([_, hours]) => hours > 0)
    .map(([type, hours]) => ({
      name: type,
      value: hours,
      percentage: ((hours / totalHours) * 100).toFixed(1)
    }));
}

/**
 * Update data source indicator
 * @param {string} status - Connection status ('connected' or 'disconnected')
 * @param {string} message - Optional status message
 */
export function updateDataSourceIndicator(status, message) {
  const indicator = document.getElementById('data-source-indicator');
  const dot = document.getElementById('source-dot');
  const text = document.getElementById('source-text');
  
  if (status === 'connected') {
    dot.classList.add('connected');
    dot.classList.remove('disconnected');
    window.dataSourceConnected = true;
  } else {
    dot.classList.add('disconnected');
    dot.classList.remove('connected');
    window.dataSourceConnected = false;
  }
  
  text.textContent = message || (status === 'connected' ? 
    'Connected to Google Sheets data source' : 
    'Not connected to data source');
}