/**
 * Week Range Filter Component for HR Metrics Dashboard
 */

import { ValidationError } from '../../utils/errors.js';
import dashboardState from '../../services/state-manager.js';

export class WeekRangeFilter {
  constructor(options = {}) {
    this.options = {
      startWeekId: 'start-week',
      endWeekId: 'end-week',
      applyButtonId: 'apply-filter',
      resetButtonId: 'reset-filter',
      activeFilterId: 'active-filter',
      filterTextId: 'filter-text',
      ...options
    };
    
    this.elements = {};
    this.initialize();
  }

  /**
   * Initialize the filter component
   * @private
   */
  initialize() {
    // Get DOM elements
    this.elements = {
      startWeek: document.getElementById(this.options.startWeekId),
      endWeek: document.getElementById(this.options.endWeekId),
      applyButton: document.getElementById(this.options.applyButtonId),
      resetButton: document.getElementById(this.options.resetButtonId),
      activeFilter: document.getElementById(this.options.activeFilterId),
      filterText: document.getElementById(this.options.filterTextId)
    };

    // Validate required elements
    Object.entries(this.elements).forEach(([key, element]) => {
      if (!element) {
        throw new ValidationError(`Required element not found: ${key}`);
      }
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for the filter
   * @private
   */
  setupEventListeners() {
    this.elements.applyButton.addEventListener('click', () => this.applyFilter());
    this.elements.resetButton.addEventListener('click', () => this.resetFilter());
  }

  /**
   * Update week range options based on available data
   * @param {Array} data - Employee data
   */
  updateWeekOptions(data) {
    // Extract unique weeks and sort them
    const weeks = [...new Set(data.map(row => row['Week Range']))].sort((a, b) => {
      return new Date(a) - new Date(b);
    });

    // Save current selections
    const currentStartWeek = this.elements.startWeek.value;
    const currentEndWeek = this.elements.endWeek.value;

    // Clear existing options except "All Time"
    while (this.elements.startWeek.options.length > 1) {
      this.elements.startWeek.remove(1);
    }
    while (this.elements.endWeek.options.length > 1) {
      this.elements.endWeek.remove(1);
    }

    // Add options for each week
    weeks.forEach(week => {
      const startOption = document.createElement('option');
      startOption.value = week;
      startOption.textContent = week;
      this.elements.startWeek.appendChild(startOption);

      const endOption = document.createElement('option');
      endOption.value = week;
      endOption.textContent = week;
      this.elements.endWeek.appendChild(endOption);
    });

    // Restore selections if they exist in the new options
    if (weeks.includes(currentStartWeek)) {
      this.elements.startWeek.value = currentStartWeek;
    }
    if (weeks.includes(currentEndWeek)) {
      this.elements.endWeek.value = currentEndWeek;
    } else if (weeks.length > 0) {
      // Default to the latest week for end week
      this.elements.endWeek.value = weeks[weeks.length - 1];
    }
  }

  /**
   * Apply the week range filter
   * @private
   */
  applyFilter() {
    const startWeek = this.elements.startWeek.value;
    const endWeek = this.elements.endWeek.value;

    if (!this.validateWeekSelection(startWeek, endWeek)) {
      throw new ValidationError('Invalid selection: Start week must be before or equal to end week');
    }

    // Update state
    dashboardState.setDateRange(startWeek, endWeek);
    
    // Update UI
    this.updateFilterDisplay();
  }

  /**
   * Reset the week range filter
   * @private
   */
  resetFilter() {
    this.elements.startWeek.value = 'all';
    this.elements.endWeek.value = 'all';
    
    // Update state
    dashboardState.setDateRange('all', 'all');
    
    // Update UI
    this.updateFilterDisplay();
  }

  /**
   * Validate week selection
   * @private
   */
  validateWeekSelection(startWeek, endWeek) {
    if (startWeek === 'all' || endWeek === 'all') {
      return true;
    }

    const startDate = new Date(startWeek);
    const endDate = new Date(endWeek);

    return startDate <= endDate;
  }

  /**
   * Update filter display status
   * @private
   */
  updateFilterDisplay() {
    const { start, end } = dashboardState.getDateRange();

    if (start === 'all' && end === 'all') {
      this.elements.activeFilter.classList.add('hidden');
    } else {
      this.elements.activeFilter.classList.remove('hidden');
      let filterString = '';

      if (start === 'all') {
        filterString = `Up to ${end}`;
      } else if (end === 'all') {
        filterString = `From ${start} onwards`;
      } else {
        filterString = `${start} to ${end}`;
      }

      this.elements.filterText.textContent = filterString;
    }
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    this.elements.applyButton.removeEventListener('click', this.applyFilter);
    this.elements.resetButton.removeEventListener('click', this.resetFilter);
  }
} 