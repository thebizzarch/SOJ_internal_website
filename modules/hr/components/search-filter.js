/**
 * Search Filter Component for HR Metrics Dashboard
 */

export class SearchFilter {
  constructor(options = {}) {
    this.options = {
      inputId: 'search-input',
      clearButtonId: 'search-clear',
      ...options
    };
    
    this.elements = {};
    this.initialize();
  }

  /**
   * Initialize the search filter component
   * @private
   */
  initialize() {
    this.elements.input = document.getElementById(this.options.inputId);
    this.elements.clearButton = document.getElementById(this.options.clearButtonId);
    
    if (!this.elements.input || !this.elements.clearButton) {
      console.warn('Search filter elements not found');
      return;
    }
    
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   * @private
   */
  setupEventListeners() {
    // Clear button click
    this.elements.clearButton.addEventListener('click', () => {
      this.reset();
    });
    
    // Input changes
    this.elements.input.addEventListener('input', (event) => {
      const value = event.target.value;
      this.updateClearButtonVisibility(value);
      this.triggerSearch(value);
    });
  }

  /**
   * Update clear button visibility
   * @param {string} value - Current input value
   * @private
   */
  updateClearButtonVisibility(value) {
    if (this.elements.clearButton) {
      this.elements.clearButton.style.display = value ? 'block' : 'none';
    }
  }

  /**
   * Trigger search with current value
   * @param {string} value - Search value
   * @private
   */
  triggerSearch(value) {
    // Dispatch custom event with search value
    const event = new CustomEvent('search', { detail: { value } });
    this.elements.input.dispatchEvent(event);
  }

  /**
   * Reset the search filter
   */
  reset() {
    if (this.elements.input) {
      this.elements.input.value = '';
      this.updateClearButtonVisibility('');
      this.triggerSearch('');
    }
  }

  /**
   * Get current search value
   * @returns {string} Current search value
   */
  getValue() {
    return this.elements.input ? this.elements.input.value : '';
  }
} 