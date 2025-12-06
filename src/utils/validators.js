/**
 * Zod Validation Schemas
 * @description Request payload validation schemas
 */

const { z } = require('zod');

// Auth schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(50, 'Name too long')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// User schemas
const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  profile: z.object({
    smokingStartDate: z.string().datetime().optional(),
    dailyTarget: z.number().min(0).optional(),
    motivations: z.array(z.string()).optional(),
    timezone: z.string().optional()
  }).optional()
});

// Intake schemas
const intakeSchema = z.object({
  puffs: z.number().min(1, 'At least 1 puff required').max(100, 'Maximum 100 puffs'),
  intensity: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Intensity must be low, medium, or high' })
  }),
  context: z.enum(['stress', 'bored', 'habit', 'social', 'other'], {
    errorMap: () => ({ message: 'Invalid context value' })
  }),
  notes: z.string().max(500, 'Notes too long').optional(),
  location: z.string().optional(),
  mood: z.number().min(1).max(5).optional()
});

// AI schemas
const insightsSchema = z.object({
  timeframe: z.string().optional()
});

const coachingSchema = z.object({
  goal: z.string().optional(),
  currentChallenge: z.string().optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  intakeSchema,
  insightsSchema,
  coachingSchema
};

