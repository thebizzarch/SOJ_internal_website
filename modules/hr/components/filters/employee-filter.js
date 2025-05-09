/**
 * Employee Filter Component for HR Metrics Dashboard
 */

import { ValidationError } from '../../utils/errors.js';
import dashboardState from '../../services/state-manager.js';

export class EmployeeFilter {
  constructor(options = {}) {
    this.options = {
      employeeSelectId: 'employee-select',
      activeFilterId: 'active-employee-filter',
      filterTextId: 'employee-filter-text',
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
      employeeSelect: document.getElementById(this.options.employeeSelectId),
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
    this.elements.employeeSelect.addEventListener('change', () => this.applyFilter());
  }

  /**
   * Update employee options based on available data
   * @param {Array} data - Employee data
   */
  updateEmployeeOptions(data) {
    // Extract unique employees and sort them
    const employees = [...new Set(data.map(row => row['Employee Name']))].sort();

    // Save current selection
    const currentEmployee = this.elements.employeeSelect.value;

    // Clear existing options except "All Employees"
    while (this.elements.employeeSelect.options.length > 1) {
      this.elements.employeeSelect.remove(1);
    }

    // Add options for each employee
    employees.forEach(employee => {
      const option = document.createElement('option');
      option.value = employee;
      option.textContent = employee;
      this.elements.employeeSelect.appendChild(option);
    });

    // Restore selection if it exists in the new options
    if (employees.includes(currentEmployee)) {
      this.elements.employeeSelect.value = currentEmployee;
    }
  }

  /**
   * Apply the employee filter
   * @private
   */
  applyFilter() {
    const selectedEmployee = this.elements.employeeSelect.value;
    
    // Update state
    dashboardState.setActiveEmployee(selectedEmployee);
    
    // Update UI
    this.updateFilterDisplay();
  }

  /**
   * Update filter display status
   * @private
   */
  updateFilterDisplay() {
    const activeEmployee = dashboardState.getActiveEmployee();

    if (activeEmployee === 'all') {
      this.elements.activeFilter.classList.add('hidden');
    } else {
      this.elements.activeFilter.classList.remove('hidden');
      this.elements.filterText.textContent = activeEmployee;
    }
  }

  /**
   * Reset the employee filter
   */
  resetFilter() {
    this.elements.employeeSelect.value = 'all';
    dashboardState.setActiveEmployee('all');
    this.updateFilterDisplay();
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    this.elements.employeeSelect.removeEventListener('change', this.applyFilter);
  }
} 