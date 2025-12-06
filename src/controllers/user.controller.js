/**
 * User Controller
 * @description Handles user profile operations
 */

const User = require('../models/user.model');
const { logger } = require('../config/logger');

/**
 * @route   GET /api/user/me
 * @desc    Get current user profile
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/user/update
 * @desc    Update user profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = ['name', 'profile'];
    const updates = {};

    // Filter only allowed fields
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Handle nested profile updates
    if (req.body.profile) {
      const user = await User.findById(req.user.id);
      updates.profile = { ...user.profile, ...req.body.profile };
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User profile updated: ${user.email}`);

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMe, updateProfile };

