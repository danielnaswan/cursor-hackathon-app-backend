/**
 * Intake Routes
 * @description Vape/Smoke intake logging endpoints
 */

const express = require('express');
const router = express.Router();
const { logIntake, getUserIntakes, deleteIntake } = require('../controllers/intake.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { intakeSchema } = require('../utils/validators');

// All routes require authentication
router.use(protect);

// POST /api/intake/log
router.post('/log', validate(intakeSchema), logIntake);

// GET /api/intake/user/:id
router.get('/user/:id', getUserIntakes);

// DELETE /api/intake/:logId
router.delete('/:logId', deleteIntake);

module.exports = router;

