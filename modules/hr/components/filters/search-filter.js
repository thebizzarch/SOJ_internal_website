/**
 * Search Filter Component for HR Metrics Dashboard
 */

import { ValidationError } from '../../utils/errors.js';
import dashboardState from '../../services/state-manager.js';

export class SearchFilter {
  constructor(options = {}) {
    this.options = {
      searchInputId: 'search-input',
      searchClearId: 'search-clear',
      ...options
    };
    
    this.elements = {};
    this.initialize();
  }

  /**
   * Initialize the search filter
   * @private
   */
  initialize() {
    // Get DOM elements
    this.elements.searchInput = document.getElementById(this.options.searchInputId);
    this.elements.searchClear = document.getElementById(this.options.searchClearId);

    if (!this.elements.searchInput || !this.elements.searchClear) {
      throw new ValidationError('Required search filter elements not found');
    }

    // Set up event listeners
    this.elements.searchInput.addEventListener('input', this.handleSearch.bind(this));
    this.elements.searchClear.addEventListener('click', this.clearSearch.bind(this));
  }

  /**
   * Handle search input changes
   * @private
   */
  handleSearch() {
    const query = this.elements.searchInput.value.trim();
    dashboardState.setSearchQuery(query);
  }

  /**
   * Clear the search
   * @private
   */
  clearSearch() {
    this.elements.searchInput.value = '';
    dashboardState.setSearchQuery('');
  }

  /**
   * Reset the search filter
   */
  reset() {
    this.clearSearch();
  }
} 