/**
 * User Routes
 * @description User profile endpoints
 */

const express = require('express');
const router = express.Router();
const { getMe, updateProfile } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { updateProfileSchema } = require('../utils/validators');

// All routes require authentication
router.use(protect);

// GET /api/user/me
router.get('/me', getMe);

// PATCH /api/user/update
router.patch('/update', validate(updateProfileSchema), updateProfile);

module.exports = router;

