/**
 * Auth Routes
 * @description Authentication endpoints
 */

const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { registerSchema, loginSchema } = require('../utils/validators');

// POST /api/auth/register
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

// POST /api/auth/logout
router.post('/logout', protect, logout);

module.exports = router;

