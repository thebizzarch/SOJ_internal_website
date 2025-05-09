/**
 * Chart Rendering Module for HR Metrics Dashboard
 * Handles creation and updating of all chart visualizations
 */

import { CATEGORY_COLORS, EMPLOYEE_COLORS, TASK_CATEGORIES, TASK_ORDER } from '../config/metrics-config.js';
import { getHourlyRate } from '../services/utils.js';

// Color caches for consistent styling
const TASK_COLOR_CACHE = {};
const TASK_BORDER_COLOR_CACHE = {};
const CATEGORY_COLOR_CACHE = {};
const CATEGORY_BORDER_COLOR_CACHE = {};

// Chart instances
const charts = {
  all: { pieChart: null, barChart: null, timeLineChart: null, comparisonChart: null },
  victoria: { pieChart: null, barChart: null, timeLineChart: null },
  kyle: { pieChart: null, barChart: null, timeLineChart: null },
  brooke: { pieChart: null, barChart: null, timeLineChart: null },
  melanie: { pieChart: null, barChart: null, timeLineChart: null },
  austin: { pieChart: null, barChart: null, timeLineChart: null }
};

// Common chart configuration
const commonChartConfig = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: { size: 10 },
        boxWidth: 10
      }
    }
  }
};

// Cache for chart data to prevent unnecessary recalculations
const chartDataCache = new Map();

// Debounce function for chart updates
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get cached chart data or calculate and cache it
 * @param {string} cacheKey - Unique key for the data
 * @param {Function} calculateFn - Function to calculate data if not cached
 * @returns {*} Cached or calculated data
 */
function getCachedChartData(cacheKey, calculateFn) {
  if (chartDataCache.has(cacheKey)) {
    return chartDataCache.get(cacheKey);
  }
  const data = calculateFn();
  chartDataCache.set(cacheKey, data);
  return data;
}

/**
 * Clear chart data cache for specific employee or all
 * @param {string} [employeeName] - Optional employee name to clear specific cache
 */
export function clearChartDataCache(employeeName) {
  if (employeeName) {
    // Clear cache for specific employee
    for (const key of chartDataCache.keys()) {
      if (key.startsWith(employeeName)) {
        chartDataCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    chartDataCache.clear();
  }
}

// Debounced chart update function
const debouncedUpdateChart = debounce((chart, newData) => {
  if (chart && !chart.destroyed) {
    chart.data = newData;
    chart.update('none'); // Use 'none' mode for better performance
  }
}, 250);

/**
 * Update chart data with debouncing
 * @param {Chart} chart - Chart instance to update
 * @param {Object} newData - New data to set
 */
export function updateChartData(chart, newData) {
  if (!chart) return;
  debouncedUpdateChart(chart, newData);
}

/**
 * Validate required parameters for chart initialization
 * @param {string} employeeName - Employee name
 * @param {string} chartType - Type of chart
 * @throws {Error} If validation fails
 */
function validateChartParams(employeeName, chartType) {
  if (!employeeName || typeof employeeName !== 'string') {
    throw new Error('Invalid employee name provided');
  }
  if (!chartType || typeof chartType !== 'string') {
    throw new Error('Invalid chart type provided');
  }
  if (!charts[employeeName]) {
    throw new Error(`No chart configuration found for employee: ${employeeName}`);
  }
}

/**
 * Get common tooltip configuration based on display mode
 * @param {string} globalDisplayMode - 'hours' or 'cost'
 * @returns {Object} Tooltip configuration
 */
function getTooltipConfig(globalDisplayMode) {
  return {
    callbacks: {
      label: function(context) {
        const value = context.raw || 0;
        if (globalDisplayMode === 'cost') {
          return [`${context.dataset.label || ''}: $${value.toFixed(2)}`];
        } else {
          return [`${context.dataset.label || ''}: ${value.toFixed(1)} hours`];
        }
      }
    }
  };
}

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
 * Clean up chart resources
 * @param {string} employeeName - Employee name
 * @param {string} chartType - Type of chart to clean up
 */
export function cleanupChart(employeeName, chartType) {
  try {
    if (!charts[employeeName] || !charts[employeeName][chartType]) {
      return;
    }

    const chart = charts[employeeName][chartType];
    if (chart && !chart.destroyed) {
      chart.destroy();
    }
    charts[employeeName][chartType] = null;
    
    // Clear related cache entries
    clearChartDataCache(employeeName);
  } catch (error) {
    console.error(`Failed to cleanup chart for ${employeeName} ${chartType}:`, error);
  }
}

/**
 * Clean up all charts for an employee or all employees
 * @param {string} [employeeName] - Optional employee name to clean up specific charts
 */
export function cleanupAllCharts(employeeName) {
  try {
    if (employeeName) {
      // Clean up specific employee's charts
      Object.keys(charts[employeeName]).forEach(chartType => {
        cleanupChart(employeeName, chartType);
      });
    } else {
      // Clean up all charts
      Object.keys(charts).forEach(emp => {
        Object.keys(charts[emp]).forEach(chartType => {
          cleanupChart(emp, chartType);
        });
      });
    }
  } catch (error) {
    console.error('Failed to cleanup charts:', error);
  }
}

// Add cleanup on window unload
window.addEventListener('unload', () => {
  cleanupAllCharts();
});

/**
 * Initialize pie chart for employee or team
 * @param {string} employeeName - Employee name or 'all' for team
 * @param {Object} detailedTaskData - Task data
 * @param {string} globalLevelMode - 'category' or 'task'
 * @param {string} globalDisplayMode - 'hours' or 'cost'
 * @returns {Chart} - Chart.js instance
 * @throws {Error} If chart initialization fails
 */
export function initializeTaskPieChart(employeeName, detailedTaskData, globalLevelMode, globalDisplayMode) {
  try {
    validateChartParams(employeeName, 'pieChart');
    
    // Clean up existing chart before creating new one
    cleanupChart(employeeName, 'pieChart');
    
    const cacheKey = `${employeeName}-pie-${globalLevelMode}-${globalDisplayMode}`;
    
    // Get or calculate chart data
    const chartData = getCachedChartData(cacheKey, () => {
      // Get the canvas element
      const pieCanvas = document.getElementById(`${employeeName}-pieChart`);
      if (!pieCanvas) {
        throw new Error(`Canvas element not found for ${employeeName} pie chart`);
      }
      
      let chartData = [];
      
      if (globalLevelMode === 'category') {
        // Prepare data aggregated by category
        const categoryData = {};
        
        // Initialize category data
        Object.keys(TASK_CATEGORIES).forEach(category => {
          categoryData[category] = {
            name: category,
            hours: 0,
            cost: 0,
            type: category
          };
        });
        
        // Aggregate task data into categories
        Object.entries(detailedTaskData).forEach(([taskName, data]) => {
          if (data.totalHours > 0) {
            // Find which category this task belongs to
            Object.entries(TASK_CATEGORIES).forEach(([category, tasks]) => {
              if (tasks.includes(taskName)) {
                categoryData[category].hours += data.totalHours;
                categoryData[category].cost += data.totalCost;
              }
            });
          }
        });
        
        // Convert to array and filter out empty categories
        chartData = Object.values(categoryData).filter(item => item.hours > 0);
        
        // Sort by hours (descending)
        chartData.sort((a, b) => b.hours - a.hours);
      } else {
        // Use task-level data
        Object.entries(detailedTaskData).forEach(([taskName, data]) => {
          if (data.totalHours > 0) {
            // Find which type this category belongs to
            let categoryType = '';
            Object.entries(TASK_CATEGORIES).forEach(([type, categories]) => {
              if (categories.includes(taskName)) {
                categoryType = type;
              }
            });
            
            chartData.push({
              name: taskName,
              hours: data.totalHours,
              cost: data.totalCost,
              type: categoryType
            });
          }
        });
        
        // Sort tasks according to predefined order
        chartData = [...chartData].sort((a, b) => {
          const indexA = TASK_ORDER.indexOf(a.name);
          const indexB = TASK_ORDER.indexOf(b.name);
          
          // If both tasks are in our order list, use that order
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }
          
          // If only one is in the list, prioritize the one in the list
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          
          // If neither is in the list, sort by hours (descending)
          return b.hours - a.hours;
        });
      }
      
      // Calculate total values for percentages
      const totalHours = chartData.reduce((sum, item) => sum + item.hours, 0);
      const totalCost = chartData.reduce((sum, item) => sum + item.cost, 0);
      
      // Determine which value to use for the pie chart (hours or cost)
      const displayByCost = globalDisplayMode === 'cost';
      const dataValues = displayByCost ? 
        chartData.map(item => item.cost) : 
        chartData.map(item => item.hours);
      
      // Create labels with appropriate percentages
      const labels = chartData.map(item => {
        const value = displayByCost ? item.cost : item.hours;
        const total = displayByCost ? totalCost : totalHours;
        const percentage = ((value / total) * 100).toFixed(1);
        return `${item.name}: ${percentage}%`;
      });
      
      // Get appropriate colors based on level mode
      const backgroundColor = globalLevelMode === 'category' ?
        chartData.map(item => getCategoryColor(item.name)) :
        chartData.map(item => getTaskColor(item.name));
        
      const borderColor = globalLevelMode === 'category' ?
        chartData.map(item => getCategoryBorderColor(item.name)) :
        chartData.map(item => getTaskBorderColor(item.name));
      
      return {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          borderWidth: 1
        }]
      };
    });
    
    // Create the pie chart with error handling
    const pieCtx = pieCanvas.getContext('2d');
    if (!pieCtx) {
      throw new Error('Failed to get canvas context');
    }
    
    charts[employeeName].pieChart = new Chart(pieCtx, {
      type: 'pie',
      data: chartData,
      options: {
        ...commonChartConfig,
        plugins: {
          ...commonChartConfig.plugins,
          tooltip: getTooltipConfig(globalDisplayMode)
        }
      }
    });
    
    return charts[employeeName].pieChart;
  } catch (error) {
    console.error(`Failed to initialize pie chart for ${employeeName}:`, error);
    throw new Error(`Pie chart initialization failed: ${error.message}`);
  }
}

/**
 * Initialize bar chart for employee or team
 * @param {string} employeeName - Employee name or 'all' for team
 * @param {Array} barData - Data for the bar chart
 * @param {string} globalLevelMode - 'category' or 'task'
 * @param {string} globalDisplayMode - 'hours' or 'cost'
 * @returns {Chart} - Chart.js instance
 */
export function initializeBarChart(employeeName, barData, globalLevelMode, globalDisplayMode) {
  try {
    validateChartParams(employeeName, 'barChart');
    
    // Clean up existing chart before creating new one
    cleanupChart(employeeName, 'barChart');
    
    const barCanvas = document.getElementById(`${employeeName}-barChart`);
    if (!barCanvas) return null;
    
    // Use cost or hours based on global display mode
    const displayByCost = globalDisplayMode === 'cost';
    
    // Get appropriate colors based on level mode
    const backgroundColor = globalLevelMode === 'category' ?
      barData.map(item => getCategoryColor(item.name)) :
      barData.map(item => getTaskColor(item.name));
      
    const borderColor = globalLevelMode === 'category' ?
      barData.map(item => getCategoryBorderColor(item.name)) :
      barData.map(item => getTaskBorderColor(item.name));
    
    const barCtx = barCanvas.getContext('2d');
    charts[employeeName].barChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: barData.map(item => item.name),
        datasets: [{
          label: displayByCost ? 'Cost ($)' : 'Hours',
          data: displayByCost ? 
            barData.map(item => item.cost) : 
            barData.map(item => item.hours),
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const index = context.dataIndex;
                const item = barData[index];
                if (displayByCost) {
                  return [`Cost: $${item.cost.toFixed(2)}`, `Hours: ${item.hours.toFixed(1)}`];
                } else {
                  return [`Hours: ${item.hours.toFixed(1)}`, `Cost: $${item.cost.toFixed(2)}`];
                }
              }
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: displayByCost ? 'Cost ($)' : 'Hours'
            }
          },
          y: {
            ticks: {
              font: {
                size: globalLevelMode === 'category' ? 12 : 8 // Adjust font size based on level mode
              }
            }
          }
        }
      }
    });
    
    return charts[employeeName].barChart;
  } catch (error) {
    console.error(`Failed to initialize bar chart for ${employeeName}:`, error);
    throw new Error(`Bar chart initialization failed: ${error.message}`);
  }
}

/**
 * Initialize time trend line chart
 * @param {string} employeeName - Employee name or 'all' for team
 * @param {Array} datasets - Chart datasets
 * @param {Array} labels - Week labels
 * @param {string} globalDisplayMode - 'hours' or 'cost'
 * @returns {Chart} - Chart.js instance
 */
export function initializeTimeLineChart(employeeName, datasets, labels, globalDisplayMode) {
  try {
    validateChartParams(employeeName, 'timeLineChart');
    
    // Clean up existing chart before creating new one
    cleanupChart(employeeName, 'timeLineChart');
    
    const timeCanvas = document.getElementById(`${employeeName}-timeLineChart`);
    if (!timeCanvas) return null;
    
    const timeCtx = timeCanvas.getContext('2d');
    charts[employeeName].timeLineChart = new Chart(timeCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.raw || 0;
                
                if (globalDisplayMode === 'cost') {
                  return [`${label}: $${value.toFixed(2)}`];
                } else {
                  return [`${label}: ${value.toFixed(1)} hours`];
                }
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: globalDisplayMode === 'cost' ? 'Cost ($)' : 'Hours'
            }
          }
        }
      }
    });
    
    return charts[employeeName].timeLineChart;
  } catch (error) {
    console.error(`Failed to initialize timeline chart for ${employeeName}:`, error);
    throw new Error(`Timeline chart initialization failed: ${error.message}`);
  }
}

/**
 * Initialize employee comparison chart for team view
 * @param {Object} comparisonData - Comparison data object
 * @param {string} globalDisplayMode - 'hours' or 'cost'
 * @returns {Chart} - Chart.js instance
 */
export function initializeComparisonChart(comparisonData, globalDisplayMode) {
  try {
    validateChartParams('all', 'comparisonChart');
    
    // Clean up existing chart before creating new one
    cleanupChart('all', 'comparisonChart');
    
    const comparisonCanvas = document.getElementById('team-comparisonChart');
    if (!comparisonCanvas) return null;
    
    const comparisonCtx = comparisonCanvas.getContext('2d');
    charts.all.comparisonChart = new Chart(comparisonCtx, {
      type: 'bar',
      data: comparisonData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: globalDisplayMode === 'cost' ? 'Cost ($)' : 'Hours'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const datasetLabel = context.dataset.label || '';
                const value = context.raw || 0;
                const employeeName = context.label;
                
                if (globalDisplayMode === 'cost') {
                  return [`${datasetLabel}: $${value.toFixed(2)}`];
                } else {
                  return [`${datasetLabel}: ${value.toFixed(1)} hours`];
                }
              }
            }
          }
        }
      }
    });
    
    return charts.all.comparisonChart;
  } catch (error) {
    console.error('Failed to initialize comparison chart:', error);
    throw new Error(`Comparison chart initialization failed: ${error.message}`);
  }
}

/**
 * Update chart titles based on display mode
 * @param {string} globalLevelMode - 'category' or 'task'
 * @param {string} globalDisplayMode - 'hours' or 'cost'
 */
export function updateChartTitles(globalLevelMode, globalDisplayMode) {
  const displayType = globalDisplayMode === 'hours' ? 'Hours' : 'Cost';
  const levelType = globalLevelMode === 'category' ? 'Category' : 'Task';
  
  // Update all chart titles
  document.getElementById('all-pie-chart-title').textContent = `Team ${levelType} Distribution (${displayType})`;
  document.getElementById('all-bar-chart-title').textContent = `Team ${levelType} Breakdown (${displayType})`;
  document.getElementById('team-comparison-chart-title').textContent = `Employee Time Allocation Comparison (${displayType})`;
  document.getElementById('all-time-line-chart-title').textContent = `Team Weekly Trends (${displayType})`;
  
  document.getElementById('victoria-pie-chart-title').textContent = `Time Distribution by ${levelType} (${displayType})`;
  document.getElementById('victoria-bar-chart-title').textContent = `${levelType} Breakdown (${displayType})`;
  document.getElementById('victoria-time-line-chart-title').textContent = `Weekly Time Trends (${displayType})`;
  
  document.getElementById('kyle-pie-chart-title').textContent = `Time Distribution by ${levelType} (${displayType})`;
  document.getElementById('kyle-bar-chart-title').textContent = `${levelType} Breakdown (${displayType})`;
  document.getElementById('kyle-time-line-chart-title').textContent = `Weekly Time Trends (${displayType})`;
  
  document.getElementById('brooke-pie-chart-title').textContent = `Time Distribution by ${levelType} (${displayType})`;
  document.getElementById('brooke-bar-chart-title').textContent = `${levelType} Breakdown (${displayType})`;
  document.getElementById('brooke-time-line-chart-title').textContent = `Weekly Time Trends (${displayType})`;
  
  document.getElementById('melanie-pie-chart-title').textContent = `Time Distribution by ${levelType} (${displayType})`;
  document.getElementById('melanie-bar-chart-title').textContent = `${levelType} Breakdown (${displayType})`;
  document.getElementById('melanie-time-line-chart-title').textContent = `Weekly Time Trends (${displayType})`;
  
  document.getElementById('austin-pie-chart-title').textContent = `Time Distribution by ${levelType} (${displayType})`;
  document.getElementById('austin-bar-chart-title').textContent = `${levelType} Breakdown (${displayType})`;
  document.getElementById('austin-time-line-chart-title').textContent = `Weekly Time Trends (${displayType})`;
}

// Add a proper caching layer
class DataCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
}

class DashboardError extends Error {
  constructor(message, type, details = {}) {
    super(message);
    this.name = 'DashboardError';
    this.type = type;
    this.details = details;
  }
}

// Usage in data fetching
async function fetchEmployeeData(silent = false) {
  try {
    // ... existing code ...
  } catch (error) {
    if (error instanceof DashboardError) {
      handleDashboardError(error);
    } else {
      throw new DashboardError(
        'Failed to fetch employee data',
        'FETCH_ERROR',
        { originalError: error }
      );
    }
  }
}

class DashboardState {
  constructor() {
    this.state = {
      displayMode: 'hours',
      levelMode: 'category',
      activeEmployee: 'all',
      dateRange: { start: 'all', end: 'all' },
      data: null,
      loading: false,
      error: null
    };
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }
}

function renderLoadingState(container) {
  container.innerHTML = `
    <div class="loading-skeleton">
      <div class="skeleton-header"></div>
      <div class="skeleton-chart"></div>
    </div>
  `;
}

function renderErrorState(container, error) {
  container.innerHTML = `
    <div class="error-state">
      <h3>Error Loading Data</h3>
      <p>${error.message}</p>
      <button onclick="retryLoading()">Retry</button>
    </div>
  `;
}

/**
 * Initializes the employee dashboard with the specified configuration
 * @param {Object} config - Dashboard configuration
 * @param {string} config.employeeName - Name of the employee
 * @param {string} config.displayMode - Display mode ('hours' or 'cost')
 * @param {string} config.levelMode - Level mode ('category' or 'task')
 * @returns {Promise<void>}
 * @throws {DashboardError} If initialization fails
 */
async function initializeEmployeeDashboard(config) {
  // Implementation
}