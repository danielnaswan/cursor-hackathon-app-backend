/**
 * Streak Model
 * @description MongoDB schema for tracking user streaks and gamification stats
 */

const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Current streak
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date,
    default: null
  },
  
  // XP and Level system
  totalXP: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  
  // Stats for achievements
  totalLogsCount: {
    type: Number,
    default: 0
  },
  smokeFreedays: {
    type: Number,
    default: 0
  },
  insightsRequested: {
    type: Number,
    default: 0
  },
  coachingRequested: {
    type: Number,
    default: 0
  },
  
  // Baseline for reduction tracking
  baselineDailyAverage: {
    type: Number,
    default: null
  },
  baselineSetDate: {
    type: Date,
    default: null
  },
  
  // Money tracking
  costPerPack: {
    type: Number,
    default: 10 // Default $10 per pack
  },
  puffsPerPack: {
    type: Number,
    default: 200 // Default puffs per pack/pod
  },
  totalMoneySaved: {
    type: Number,
    default: 0
  },
  
  // Health tracking
  quitDate: {
    type: Date,
    default: null
  },
  
  // Daily tracking
  dailyLog: [{
    date: { type: Date, required: true },
    totalPuffs: { type: Number, default: 0 },
    logged: { type: Boolean, default: false }
  }]
}, {
  timestamps: true
});

// Calculate level from XP
streakSchema.methods.calculateLevel = function() {
  // Level formula: level = floor(sqrt(xp / 100)) + 1
  // Level 1: 0 XP, Level 2: 100 XP, Level 3: 400 XP, Level 4: 900 XP, etc.
  this.level = Math.floor(Math.sqrt(this.totalXP / 100)) + 1;
  return this.level;
};

// Get XP needed for next level
streakSchema.methods.xpForNextLevel = function() {
  const nextLevel = this.level + 1;
  return Math.pow(nextLevel - 1, 2) * 100;
};

// Add XP and recalculate level
streakSchema.methods.addXP = async function(amount) {
  this.totalXP += amount;
  this.calculateLevel();
  await this.save();
  return { totalXP: this.totalXP, level: this.level, added: amount };
};

// Update streak
streakSchema.methods.updateStreak = async function(didLog = true) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = this.lastActiveDate ? new Date(this.lastActiveDate) : null;
  if (lastActive) lastActive.setHours(0, 0, 0, 0);
  
  if (!lastActive) {
    // First time logging
    this.currentStreak = didLog ? 1 : 0;
  } else {
    const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Same day, no change
    } else if (diffDays === 1 && didLog) {
      // Consecutive day
      this.currentStreak += 1;
    } else {
      // Streak broken
      this.currentStreak = didLog ? 1 : 0;
    }
  }
  
  // Update longest streak
  if (this.currentStreak > this.longestStreak) {
    this.longestStreak = this.currentStreak;
  }
  
  this.lastActiveDate = today;
  await this.save();
  
  return {
    currentStreak: this.currentStreak,
    longestStreak: this.longestStreak
  };
};

const Streak = mongoose.model('Streak', streakSchema);

module.exports = Streak;

