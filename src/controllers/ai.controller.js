/**
 * AI Controller
 * @description Handles AI insights, coaching, and prediction endpoints
 */

const aiService = require('../services/ai.service');
const predictionService = require('../services/prediction.service');
const { logger } = require('../config/logger');

/**
 * @route   POST /api/ai/insights
 * @desc    Generate AI-powered insights for user
 * @access  Private
 */
const getInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { timeframe = '7d' } = req.body;

    const insights = await aiService.generateInsights(userId, timeframe);

    logger.info(`AI insights generated for user: ${userId}`);

    res.status(200).json({
      success: true,
      insights
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/ai/coaching
 * @desc    Get personalized AI coaching advice
 * @access  Private
 */
const getCoaching = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { goal, currentChallenge } = req.body;

    const coaching = await aiService.generateCoachingPlan(userId, goal, currentChallenge);

    logger.info(`AI coaching generated for user: ${userId}`);

    res.status(200).json({
      success: true,
      coaching
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/ai/predict-craving/:userId
 * @desc    Predict craving probability for user
 * @access  Private
 */
const predictCraving = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Verify authorization
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const prediction = await predictionService.predictCraving(userId);

    res.status(200).json({
      success: true,
      prediction
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInsights, getCoaching, predictCraving };

