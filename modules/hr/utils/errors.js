/**
 * Custom error classes for HR Metrics Dashboard
 */

export class DashboardError extends Error {
  constructor(message, type, details = {}) {
    super(message);
    this.name = 'DashboardError';
    this.type = type;
    this.details = details;
  }
}

export class ValidationError extends DashboardError {
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class DataFetchError extends DashboardError {
  constructor(message, details = {}) {
    super(message, 'DATA_FETCH_ERROR', details);
    this.name = 'DataFetchError';
  }
}

export class ChartError extends DashboardError {
  constructor(message, details = {}) {
    super(message, 'CHART_ERROR', details);
    this.name = 'ChartError';
  }
}

export class FilterError extends DashboardError {
  constructor(message, details = {}) {
    super(message, 'FILTER_ERROR', details);
    this.name = 'FilterError';
  }
}

/**
 * Error handler for the dashboard
 */
export class ErrorHandler {
  constructor() {
    this.errorListeners = new Set();
  }

  /**
   * Add error listener
   * @param {Function} listener - Error listener function
   */
  addErrorListener(listener) {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /**
   * Handle error
   * @param {Error} error - Error to handle
   * @param {Object} [context] - Additional context
   */
  handleError(error, context = {}) {
    // Log error
    console.error('Dashboard Error:', {
      error,
      context,
      timestamp: new Date().toISOString()
    });

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(error, context);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });

    // Return error for further handling
    return error;
  }

  /**
   * Create error with context
   * @param {string} message - Error message
   * @param {string} type - Error type
   * @param {Object} [details] - Error details
   * @returns {DashboardError} - Created error
   */
  createError(message, type, details = {}) {
    const error = new DashboardError(message, type, details);
    return this.handleError(error, { type, details });
  }
}

// Create and export singleton instance
export const errorHandler = new ErrorHandler();

/**
 * Error handler utility functions
 */
export const handleDashboardError = (error) => {
  console.error(`Dashboard Error [${error.type}]:`, error.message, error.details);
  
  // Update UI based on error type
  switch (error.type) {
    case 'DATA_FETCH_ERROR':
      // Show data fetch error UI
      document.getElementById('loading-message').innerHTML = 
        `Error fetching data: ${error.message}<br><br>Please try using the file upload option instead.`;
      break;
      
    case 'DATA_PROCESSING_ERROR':
      // Show data processing error UI
      document.getElementById('loading-message').innerHTML = 
        `Error processing data: ${error.message}<br><br>Please check your data format.`;
      break;
      
    case 'CHART_RENDER_ERROR':
      // Show chart render error UI
      console.error('Chart rendering failed:', error.message);
      break;
      
    case 'VALIDATION_ERROR':
      // Show validation error UI
      alert(`Validation Error: ${error.message}`);
      break;
      
    default:
      // Show generic error UI
      document.getElementById('loading-message').innerHTML = 
        `An error occurred: ${error.message}`;
  }
  
  // Update data source indicator
  const indicator = document.getElementById('data-source-indicator');
  if (indicator) {
    indicator.classList.add('disconnected');
    indicator.classList.remove('connected');
  }
}; 