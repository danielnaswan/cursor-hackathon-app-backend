/**
 * Achievement Model
 * @description MongoDB schema for user achievements and badges
 */

const mongoose = require('mongoose');

// Define all available achievements
const ACHIEVEMENTS = {
  // Streak achievements
  FIRST_DAY: {
    id: 'first_day',
    name: 'First Step',
    description: 'Complete your first day of tracking',
    icon: '🌟',
    xp: 50,
    category: 'streak'
  },
  WEEK_WARRIOR: {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day tracking streak',
    icon: '🔥',
    xp: 200,
    category: 'streak'
  },
  MONTH_MASTER: {
    id: 'month_master',
    name: 'Month Master',
    description: 'Maintain a 30-day tracking streak',
    icon: '👑',
    xp: 1000,
    category: 'streak'
  },
  
  // Reduction achievements
  FIRST_REDUCTION: {
    id: 'first_reduction',
    name: 'On The Way Down',
    description: 'Reduce daily intake by 10%',
    icon: '📉',
    xp: 100,
    category: 'reduction'
  },
  HALF_WAY: {
    id: 'half_way',
    name: 'Halfway There',
    description: 'Reduce daily intake by 50%',
    icon: '🎯',
    xp: 500,
    category: 'reduction'
  },
  SMOKE_FREE_DAY: {
    id: 'smoke_free_day',
    name: 'Clean Day',
    description: 'Complete a full day with zero intake',
    icon: '💚',
    xp: 300,
    category: 'reduction'
  },
  
  // Consistency achievements
  LOGGER_10: {
    id: 'logger_10',
    name: 'Dedicated Logger',
    description: 'Log 10 intake entries',
    icon: '📝',
    xp: 50,
    category: 'consistency'
  },
  LOGGER_50: {
    id: 'logger_50',
    name: 'Data Champion',
    description: 'Log 50 intake entries',
    icon: '📊',
    xp: 150,
    category: 'consistency'
  },
  LOGGER_100: {
    id: 'logger_100',
    name: 'Tracking Master',
    description: 'Log 100 intake entries',
    icon: '🏆',
    xp: 300,
    category: 'consistency'
  },
  
  // Wellness achievements
  INSIGHT_SEEKER: {
    id: 'insight_seeker',
    name: 'Insight Seeker',
    description: 'Request AI insights 5 times',
    icon: '🔮',
    xp: 75,
    category: 'wellness'
  },
  COACH_FOLLOWER: {
    id: 'coach_follower',
    name: 'Coach Follower',
    description: 'Get coaching advice 10 times',
    icon: '🧠',
    xp: 100,
    category: 'wellness'
  },
  MORNING_DELAY: {
    id: 'morning_delay',
    name: 'Morning Victory',
    description: 'Delay first intake past 10 AM for 3 days',
    icon: '🌅',
    xp: 150,
    category: 'wellness'
  },
  
  // Money achievements
  SAVER_10: {
    id: 'saver_10',
    name: 'Smart Saver',
    description: 'Save $10 by reducing',
    icon: '💵',
    xp: 100,
    category: 'money'
  },
  SAVER_50: {
    id: 'saver_50',
    name: 'Budget Boss',
    description: 'Save $50 by reducing',
    icon: '💰',
    xp: 250,
    category: 'money'
  },
  SAVER_100: {
    id: 'saver_100',
    name: 'Money Master',
    description: 'Save $100 by reducing',
    icon: '🤑',
    xp: 500,
    category: 'money'
  }
};

const userAchievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  achievementId: {
    type: String,
    required: true,
    enum: Object.keys(ACHIEVEMENTS).map(k => ACHIEVEMENTS[k].id)
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 100 // Percentage complete
  }
}, {
  timestamps: true
});

// Compound index for unique achievements per user
userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);

module.exports = { UserAchievement, ACHIEVEMENTS };
