/**
 * HR Metrics Dashboard Main Module
 * Entry point for the HR metrics dashboard application
 */

// Import modules
import { SPREADSHEET_CONFIG, EMPLOYEE_RATES, TASK_CATEGORIES, TASK_ORDER, EMPLOYEE_COLORS } from '../config/metrics-config.js';
import { initializeColorCaches, updateChartTitles, initializeTaskPieChart, initializeBarChart, initializeTimeLineChart, initializeComparisonChart } from '../config/chart-renderer.js';
import { fetchEmployeeData, calculateDetailedTaskData, updateDataSourceIndicator } from '../config/data-processor.js';
import { getTaskCategories, filterDataByWeekRange, validateWeekSelection, getHourlyRate } from '../config/utils.js';

// Import components
import { LoadingState } from '../components/loading-state.js';
import { SearchFilter } from '../components/search-filter.js';
import { errorHandler, ValidationError, DataFetchError } from '../utils/errors.js';

// Global state variables
let employeesData = [];
let filteredEmployeesData = [];
let activeStartWeek = 'all';
let activeEndWeek = 'all';
let lastUpdated = null;
let autoRefreshEnabled = false;
let autoRefreshIntervalId = null;
let dataSourceConnected = false;

// Display mode state (hours or cost)
let globalDisplayMode = 'hours';

// View level state (category or task)
let globalLevelMode = 'category';

// Initialize components
const loadingState = new LoadingState();
let searchFilter;

/**
 * Initialize the dashboard
 */
async function initializeDashboard() {
  console.log('Initializing HR Metrics Dashboard...');
  
  try {
    // Show initial loading state
    loadingState.show('Initializing dashboard...');
    
    // Initialize components
    searchFilter = new SearchFilter();
    
    // Initialize color caches for charts
    initializeColorCaches();
    
    // Set up tab functionality
    setupTabNavigation();
    
    // Initialize filter and file upload controls
    initializeFilterControls();
    
    // Initialize data source indicator
    updateDataSourceIndicator('disconnected', 'Connecting to data source...');
    
    // Attempt to fetch data
    try {
      employeesData = await fetchEmployeeData();
      
      // If we successfully got data
      if (employeesData.length > 0) {
        // Set filtered data to full dataset initially
        filteredEmployeesData = [...employeesData];
        
        // Update all charts
        updateAllEmployeeCharts();
        
        // Set up auto-refresh if connected to data source
        if (dataSourceConnected) {
          setupAutoRefresh();
        }
        
        console.log('Dashboard initialized successfully with data.');
      } else {
        throw new ValidationError('No data loaded. Please upload a CSV file.');
      }
    } catch (error) {
      throw new DataFetchError('Failed to fetch data', { originalError: error });
    }
    
    // Validate task categories
    validateTaskCategories();
    
    // Hide loading state
    loadingState.hide();
    
  } catch (error) {
    // Handle initialization error
    errorHandler.handleError(error, { context: 'dashboard-initialization' });
    
    // Show error state with retry option
    loadingState.showError(error, () => {
      initializeDashboard();
    });
  }
}

/**
 * Set up employee tab navigation
 */
function setupTabNavigation() {
  const tabs = document.querySelectorAll('.tab');
  const dashboards = document.querySelectorAll('.employee-dashboard');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding dashboard
      const employeeName = tab.getAttribute('data-employee');
      dashboards.forEach(dashboard => {
        dashboard.classList.remove('active');
      });
      document.getElementById(`${employeeName}-dashboard`).classList.add('active');
    });
  });
}

/**
 * Initialize filter controls and global toggles
 */
function initializeFilterControls() {
  const startWeekSelect = document.getElementById('start-week');
  const endWeekSelect = document.getElementById('end-week');
  const applyFilterButton = document.getElementById('apply-filter');
  const resetFilterButton = document.getElementById('reset-filter');
  const refreshButton = document.getElementById('refresh-button');
  const fileInput = document.getElementById('csv-file-input');
  const fileImportArea = document.getElementById('file-import-area');
  const fileSelectButton = document.getElementById('file-select-button');
  
  // Global display toggle setup
  const globalToggleSwitch = document.getElementById('global-display-toggle');
  const globalHoursLabel = document.getElementById('global-hours-label');
  const globalCostLabel = document.getElementById('global-cost-label');
  
  // Category/Task toggle setup
  const categoryTaskToggle = document.getElementById('category-task-toggle');
  const categoryLabel = document.getElementById('global-category-label');
  const taskLabel = document.getElementById('global-task-label');

  // Apply filter button
  applyFilterButton.addEventListener('click', () => {
    const startWeek = startWeekSelect.value;
    const endWeek = endWeekSelect.value;
    
    if (!validateWeekSelection(startWeek, endWeek)) {
      alert('Invalid selection: Start week must be before or equal to end week');
      return;
    }
    
    console.log(`Applying filter: ${startWeek} to ${endWeek}`);
    
    // Update active filter variables
    activeStartWeek = startWeek;
    activeEndWeek = endWeek;
    
    // Recalculate filtered data
    filteredEmployeesData = filterDataByWeekRange(employeesData, startWeek, endWeek);
    console.log(`Filter applied, ${filteredEmployeesData.length} records now in filtered data`);
    
    // Update all charts with new filtered data
    updateAllEmployeeCharts();
  });
  
  // Reset filter button
  resetFilterButton.addEventListener('click', () => {
    console.log('Resetting all filters');
    
    // Reset week range
    startWeekSelect.value = 'all';
    endWeekSelect.value = 'all';
    
    // Reset search
    searchFilter.reset();
    
    // Reset state
    dashboardState.resetAllFilters();
    
    // Reset filtered data
    filteredEmployeesData = [...employeesData];
    console.log(`All filters reset, using all ${filteredEmployeesData.length} records`);
    
    // Update all charts with full data
    updateAllEmployeeCharts();
  });
  
  // Refresh button
  refreshButton.addEventListener('click', async () => {
    // Fetch fresh data
    const newData = await fetchEmployeeData();
    
    if (newData.length > 0) {
      employeesData = newData;
      
      // Update filtered data based on current filter settings
      filteredEmployeesData = filterDataByWeekRange(employeesData, activeStartWeek, activeEndWeek);
      
      // Update all charts
      updateAllEmployeeCharts();
    }
  });
  
  // File select button
  fileSelectButton.addEventListener('click', () => {
    console.log('File select button clicked');
    fileInput.click();
  });
  
  // File input change
  fileInput.addEventListener('change', (event) => {
    console.log('File input changed');
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      console.log('Selected file:', file.name);
      handleFileUpload(file);
    }
  });
  
  // Drag and drop for file import area
  fileImportArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.stopPropagation();
    fileImportArea.classList.add('active');
  });
  
  fileImportArea.addEventListener('dragleave', (event) => {
    event.preventDefault();
    event.stopPropagation();
    fileImportArea.classList.remove('active');
  });
  
  fileImportArea.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
    fileImportArea.classList.remove('active');
    
    if (event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      console.log('Dropped file:', file.name);
      handleFileUpload(file);
    }
  });
  
  // Global display toggle event handler
  globalToggleSwitch.addEventListener('click', () => {
    // Toggle the global display mode
    globalDisplayMode = globalDisplayMode === 'hours' ? 'cost' : 'hours';
    
    // Update UI
    if (globalDisplayMode === 'cost') {
      globalToggleSwitch.classList.add('active');
      globalHoursLabel.classList.remove('active');
      globalCostLabel.classList.add('active');
    } else {
      globalToggleSwitch.classList.remove('active');
      globalHoursLabel.classList.add('active');
      globalCostLabel.classList.remove('active');
    }
    
    // Update all charts to reflect the new display mode
    updateAllEmployeeCharts();
  });
  
  // Hours label click handler
  globalHoursLabel.addEventListener('click', () => {
    if (globalDisplayMode !== 'hours') {
      globalDisplayMode = 'hours';
      globalToggleSwitch.classList.remove('active');
      globalHoursLabel.classList.add('active');
      globalCostLabel.classList.remove('active');
      updateAllEmployeeCharts();
    }
  });
  
  // Cost label click handler
  globalCostLabel.addEventListener('click', () => {
    if (globalDisplayMode !== 'cost') {
      globalDisplayMode = 'cost';
      globalToggleSwitch.classList.add('active');
      globalHoursLabel.classList.remove('active');
      globalCostLabel.classList.add('active');
      updateAllEmployeeCharts();
    }
  });
  
  // Category/Task toggle event handler
  categoryTaskToggle.addEventListener('click', () => {
    // Toggle the global level mode
    globalLevelMode = globalLevelMode === 'category' ? 'task' : 'category';
    
    // Update UI
    if (globalLevelMode === 'task') {
      categoryTaskToggle.classList.add('active');
      categoryLabel.classList.remove('active');
      taskLabel.classList.add('active');
    } else {
      categoryTaskToggle.classList.remove('active');
      categoryLabel.classList.add('active');
      taskLabel.classList.remove('active');
    }
    
    // Update all charts to reflect the new level mode
    updateAllEmployeeCharts();
  });
  
  // Category label click handler
  categoryLabel.addEventListener('click', () => {
    if (globalLevelMode !== 'category') {
      globalLevelMode = 'category';
      categoryTaskToggle.classList.remove('active');
      categoryLabel.classList.add('active');
      taskLabel.classList.remove('active');
      updateAllEmployeeCharts();
    }
  });
  
  // Task label click handler
  taskLabel.addEventListener('click', () => {
    if (globalLevelMode !== 'task') {
      globalLevelMode = 'task';
      categoryTaskToggle.classList.add('active');
      categoryLabel.classList.remove('active');
      taskLabel.classList.add('active');
      updateAllEmployeeCharts();
    }
  });
}

/**
 * Handle file upload
 * @param {File} file - Uploaded CSV file
 */
function handleFileUpload(file) {
  loadingState.show('Processing CSV file...');
  
  const refreshIcon = document.getElementById('refresh-icon');
  refreshIcon.classList.add('spin-animation');
  
  // Use Papa Parse to parse the CSV
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function(results) {
      try {
        if (results.errors.length > 0) {
          console.warn('CSV parsing had errors:', results.errors);
        }
        
        if (results.data.length === 0) {
          throw new ValidationError('No data found in the CSV file.');
        }
        
        // Update global data
        employeesData = results.data;
        filteredEmployeesData = [...employeesData];
        
        // Update data source indicator
        updateDataSourceIndicator('disconnected', 'Using manually uploaded CSV file');
        
        // Update last updated time
        lastUpdated = new Date();
        document.getElementById('last-updated-time').textContent = lastUpdated.toLocaleString();
        
        // Update week range dropdowns
        updateWeekRangeOptions(results.data);
        
        // Update all charts
        updateAllEmployeeCharts();
        
        // Hide loading state
        loadingState.hide();
        
      } catch (error) {
        errorHandler.handleError(error, { context: 'file-upload' });
        loadingState.showError(error);
      } finally {
        refreshIcon.classList.remove('spin-animation');
      }
    },
    error: function(error) {
      const fetchError = new DataFetchError('Error parsing CSV file', { originalError: error });
      errorHandler.handleError(fetchError, { context: 'file-upload' });
      loadingState.showError(fetchError);
      refreshIcon.classList.remove('spin-animation');
    }
  });
}

/**
 * Update week range dropdown options
 * @param {Array} data - Employee data
 */
function updateWeekRangeOptions(data) {
  // Extract unique weeks and sort them
  const weeks = [...new Set(data.map(row => row['Week Range']))].sort((a, b) => {
    return new Date(a) - new Date(b);
  });
  
  const startWeekSelect = document.getElementById('start-week');
  const endWeekSelect = document.getElementById('end-week');
  
  // Save current selections
  const currentStartWeek = startWeekSelect.value;
  const currentEndWeek = endWeekSelect.value;
  
  // Clear existing options except "All Time"
  while (startWeekSelect.options.length > 1) {
    startWeekSelect.remove(1);
  }
  
  while (endWeekSelect.options.length > 1) {
    endWeekSelect.remove(1);
  }
  
  // Add options for each week
  weeks.forEach(week => {
    const startOption = document.createElement('option');
    startOption.value = week;
    startOption.textContent = week;
    startWeekSelect.appendChild(startOption);
    
    const endOption = document.createElement('option');
    endOption.value = week;
    endOption.textContent = week;
    endWeekSelect.appendChild(endOption);
  });
  
  // Restore selections if they exist in the new options
  if (weeks.includes(currentStartWeek)) {
    startWeekSelect.value = currentStartWeek;
  }
  
  if (weeks.includes(currentEndWeek)) {
    endWeekSelect.value = currentEndWeek;
  } else if (weeks.length > 0) {
    // Default to the latest week for end week
    endWeekSelect.value = weeks[weeks.length - 1];
  }
}

/**
 * Update filter display status
 */
function updateFilterDisplay() {
  const activeFilter = document.getElementById('active-filter');
  const filterText = document.getElementById('filter-text');
  
  if (activeStartWeek === 'all' && activeEndWeek === 'all') {
    activeFilter.classList.add('hidden');
  } else {
    activeFilter.classList.remove('hidden');
    let filterString = '';
    
    if (activeStartWeek === 'all') {
      filterString = `Up to ${activeEndWeek}`;
    } else if (activeEndWeek === 'all') {
      filterString = `From ${activeStartWeek} onwards`;
    } else {
      filterString = `${activeStartWeek} to ${activeEndWeek}`;
    }
    
    filterText.textContent = filterString;
  }
}

/**
 * Set up auto-refresh functionality
 */
function setupAutoRefresh() {
  // Clear any existing auto-refresh
  if (autoRefreshIntervalId) {
    clearInterval(autoRefreshIntervalId);
    autoRefreshIntervalId = null;
  }
  
  // Only set up auto-refresh if we successfully loaded data
  if (employeesData.length > 0 && dataSourceConnected) {
    console.log(`Setting up auto-refresh every ${SPREADSHEET_CONFIG.refreshInterval/1000} seconds`);
    
    // Set interval for auto-refresh
    autoRefreshIntervalId = setInterval(async () => {
      console.log('Auto-refreshing data...');
      
      try {
        // Fetch fresh data
        const newData = await fetchEmployeeData(true); // true = silent refresh
        
        if (newData.length > 0) {
          employeesData = newData;
          
          // Update filtered data based on current filter settings
          filteredEmployeesData = filterDataByWeekRange(employeesData, activeStartWeek, activeEndWeek);
          
          // Update all charts
          updateAllEmployeeCharts();
          
          console.log('Auto-refresh completed successfully');
        } else {
          console.warn('Auto-refresh failed: No data returned');
        }
      } catch (error) {
        console.error('Error during auto-refresh:', error);
      }
    }, SPREADSHEET_CONFIG.refreshInterval);
    
    // Store status
    autoRefreshEnabled = true;
    
    // Update UI
    const autoRefreshStatus = document.getElementById('auto-refresh-status');
    autoRefreshStatus.textContent = `Auto-refreshes every ${SPREADSHEET_CONFIG.refreshInterval/60000} minutes`;
    autoRefreshStatus.classList.remove('hidden');
  } else {
    // Disable auto-refresh UI
    autoRefreshEnabled = false;
    const autoRefreshStatus = document.getElementById('auto-refresh-status');
    autoRefreshStatus.classList.add('hidden');
  }
}

/**
 * Update all employee charts with filtered data
 */
function updateAllEmployeeCharts() {
  // Update chart titles based on display mode
  updateChartTitles(globalLevelMode, globalDisplayMode);
  
  // Initialize the team dashboard first
  initializeTeamDashboard();
  
  // Then initialize individual employee dashboards
  initializeEmployeeCharts('victoria');
  initializeEmployeeCharts('kyle');
  initializeEmployeeCharts('brooke');
  initializeEmployeeCharts('melanie');
  initializeEmployeeCharts('austin');
  
  // Update filter display
  updateFilterDisplay();
}

/**
 * Initialize charts for an individual employee
 * @param {string} employeeName - Employee name
 */
function initializeEmployeeCharts(employeeName) {
  if (employeesData.length === 0) {
    displayNoDataMessage(employeeName);
    return;
  }
  
  const taskCategories = getTaskCategories(employeesData);
  
  // Get data for this employee
  const employeeData = filteredEmployeesData.filter(row => {
    const email = row.User.toLowerCase();
    return email.includes(employeeName.toLowerCase());
  });
  
  // If no data after filtering, show a message
  if (employeeData.length === 0) {
    displayNoDataMessage(employeeName);
    return;
  }
  
  // Calculate detailed task data
  const detailedTaskData = calculateDetailedTaskData(employeeData, taskCategories);
  
  // Also calculate simple totals for backward compatibility
  const totalsByCategory = {};
  taskCategories.forEach(task => {
    totalsByCategory[task] = detailedTaskData[task].totalHours;
  });
  
  // Create detailed breakdown for bar chart
  const detailedBreakdown = [];
  Object.entries(detailedTaskData).forEach(([taskName, data]) => {
    if (data.totalHours > 0) {
      // Find which type this category belongs to
      let categoryType = '';
      Object.entries(TASK_CATEGORIES).forEach(([type, categories]) => {
        if (categories.includes(taskName)) {
          categoryType = type;
        }
      });
      
      detailedBreakdown.push({
        name: taskName,
        hours: data.totalHours,
        cost: data.totalCost,
        type: categoryType
      });
    }
  });
  
  const hourlyRate = getHourlyRate(employeeName);
  
  // Update summary statistics
  updateEmployeeSummary(employeeName, totalsByCategory, detailedBreakdown);
  
  // Initialize pie chart
  initializeTaskPieChart(
    employeeName, 
    detailedTaskData,
    globalLevelMode,
    globalDisplayMode
  );
  
  // Initialize bar chart with category or task view
  let barData = [];
  
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
    detailedBreakdown.forEach(task => {
      Object.entries(TASK_CATEGORIES).forEach(([category, tasks]) => {
        if (tasks.includes(task.name)) {
          categoryData[category].hours += task.hours;
          categoryData[category].cost += task.cost;
        }
      });
    });
    
    // Convert to array and filter out empty categories
    barData = Object.values(categoryData).filter(item => item.hours > 0);
    
    // Sort by hours (descending)
    barData.sort((a, b) => b.hours - a.hours);
  } else {
    // Use task-level data (original implementation)
    barData = [...detailedBreakdown].sort((a, b) => {
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
  
  initializeBarChart(employeeName, barData, globalLevelMode, globalDisplayMode);
  
  // Initialize time line chart if available
  const timeChartContainer = document.getElementById(`${employeeName}-timeLineChart-container`);
  const noDataMessage = document.getElementById(`${employeeName}-no-trend-data`);
  
  // Check if we have multiple weeks of data
  const uniqueWeeks = [...new Set(employeeData.map(row => row['Week Range']))];
  
  if (uniqueWeeks.length > 1) {
    if (noDataMessage) {
      noDataMessage.style.display = 'none';
    }
    
    if (timeChartContainer) {
      timeChartContainer.style.display = 'block';
    }
    
    // Get weeks in chronological order
    const weeks = [...uniqueWeeks].sort((a, b) => new Date(a) - new Date(b));
    
    // Prepare datasets based on view level
    let datasets = [];
    
    if (globalLevelMode === 'category') {
      // Create weekly data by category
      const weeklyDataByCategory = {};
      weeks.forEach(week => {
        weeklyDataByCategory[week] = {
          totalHours: 0,
          totalCost: 0
        };
        
        // Initialize categories
        Object.keys(TASK_CATEGORIES).forEach(category => {
          weeklyDataByCategory[week][category] = {
            hours: 0,
            cost: 0
          };
        });
      });
      
      // Fill data
      employeeData.forEach(row => {
        const week = row['Week Range'];
        
        Object.entries(TASK_CATEGORIES).forEach(([category, tasks]) => {
          tasks.forEach(task => {
            const hours = row[task] || 0;
            if (hours > 0) {
              weeklyDataByCategory[week][category].hours += hours;
              weeklyDataByCategory[week][category].cost += hours * hourlyRate;
              weeklyDataByCategory[week].totalHours += hours;
              weeklyDataByCategory[week].totalCost += hours * hourlyRate;
            }
          });
        });
      });
      
      // Create datasets for categories (top 3 by total hours)
      const categoryTotals = {};
      Object.keys(TASK_CATEGORIES).forEach(category => {
        categoryTotals[category] = weeks.reduce((sum, week) => {
          return sum + weeklyDataByCategory[week][category].hours;
        }, 0);
      });
      
      // Get top 3 categories
      const topCategories = Object.entries(categoryTotals)
        .filter(([_, total]) => total > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category]) => category);
      
      // Use cost or hours based on global display mode
      const displayByCost = globalDisplayMode === 'cost';
      
      // Create datasets for top categories
      topCategories.forEach(category => {
        datasets.push({
          label: category,
          data: weeks.map(week => displayByCost ? 
            weeklyDataByCategory[week][category].cost : 
            weeklyDataByCategory[week][category].hours),
          borderColor: getCategoryBorderColor(category),
          backgroundColor: getCategoryColor(category),
          tension: 0.1
        });
      });
      
      // Add total dataset
      datasets.push({
        label: displayByCost ? 'Total Cost' : 'Total Hours',
        data: weeks.map(week => displayByCost ? 
          weeklyDataByCategory[week].totalCost : 
          weeklyDataByCategory[week].totalHours),
        borderColor: '#FF5733',
        backgroundColor: 'rgba(255, 87, 51, 0.8)',
        borderWidth: 2,
        tension: 0.1
      });
    } else {
      // Get top 3 activities
      const topActivities = detailedBreakdown.slice(0, 3);
      
      // Prepare data for each week
      const weeklyDataMap = {};
      employeeData.forEach(row => {
        const week = row['Week Range'];
        if (!weeklyDataMap[week]) {
          weeklyDataMap[week] = {
            totalHours: 0,
            totalCost: 0
          };
          
          // Initialize all top activities
          topActivities.forEach(activity => {
            weeklyDataMap[week][activity.name] = {
              hours: 0,
              cost: 0
            };
          });
        }
        
        // Add hours for each activity
        topActivities.forEach(activity => {
          const hours = row[activity.name] || 0;
          if (hours > 0) {
            weeklyDataMap[week][activity.name].hours += hours;
            weeklyDataMap[week][activity.name].cost += hours * hourlyRate;
            weeklyDataMap[week].totalHours += hours;
            weeklyDataMap[week].totalCost += hours * hourlyRate;
          }
        });
        
        // Add other hours and costs
        Object.keys(row).forEach(key => {
          if (!['Date', 'User', 'Week Range'].includes(key) && 
              !topActivities.some(a => a.name === key)) {
            const hours = row[key] || 0;
            if (hours > 0) {
              weeklyDataMap[week].totalHours += hours;
              weeklyDataMap[week].totalCost += hours * hourlyRate;
            }
          }
        });
      });
      
      // Convert to array format for chart
      const weeklyData = weeks.map(week => ({
        week,
        ...weeklyDataMap[week]
      }));
      
      // Use cost or hours based on global display mode
      const displayByCost = globalDisplayMode === 'cost';
      
      // Create datasets
      datasets = topActivities.map(activity => ({
        label: activity.name,
        data: weeklyData.map(week => displayByCost ? 
          week[activity.name]?.cost || 0 : 
          week[activity.name]?.hours || 0),
        borderColor: getTaskBorderColor(activity.name),
        backgroundColor: getTaskColor(activity.name),
        tension: 0.1
      }));
      
      // Add total dataset
      datasets.push({
        label: displayByCost ? 'Total Cost' : 'Total Hours',
        data: weeklyData.map(week => displayByCost ? week.totalCost : week.totalHours),
        borderColor: '#FF5733',
        backgroundColor: 'rgba(255, 87, 51, 0.8)',
        borderWidth: 2,
        tension: 0.1
      });
    }
    
    initializeTimeLineChart(employeeName, datasets, weeks, globalDisplayMode);
  } else {
    // Hide line chart container
    if (timeChartContainer) {
      timeChartContainer.style.display = 'none';
    }
    
    // Show no data message
    if (noDataMessage) {
      noDataMessage.style.display = 'block';
      if (uniqueWeeks.length === 1) {
        noDataMessage.textContent = `Weekly trend data not available - ${employeeName} only has data for one week (${uniqueWeeks[0]})`;
      } else {
        noDataMessage.textContent = `No data available for the selected date range.`;
      }
    }
  }
}

/**
 * Initialize the team dashboard
 */
function initializeTeamDashboard() {
  // Implementation of team dashboard goes here
  // (Similar structure to individual employee dashboards)
  // For brevity, this is omitted from this file
}

/**
 * Update employee summary card statistics
 * @param {string} employeeName - Employee name
 * @param {Object} totalsByCategory - Hours by category
 * @param {Array} detailedBreakdown - Detailed breakdown
 */
function updateEmployeeSummary(employeeName, totalsByCategory, detailedBreakdown) {
  // Get the correct hourly rate for this employee
  const hourlyRate = getHourlyRate(employeeName);
  
  const totalHoursElement = document.getElementById(`${employeeName}-total-hours`);
  const totalHoursSubtitleElement = document.getElementById(`${employeeName}-total-hours-subtitle`);
  const totalCostElement = document.getElementById(`${employeeName}-total-cost`);
  
  const mostTimeActivityElement = document.getElementById(`${employeeName}-most-time-activity`);
  const mostTimeHoursElement = document.getElementById(`${employeeName}-most-time-hours`);
  const mostTimeCostElement = document.getElementById(`${employeeName}-most-time-cost`);
  
  const weeklyAverageElement = document.getElementById(`${employeeName}-weekly-average`);
  const weeklyAverageSubtitleElement = document.getElementById(`${employeeName}-weekly-average-subtitle`);
  const weeklyAverageCostElement = document.getElementById(`${employeeName}-weekly-average-cost`);
  
  // Calculate total hours
  const totalHours = Object.values(totalsByCategory).reduce((sum, hours) => sum + hours, 0);
  
  // Find most time-consuming activity
  let mostTimeActivity = "None";
  let mostTimeHours = 0;
  let mostTimePercentage = 0;
  let mostTimeCost = 0;
  
  if (detailedBreakdown.length > 0) {
    // Sort by hours (original sorting might have been by predefined order)
    const sortedByHours = [...detailedBreakdown].sort((a, b) => b.hours - a.hours);
    const topActivity = sortedByHours[0];
    mostTimeActivity = topActivity.name;
    mostTimeHours = topActivity.hours;
    mostTimePercentage = ((mostTimeHours / totalHours) * 100).toFixed(1);
    mostTimeCost = topActivity.cost !== undefined ? topActivity.cost : mostTimeHours * hourlyRate;
  }
  
  // Calculate weekly average
  const employeeData = filteredEmployeesData.filter(row => row.User.toLowerCase().includes(employeeName));
  const uniqueWeeks = [...new Set(employeeData.map(row => row['Week Range']))];
  const weeklyAverage = (totalHours / uniqueWeeks.length).toFixed(1);
  
  // Update the elements if they exist
  if (totalHoursElement) {
    totalHoursElement.textContent = totalHours.toFixed(1);
  }
  
  if (totalHoursSubtitleElement) {
    totalHoursSubtitleElement.textContent = `Hours tracked across ${uniqueWeeks.length} week${uniqueWeeks.length !== 1 ? 's' : ''}`;
  }
  
  if (totalCostElement) {
    totalCostElement.textContent = `$${(totalHours * hourlyRate).toFixed(2)} total compensation`;
  }
  
  if (mostTimeActivityElement) {
    mostTimeActivityElement.textContent = mostTimeActivity;
  }
  
  if (mostTimeHoursElement) {
    mostTimeHoursElement.textContent = `${mostTimeHours.toFixed(1)} hours (${mostTimePercentage}%)`;
  }
  
  if (mostTimeCostElement) {
    mostTimeCostElement.textContent = `$${mostTimeCost.toFixed(2)} spent on this activity`;
  }
  
  if (weeklyAverageElement) {
    weeklyAverageElement.textContent = weeklyAverage;
  }
  
  if (weeklyAverageSubtitleElement) {
    weeklyAverageSubtitleElement.textContent = 'Hours per week';
  }
  
  if (weeklyAverageCostElement) {
    weeklyAverageCostElement.textContent = `$${(weeklyAverage * hourlyRate).toFixed(2)} weekly compensation`;
  }
}

/**
 * Display no data message for an employee
 * @param {string} employeeName - Employee name
 */
function displayNoDataMessage(employeeName) {
  const dashboard = document.getElementById(`${employeeName}-dashboard`);
  
  // Clear summary stats
  const statValues = dashboard.querySelectorAll('.stat-value');
  statValues.forEach(value => {
    value.textContent = 'N/A';
  });
  
  const statSubtitles = dashboard.querySelectorAll('.stat-subtitle');
  statSubtitles.forEach(subtitle => {
    subtitle.textContent = 'No data available';
  });
  
  const costTexts = dashboard.querySelectorAll('.cost-text');
  costTexts.forEach(cost => {
    cost.textContent = '$0.00';
  });
  
  // Handle line chart
  const noTrendData = document.getElementById(`${employeeName}-no-trend-data`);
  const timeLineChartContainer = document.getElementById(`${employeeName}-timeLineChart-container`);
  
  if (noTrendData) {
    noTrendData.style.display = 'block';
    noTrendData.textContent = `No data available for ${employeeName} in the selected date range.`;
  }
  
  if (timeLineChartContainer) {
    timeLineChartContainer.style.display = 'none';
  }
}

/**
 * Validate task categories for debugging
 */
function validateTaskCategories() {
  // Get all tasks from categories
  const allTasks = Object.values(TASK_CATEGORIES).flat();
  
  // Check for tasks in TASK_ORDER that aren't in categories
  const missingTasks = TASK_ORDER.filter(task => !allTasks.includes(task));
  if (missingTasks.length > 0) {
    console.warn('Warning: Some tasks in TASK_ORDER are not found in TASK_CATEGORIES:', missingTasks);
  }
  
  // Check for tasks in categories that aren't in TASK_ORDER
  const extraTasks = allTasks.filter(task => !TASK_ORDER.includes(task));
  if (extraTasks.length > 0) {
    console.warn('Warning: Some tasks in TASK_CATEGORIES are not found in TASK_ORDER:', extraTasks);
  }
  
  console.log('Task category validation completed.');
}

/**
 * Filter data based on current state
 * @param {Array} data - Data to filter
 * @returns {Array} Filtered data
 */
function filterData(data) {
  let filtered = [...data];
  const state = dashboardState.getFilterState();

  // Apply week range filter
  if (state.dateRange.start !== 'all' || state.dateRange.end !== 'all') {
    filtered = filterDataByWeekRange(filtered, state.dateRange.start, state.dateRange.end);
  }

  // Apply employee filter
  if (state.activeEmployee !== 'all') {
    filtered = filtered.filter(row => 
      row.User.toLowerCase().includes(state.activeEmployee.toLowerCase())
    );
  }

  // Apply search filter
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(row => {
      return Object.entries(row).some(([key, value]) => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        return false;
      });
    });
  }

  // Apply task category filter
  if (state.taskCategory !== 'all') {
    filtered = filtered.filter(row => {
      const taskCategories = getTaskCategories([row]);
      return taskCategories.includes(state.taskCategory);
    });
  }

  return filtered;
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeDashboard);

// Export any functions that might be needed elsewhere
export {
  initializeDashboard,
  updateAllEmployeeCharts
};