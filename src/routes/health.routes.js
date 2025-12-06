/**
 * Health Routes
 * @description Health tracking and money saved endpoints
 */

const express = require('express');
const router = express.Router();
const {
  getDashboard,
  setQuitDate,
  getHealthProgress,
  setCostSettings,
  getMoneySaved,
  getMilestones
} = require('../controllers/health.controller');
const { protect } = require('../middleware/auth.middleware');

// Public route - get all milestones info
router.get('/milestones', getMilestones);

// Protected routes
router.use(protect);

// GET /api/health/dashboard - Get comprehensive health dashboard
router.get('/dashboard', getDashboard);

// POST /api/health/quit-date - Set quit date
router.post('/quit-date', setQuitDate);

// GET /api/health/progress - Get health progress
router.get('/progress', getHealthProgress);

// POST /api/health/cost-settings - Set cost per pack
router.post('/cost-settings', setCostSettings);

// GET /api/health/money-saved - Get money saved
router.get('/money-saved', getMoneySaved);

module.exports = router;

