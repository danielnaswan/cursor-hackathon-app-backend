/**
 * Analytics Routes
 * @description Usage analytics endpoints
 */

const express = require('express');
const router = express.Router();
const { 
  getDailyAnalytics, 
  getWeeklyAnalytics, 
  getMonthlyAnalytics 
} = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// GET /api/analytics/daily/:userId
router.get('/daily/:userId', getDailyAnalytics);

// GET /api/analytics/weekly/:userId
router.get('/weekly/:userId', getWeeklyAnalytics);

// GET /api/analytics/monthly/:userId
router.get('/monthly/:userId', getMonthlyAnalytics);

module.exports = router;

