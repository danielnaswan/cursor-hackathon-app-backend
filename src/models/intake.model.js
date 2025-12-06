/**
 * Intake Model
 * @description MongoDB schema for vape/smoke intake logging
 */

const mongoose = require('mongoose');

const intakeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  puffs: {
    type: Number,
    required: [true, 'Puff count is required'],
    min: [1, 'Puffs must be at least 1'],
    max: [100, 'Puffs cannot exceed 100']
  },
  intensity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: [true, 'Intensity is required']
  },
  context: {
    type: String,
    enum: ['stress', 'bored', 'habit', 'social', 'other'],
    required: [true, 'Context is required']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  },
  loggedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  location: {
    type: String,
    trim: true
  },
  mood: {
    type: Number,
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

// Compound index for efficient user + date queries
intakeSchema.index({ userId: 1, loggedAt: -1 });
intakeSchema.index({ userId: 1, createdAt: -1 });

// Virtual for intensity score
intakeSchema.virtual('intensityScore').get(function() {
  const scores = { low: 1, medium: 2, high: 3 };
  return scores[this.intensity] || 0;
});

// Ensure virtuals are included in JSON
intakeSchema.set('toJSON', { virtuals: true });
intakeSchema.set('toObject', { virtuals: true });

const Intake = mongoose.model('Intake', intakeSchema);

module.exports = Intake;

