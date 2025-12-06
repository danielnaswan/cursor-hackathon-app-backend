/**
 * Health Controller
 * @description Handles health tracking and money saved endpoints
 */

const healthService = require('../services/health.service');
const { logger } = require('../config/logger');

/**
 * @route   GET /api/health/dashboard
 * @desc    Get comprehensive health dashboard
 * @access  Private
 */
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dashboard = await healthService.getHealthDashboard(userId);

    res.status(200).json({
      success: true,
      dashboard
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/health/quit-date
 * @desc    Set quit date for health tracking
 * @access  Private
 */
const setQuitDate = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { quitDate } = req.body;

    const result = await healthService.setQuitDate(
      userId, 
      quitDate ? new Date(quitDate) : new Date()
    );

    res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/health/progress
 * @desc    Get health progress and milestones
 * @access  Private
 */
const getHealthProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const progress = await healthService.getHealthProgress(userId);

    res.status(200).json({
      success: true,
      progress
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/health/cost-settings
 * @desc    Set cost settings for money tracking
 * @access  Private
 */
const setCostSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { costPerPack, puffsPerPack } = req.body;

    const settings = await healthService.setCostSettings(
      userId,
      costPerPack,
      puffsPerPack
    );

    res.status(200).json({
      success: true,
      message: 'Cost settings updated',
      settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/health/money-saved
 * @desc    Get money saved calculation
 * @access  Private
 */
const getMoneySaved = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const moneySaved = await healthService.calculateMoneySaved(userId);

    res.status(200).json({
      success: true,
      moneySaved
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/health/milestones
 * @desc    Get all health milestones
 * @access  Public
 */
const getMilestones = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      milestones: healthService.HEALTH_MILESTONES
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  setQuitDate,
  getHealthProgress,
  setCostSettings,
  getMoneySaved,
  getMilestones
};

