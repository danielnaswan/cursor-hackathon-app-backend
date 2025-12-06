/**
 * Intake Controller
 * @description Handles vape/smoke intake logging operations
 */

const Intake = require('../models/intake.model');
const { logger } = require('../config/logger');
const dayjs = require('dayjs');
const gamificationService = require('../services/gamification.service');

/**
 * @route   POST /api/intake/log
 * @desc    Log a new intake event
 * @access  Private
 */
const logIntake = async (req, res, next) => {
  try {
    const { puffs, intensity, context, notes, location, mood } = req.body;

    const intake = await Intake.create({
      userId: req.user.id,
      puffs,
      intensity,
      context,
      notes,
      location,
      mood,
      loggedAt: new Date()
    });

    // Update gamification (streaks, XP, achievements)
    const gamification = await gamificationService.updateStreakOnLog(req.user.id);

    logger.info(`Intake logged for user: ${req.user.id}`);

    res.status(201).json({
      success: true,
      intake,
      gamification: {
        streak: gamification.streak,
        xp: gamification.totalXP,
        level: gamification.level,
        newAchievements: gamification.newAchievements
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/intake/user/:id
 * @desc    Get all intake logs for a user
 * @access  Private
 */
const getUserIntakes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, limit = 50, page = 1 } = req.query;

    // Verify user can only access their own data (unless admin)
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to access this data' });
    }

    // Build query
    const query = { userId: id };
    
    if (startDate || endDate) {
      query.loggedAt = {};
      if (startDate) query.loggedAt.$gte = dayjs(startDate).toDate();
      if (endDate) query.loggedAt.$lte = dayjs(endDate).toDate();
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [intakes, total] = await Promise.all([
      Intake.find(query)
        .sort({ loggedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Intake.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: intakes.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      intakes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/intake/:logId
 * @desc    Delete an intake log
 * @access  Private
 */
const deleteIntake = async (req, res, next) => {
  try {
    const { logId } = req.params;

    const intake = await Intake.findById(logId);

    if (!intake) {
      return res.status(404).json({ error: 'Intake log not found' });
    }

    // Verify ownership
    if (intake.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this log' });
    }

    await intake.deleteOne();

    logger.info(`Intake deleted: ${logId} by user: ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Intake log deleted'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { logIntake, getUserIntakes, deleteIntake };

