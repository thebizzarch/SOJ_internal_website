/**
 * Dashboard State Management Module
 * Handles all state management for the HR metrics dashboard
 */

class DashboardState {
  constructor() {
    this.state = {
      displayMode: 'hours',
      levelMode: 'category',
      activeEmployee: 'all',
      dateRange: { start: 'all', end: 'all' },
      searchQuery: '',
      taskCategory: 'all',
      data: null,
      filteredData: null,
      loading: false,
      error: null,
      lastUpdated: null,
      dataSourceConnected: false
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

  // Specific state updates
  setDisplayMode(mode) {
    if (mode !== 'hours' && mode !== 'cost') {
      throw new Error('Invalid display mode');
    }
    this.setState({ displayMode: mode });
  }

  setLevelMode(mode) {
    if (mode !== 'category' && mode !== 'task') {
      throw new Error('Invalid level mode');
    }
    this.setState({ levelMode: mode });
  }

  setActiveEmployee(employee) {
    this.setState({ activeEmployee: employee });
  }

  setDateRange(start, end) {
    this.setState({
      dateRange: { start, end }
    });
  }

  setData(data) {
    this.setState({
      data,
      filteredData: data,
      lastUpdated: new Date(),
      loading: false,
      error: null
    });
  }

  setFilteredData(data) {
    this.setState({ filteredData: data });
  }

  setLoading(loading) {
    this.setState({ loading });
  }

  setError(error) {
    this.setState({
      error,
      loading: false
    });
  }

  setDataSourceConnected(connected) {
    this.setState({ dataSourceConnected: connected });
  }

  // Getters
  getDisplayMode() {
    return this.state.displayMode;
  }

  getLevelMode() {
    return this.state.levelMode;
  }

  getActiveEmployee() {
    return this.state.activeEmployee;
  }

  getDateRange() {
    return this.state.dateRange;
  }

  getData() {
    return this.state.data;
  }

  getFilteredData() {
    return this.state.filteredData;
  }

  isLoading() {
    return this.state.loading;
  }

  getError() {
    return this.state.error;
  }

  getLastUpdated() {
    return this.state.lastUpdated;
  }

  isDataSourceConnected() {
    return this.state.dataSourceConnected;
  }

  /**
   * Reset all filters to their default state
   */
  resetAllFilters() {
    this.state = {
      ...this.state,
      activeEmployee: 'all',
      dateRange: { start: 'all', end: 'all' },
      searchQuery: '',
      taskCategory: 'all'
    };
    this.notifyListeners();
  }

  /**
   * Set search query
   * @param {string} query - Search query
   */
  setSearchQuery(query) {
    this.state.searchQuery = query;
    this.notifyListeners();
  }

  /**
   * Set task category filter
   * @param {string} category - Task category
   */
  setTaskCategory(category) {
    this.state.taskCategory = category;
    this.notifyListeners();
  }

  /**
   * Get current filter state
   * @returns {Object} Current filter state
   */
  getFilterState() {
    return {
      activeEmployee: this.state.activeEmployee,
      dateRange: this.state.dateRange,
      searchQuery: this.state.searchQuery,
      taskCategory: this.state.taskCategory
    };
  }
}

// Create and export a singleton instance
const dashboardState = new DashboardState();
export default dashboardState; 