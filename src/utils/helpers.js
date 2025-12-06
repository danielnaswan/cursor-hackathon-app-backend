/**
 * Helper Utilities
 * @description Common utility functions
 */

const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique request ID
 */
const generateRequestId = () => uuidv4();

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {string} format - DayJS format string
 */
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return dayjs(date).format(format);
};

/**
 * Get start and end of day
 * @param {Date|string} date - Target date
 */
const getDayRange = (date) => {
  const target = dayjs(date);
  return {
    start: target.startOf('day').toDate(),
    end: target.endOf('day').toDate()
  };
};

/**
 * Get start and end of week
 * @param {Date|string} date - Target date
 */
const getWeekRange = (date) => {
  const target = dayjs(date);
  return {
    start: target.startOf('week').toDate(),
    end: target.endOf('week').toDate()
  };
};

/**
 * Get start and end of month
 * @param {Date|string} date - Target date
 */
const getMonthRange = (date) => {
  const target = dayjs(date);
  return {
    start: target.startOf('month').toDate(),
    end: target.endOf('month').toDate()
  };
};

/**
 * Calculate percentage change
 * @param {number} oldValue - Previous value
 * @param {number} newValue - Current value
 */
const percentChange = (oldValue, newValue) => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

/**
 * Paginate array results
 * @param {Array} array - Array to paginate
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 */
const paginate = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  return {
    data: array.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: array.length,
      pages: Math.ceil(array.length / limit),
      hasNext: endIndex < array.length,
      hasPrev: page > 1
    }
  };
};

/**
 * Sleep utility for async operations
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sanitize user input (basic)
 * @param {string} input - Input string
 */
const sanitize = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

module.exports = {
  generateRequestId,
  formatDate,
  getDayRange,
  getWeekRange,
  getMonthRange,
  percentChange,
  paginate,
  sleep,
  sanitize
};

