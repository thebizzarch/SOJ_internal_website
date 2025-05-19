/**
 * Data Processing Module for HR Metrics Dashboard
 * Handles data fetching, parsing, and calculations
 */

import { SPREADSHEET_URL, SPREADSHEET_CONFIG } from './metrics-config.js';
import { getHourlyRate, getTaskCategories } from '../services/utils.js';
import { TASK_CATEGORIES } from '../config/metrics-config.js';
import { DataFetchError } from '../utils/errors.js';

/**
 * Save data to local storage cache
 * @param {Array} data - The data to cache
 */
function saveDataToCache(data) {
  try {
    const cacheData = {
      timestamp: Date.now(),
      data: data
    };
    localStorage.setItem('hr_dashboard_data_cache', JSON.stringify(cacheData));
    console.log('Data saved to local storage cache');
  } catch (error) {
    console.warn('Failed to save data to cache:', error);
  }
}

/**
 * Load data from local storage cache
 * @returns {Array|null} - Cached data or null if no valid cache
 */
function loadDataFromCache() {
  try {
    const cachedData = localStorage.getItem('hr_dashboard_data_cache');
    if (!cachedData) return null;
    
    const parsedCache = JSON.parse(cachedData);
    const cacheAge = Date.now() - parsedCache.timestamp;
    
    // Cache valid for 24 hours
    if (cacheAge > 24 * 60 * 60 * 1000) {
      console.log('Cache expired, will fetch fresh data');
      return null;
    }
    
    console.log(`Using cached data from ${new Date(parsedCache.timestamp).toLocaleString()}`);
    return parsedCache.data;
  } catch (error) {
    console.warn('Failed to load data from cache:', error);
    return null;
  }
}

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
      },
      
      // Method 4: Using cors-anywhere proxy (add this new method)
      async () => {
        if (!SPREADSHEET_URL) {
          throw new Error('Spreadsheet URL not configured');
        }
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/' + SPREADSHEET_URL;
        const response = await fetch(proxyUrl);
        if (response.ok) {
          return { text: await response.text(), method: 'cors-anywhere-proxy' };
        }
        throw new Error('CORS-Anywhere proxy fetch failed');
      },
      
      // Method 5: Using jsonp.afeld.me proxy (add this new method)
      async () => {
        if (!SPREADSHEET_URL) {
          throw new Error('Spreadsheet URL not configured');
        }
        const proxyUrl = 'https://jsonp.afeld.me/?url=' + encodeURIComponent(SPREADSHEET_URL);
        const response = await fetch(proxyUrl);
        if (response.ok) {
          return { text: await response.text(), method: 'jsonp-proxy' };
        }
        throw new Error('JSONP proxy fetch failed');
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
        console.warn(`Method failed:`, error);
        continue;
      }
    }
    
    // If all methods failed, try to use cached data
    if (!csvText) {
      const cachedData = loadDataFromCache();
      
      if (cachedData) {
        // Update UI to show we're using cached data
        updateDataSourceIndicator('connected', 'Using cached data (offline mode)');
        
        if (!silent && loadingMessage) {
          loadingMessage.style.display = 'none';
        }
        
        if (refreshIcon) {
          refreshIcon.classList.remove('spin-animation');
        }
        
        // Update last updated time from cache
        const lastUpdatedElement = document.getElementById('last-updated-time');
        if (lastUpdatedElement) {
          lastUpdatedElement.textContent = 'Using cached data';
        }
        
        return cachedData;
      }
      
      // If no cache, show message to upload CSV
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
    
    // Save successful data to cache
    saveDataToCache(parseResult.data);
    
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