/**
 * Loading State Component for HR Metrics Dashboard
 */

export class LoadingState {
  constructor(options = {}) {
    this.options = {
      containerId: 'loading-message',
      ...options
    };
    
    this.elements = {};
    this.initialize();
  }

  /**
   * Initialize the loading state component
   * @private
   */
  initialize() {
    this.elements.container = document.getElementById(this.options.containerId);
    if (!this.elements.container) {
      console.warn('Loading state container not found');
      return;
    }
  }

  /**
   * Show loading state with optional message
   * @param {string} [message] - Optional loading message
   */
  show(message = 'Loading...') {
    if (!this.elements.container) return;
    
    this.elements.container.innerHTML = `
      <div class="loading-skeleton">
        <div class="loading-spinner"></div>
        <div class="loading-text">${message}</div>
      </div>
    `;
    this.elements.container.style.display = 'block';
  }

  /**
   * Show error state
   * @param {Error} error - Error object
   * @param {Function} [retryCallback] - Optional retry callback
   */
  showError(error, retryCallback) {
    if (!this.elements.container) return;
    
    const retryButton = retryCallback ? `
      <button class="retry-button" onclick="(${retryCallback.toString()})()">
        Retry
      </button>
    ` : '';
    
    this.elements.container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <div class="error-message">${error.message}</div>
        ${retryButton}
      </div>
    `;
    this.elements.container.style.display = 'block';
  }

  /**
   * Hide loading state
   */
  hide() {
    if (!this.elements.container) return;
    this.elements.container.style.display = 'none';
  }
} 