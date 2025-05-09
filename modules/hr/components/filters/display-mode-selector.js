/**
 * Display Mode Selector Component for HR Metrics Dashboard
 */

import { ValidationError } from '../../utils/errors.js';
import dashboardState from '../../services/state-manager.js';

export class DisplayModeSelector {
  constructor(options = {}) {
    this.options = {
      displayModeId: 'display-mode',
      levelModeId: 'level-mode',
      ...options
    };
    
    this.elements = {};
    this.initialize();
  }

  /**
   * Initialize the component
   * @private
   */
  initialize() {
    // Get DOM elements
    this.elements = {
      displayMode: document.getElementById(this.options.displayModeId),
      levelMode: document.getElementById(this.options.levelModeId)
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
   * Set up event listeners
   * @private
   */
  setupEventListeners() {
    this.elements.displayMode.addEventListener('change', () => this.updateDisplayMode());
    this.elements.levelMode.addEventListener('change', () => this.updateLevelMode());
  }

  /**
   * Update display mode
   * @private
   */
  updateDisplayMode() {
    const displayMode = this.elements.displayMode.value;
    dashboardState.setDisplayMode(displayMode);
  }

  /**
   * Update level mode
   * @private
   */
  updateLevelMode() {
    const levelMode = this.elements.levelMode.value;
    dashboardState.setLevelMode(levelMode);
  }

  /**
   * Get current display mode
   * @returns {string} Current display mode
   */
  getDisplayMode() {
    return this.elements.displayMode.value;
  }

  /**
   * Get current level mode
   * @returns {string} Current level mode
   */
  getLevelMode() {
    return this.elements.levelMode.value;
  }

  /**
   * Set display mode
   * @param {string} mode - Display mode to set
   */
  setDisplayMode(mode) {
    if (this.elements.displayMode.value !== mode) {
      this.elements.displayMode.value = mode;
      this.updateDisplayMode();
    }
  }

  /**
   * Set level mode
   * @param {string} mode - Level mode to set
   */
  setLevelMode(mode) {
    if (this.elements.levelMode.value !== mode) {
      this.elements.levelMode.value = mode;
      this.updateLevelMode();
    }
  }

  /**
   * Reset to default modes
   */
  reset() {
    this.setDisplayMode('percentage');
    this.setLevelMode('category');
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    this.elements.displayMode.removeEventListener('change', this.updateDisplayMode);
    this.elements.levelMode.removeEventListener('change', this.updateLevelMode);
  }
} 