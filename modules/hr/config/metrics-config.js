/**
 * Configuration for HR Metrics Dashboard
 */

// Spreadsheet Configuration
export const SPREADSHEET_CONFIG = {
  spreadsheetId: '1Y-koc05vPSjUJqZlo9N759GO69f2UucugFEbnuBJ4BM',
  refreshInterval: 5 * 60 * 1000, // 5 minutes in milliseconds
  exportFormat: 'csv'
};

// Google Sheets URL for data
export const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_CONFIG.spreadsheetId}/export?format=${SPREADSHEET_CONFIG.exportFormat}`;

// Employee hourly rates
export const EMPLOYEE_RATES = {
  victoria: 16.50,
  kyle: 20.00,
  brooke: 25.00,
  melanie: 25.00,
  austin: 35.00,
  default: 25.00  // Set default to median rate
};

// Task categories and their associated tasks
export const TASK_CATEGORIES = {
  'Business Development': [
    'BD - Research',
    'BD - Emailing',
    'BD - Calls',
    'BD - Internal Call'
  ],
  'Congress': [
    'Congress - Research',
    'Congress - Emailing',
    'Congress - Calls',
    'Congress - Internal Call'
  ],
  'Social Media': [
    'Social Management',
    'Social Content - Research',
    'Social Content - Scripting',
    'Social Content - Recording',
    'Social Content - Video Editing',
    'Social Content - Graphic Design',
    'Social - Internal Call'
  ],
  'Influencer': [
    'Influencer Outreach',
    'Influencer - Internal Call'
  ],
  'Newsletter': [
    'Newsletter - Writing/Editing',
    'Newsletter - Operations',
    'Newsletter - Internal Call'
  ],
  'Miscellaneous': [
    'Misc. Content',
    'Misc. Research'
  ],
  'Internal Operations': [
    'Internal Meetings',
    'Admin',
    'Operations',
    'Customer Support'
  ],
  'Advertising': [
    'Ads'
  ]
};

// Order of tasks in charts and displays
export const TASK_ORDER = [
  // Business Development
  'BD - Research',
  'BD - Emailing',
  'BD - Calls',
  'BD - Internal Call',
  // Congress
  'Congress - Research',
  'Congress - Emailing',
  'Congress - Calls',
  'Congress - Internal Call',
  // Social Media
  'Social Management',
  'Social Content - Research',
  'Social Content - Scripting',
  'Social Content - Recording',
  'Social Content - Video Editing',
  'Social Content - Graphic Design',
  'Social - Internal Call',
  // Influencer
  'Influencer Outreach',
  'Influencer - Internal Call',
  // Newsletter
  'Newsletter - Writing/Editing',
  'Newsletter - Operations',
  'Newsletter - Internal Call',
  // Miscellaneous
  'Misc. Content',
  'Misc. Research',
  // Internal Operations
  'Internal Meetings',
  'Admin',
  'Operations',
  'Customer Support',
  // Advertising
  'Ads'
];

// Colors for categories
export const CATEGORY_COLORS = {
  'Business Development': '#4CAF50',      // Green
  'Congress': '#2196F3',                  // Blue
  'Social Media': '#FFC107',              // Amber
  'Influencer': '#9C27B0',                // Purple
  'Newsletter': '#FF5722',                // Deep Orange
  'Miscellaneous': '#607D8B',             // Blue Grey
  'Internal Operations': '#795548',       // Brown
  'Advertising': '#E91E63'                // Pink
};

// Colors for employees
export const EMPLOYEE_COLORS = {
  victoria: '#4CAF50',  // Green
  kyle: '#2196F3',      // Blue
  brooke: '#FFC107',    // Amber
  melanie: '#9C27B0',   // Purple
  austin: '#F44336'     // Red
};
