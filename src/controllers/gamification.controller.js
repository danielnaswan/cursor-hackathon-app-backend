/**
 * Gamification Controller
 * @description Handles streaks, achievements, XP, and leaderboard endpoints
 */

const gamificationService = require('../services/gamification.service');
const { logger } = require('../config/logger');

/**
 * @route   GET /api/gamification/stats
 * @desc    Get user's gamification stats (streaks, XP, achievements)
 * @access  Private
 */
const getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stats = await gamificationService.getUserStats(userId);

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/gamification/achievements
 * @desc    Get all achievements (unlocked and locked)
 * @access  Private
 */
const getAchievements = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stats = await gamificationService.getUserStats(userId);

    res.status(200).json({
      success: true,
      achievements: stats.achievements
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/gamification/leaderboard
 * @desc    Get XP leaderboard
 * @access  Private
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const leaderboard = await gamificationService.getLeaderboard(parseInt(limit));

    res.status(200).json({
      success: true,
      leaderboard
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/gamification/set-baseline
 * @desc    Set baseline for reduction tracking
 * @access  Private
 */
const setBaseline = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const baseline = await gamificationService.setBaseline(userId);

    res.status(200).json({
      success: true,
      message: 'Baseline set successfully',
      baseline
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/gamification/reduction
 * @desc    Get reduction progress compared to baseline
 * @access  Private
 */
const getReductionProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const progress = await gamificationService.getReductionProgress(userId);

    res.status(200).json({
      success: true,
      progress
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getAchievements,
  getLeaderboard,
  setBaseline,
  getReductionProgress
};

