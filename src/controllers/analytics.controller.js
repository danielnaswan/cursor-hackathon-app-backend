/**
 * Analytics Controller
 * @description Handles analytics data aggregation endpoints
 */

const analyticsService = require('../services/analytics.service');
const { logger } = require('../config/logger');

/**
 * @route   GET /api/analytics/daily/:userId
 * @desc    Get daily analytics for a user
 * @access  Private
 */
const getDailyAnalytics = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { date } = req.query;

    // Verify authorization
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const analytics = await analyticsService.getDailyStats(userId, date);

    res.status(200).json({
      success: true,
      analytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/weekly/:userId
 * @desc    Get weekly analytics for a user
 * @access  Private
 */
const getWeeklyAnalytics = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { startDate } = req.query;

    // Verify authorization
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const analytics = await analyticsService.getWeeklyStats(userId, startDate);

    res.status(200).json({
      success: true,
      analytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/monthly/:userId
 * @desc    Get monthly analytics for a user
 * @access  Private
 */
const getMonthlyAnalytics = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    // Verify authorization
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const analytics = await analyticsService.getMonthlyStats(userId, month, year);

    res.status(200).json({
      success: true,
      analytics
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDailyAnalytics, getWeeklyAnalytics, getMonthlyAnalytics };

