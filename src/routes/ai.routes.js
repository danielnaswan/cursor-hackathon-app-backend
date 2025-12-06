/**
 * AI Routes
 * @description AI insights, coaching, and prediction endpoints
 */

const express = require('express');
const router = express.Router();
const { getInsights, getCoaching, predictCraving } = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// POST /api/ai/insights
router.post('/insights', getInsights);

// POST /api/ai/coaching
router.post('/coaching', getCoaching);

// GET /api/ai/predict-craving/:userId
router.get('/predict-craving/:userId', predictCraving);

module.exports = router;

