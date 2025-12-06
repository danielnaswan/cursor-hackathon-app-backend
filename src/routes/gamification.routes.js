/**
 * Gamification Routes
 * @description Streaks, achievements, XP, and leaderboard endpoints
 */

const express = require('express');
const router = express.Router();
const {
  getStats,
  getAchievements,
  getLeaderboard,
  setBaseline,
  getReductionProgress
} = require('../controllers/gamification.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// GET /api/gamification/stats - Get user's complete gamification stats
router.get('/stats', getStats);

// GET /api/gamification/achievements - Get all achievements
router.get('/achievements', getAchievements);

// GET /api/gamification/leaderboard - Get XP leaderboard
router.get('/leaderboard', getLeaderboard);

// POST /api/gamification/set-baseline - Set baseline for reduction tracking
router.post('/set-baseline', setBaseline);

// GET /api/gamification/reduction - Get reduction progress
router.get('/reduction', getReductionProgress);

module.exports = router;

