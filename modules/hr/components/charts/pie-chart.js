/**
 * Pie Chart Component for HR Metrics Dashboard
 */

import { ChartRenderError } from '../../utils/errors.js';
import { getCategoryColor, getCategoryBorderColor, getTaskColor, getTaskBorderColor } from '../../utils/color-utils.js';
import dashboardState from '../../services/state-manager.js';

export class PieChart {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      height: 300,
      ...options
    };
    this.chart = null;
    this.setupContainer();
  }

  setupContainer() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new ChartRenderError(`Container not found: ${this.containerId}`);
    }

    // Create canvas if it doesn't exist
    if (!container.querySelector('canvas')) {
      const canvas = document.createElement('canvas');
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'Pie chart visualization');
      container.appendChild(canvas);
    }
  }

  /**
   * Render the pie chart
   * @param {Object} data - Chart data
   * @throws {ChartRenderError} If rendering fails
   */
  render(data) {
    try {
      const container = document.getElementById(this.containerId);
      const canvas = container.querySelector('canvas');
      const ctx = canvas.getContext('2d');

      // Destroy existing chart if it exists
      if (this.chart) {
        this.chart.destroy();
      }

      const displayMode = dashboardState.getDisplayMode();
      const levelMode = dashboardState.getLevelMode();

      // Prepare chart data
      const chartData = this.prepareChartData(data, displayMode, levelMode);

      // Create new chart
      this.chart = new Chart(ctx, {
        type: 'pie',
        data: chartData,
        options: this.getChartOptions(displayMode)
      });

      // Update accessibility
      this.updateAccessibility(chartData);
    } catch (error) {
      throw new ChartRenderError(
        `Failed to render pie chart: ${error.message}`,
        { containerId: this.containerId, error }
      );
    }
  }

  /**
   * Prepare chart data based on display mode and level mode
   * @private
   */
  prepareChartData(data, displayMode, levelMode) {
    const isCostMode = displayMode === 'cost';
    const isCategoryMode = levelMode === 'category';

    // Calculate total for percentages
    const total = data.reduce((sum, item) => 
      sum + (isCostMode ? item.cost : item.hours), 0);

    // Prepare labels and data
    const labels = data.map(item => {
      const value = isCostMode ? item.cost : item.hours;
      const percentage = ((value / total) * 100).toFixed(1);
      return `${item.name}: ${percentage}%`;
    });

    const values = data.map(item => 
      isCostMode ? item.cost : item.hours);

    // Get appropriate colors
    const backgroundColor = data.map(item => 
      isCategoryMode ? getCategoryColor(item.name) : getTaskColor(item.name));
    
    const borderColor = data.map(item => 
      isCategoryMode ? getCategoryBorderColor(item.name) : getTaskBorderColor(item.name));

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor,
        borderColor,
        borderWidth: 1
      }]
    };
  }

  /**
   * Get chart options based on display mode
   * @private
   */
  getChartOptions(displayMode) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 10 },
            boxWidth: 10
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw || 0;
              if (displayMode === 'cost') {
                return `${context.dataset.label || ''}: $${value.toFixed(2)}`;
              }
              return `${context.dataset.label || ''}: ${value.toFixed(1)} hours`;
            }
          }
        }
      }
    };
  }

  /**
   * Update accessibility attributes
   * @private
   */
  updateAccessibility(chartData) {
    const container = document.getElementById(this.containerId);
    const canvas = container.querySelector('canvas');
    
    // Create descriptive text for screen readers
    const description = chartData.labels.map((label, index) => {
      const value = chartData.datasets[0].data[index];
      return `${label}: ${value}`;
    }).join(', ');

    canvas.setAttribute('aria-label', description);
  }

  /**
   * Update the chart with new data
   * @param {Object} data - New chart data
   */
  update(data) {
    if (!this.chart) {
      this.render(data);
      return;
    }

    try {
      const displayMode = dashboardState.getDisplayMode();
      const levelMode = dashboardState.getLevelMode();
      const chartData = this.prepareChartData(data, displayMode, levelMode);

      this.chart.data = chartData;
      this.chart.options = this.getChartOptions(displayMode);
      this.chart.update('none'); // Use 'none' mode for better performance

      this.updateAccessibility(chartData);
    } catch (error) {
      throw new ChartRenderError(
        `Failed to update pie chart: ${error.message}`,
        { containerId: this.containerId, error }
      );
    }
  }

  /**
   * Clean up chart resources
   */
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
} 