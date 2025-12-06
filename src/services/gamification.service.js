/**
 * Gamification Service
 * @description Handles streaks, achievements, XP, and badges
 */

const Streak = require('../models/streak.model');
const { UserAchievement, ACHIEVEMENTS } = require('../models/achievement.model');
const Intake = require('../models/intake.model');
const { logger } = require('../config/logger');
const dayjs = require('dayjs');

/**
 * Get or create streak record for user
 */
const getOrCreateStreak = async (userId) => {
  let streak = await Streak.findOne({ odId: odId });
  if (!streak) {
    streak = await Streak.create({ odId: odId });
  }
  return streak;
};

/**
 * Get or create streak record for user (fixed)
 */
const getOrCreateStreakFixed = async (userId) => {
  let streak = await Streak.findOne({ userId });
  if (!streak) {
    streak = await Streak.create({ userId });
  }
  return streak;
};

/**
 * Update user's streak after logging intake
 */
const updateStreakOnLog = async (userId) => {
  const streak = await getOrCreateStreakFixed(userId);
  
  // Update total logs count
  streak.totalLogsCount += 1;
  
  // Update streak
  const streakResult = await streak.updateStreak(true);
  
  // Add XP for logging
  await streak.addXP(10); // 10 XP per log
  
  // Check for achievements
  const newAchievements = await checkAchievements(userId, streak);
  
  return {
    streak: streakResult,
    totalXP: streak.totalXP,
    level: streak.level,
    newAchievements
  };
};

/**
 * Check and unlock achievements
 */
const checkAchievements = async (userId, streak) => {
  const newAchievements = [];
  
  // Check streak achievements
  if (streak.currentStreak >= 1) {
    const unlocked = await unlockAchievement(userId, 'first_day', streak);
    if (unlocked) newAchievements.push(ACHIEVEMENTS.FIRST_DAY);
  }
  if (streak.currentStreak >= 7) {
    const unlocked = await unlockAchievement(userId, 'week_warrior', streak);
    if (unlocked) newAchievements.push(ACHIEVEMENTS.WEEK_WARRIOR);
  }
  if (streak.currentStreak >= 30) {
    const unlocked = await unlockAchievement(userId, 'month_master', streak);
    if (unlocked) newAchievements.push(ACHIEVEMENTS.MONTH_MASTER);
  }
  
  // Check logging achievements
  if (streak.totalLogsCount >= 10) {
    const unlocked = await unlockAchievement(userId, 'logger_10', streak);
    if (unlocked) newAchievements.push(ACHIEVEMENTS.LOGGER_10);
  }
  if (streak.totalLogsCount >= 50) {
    const unlocked = await unlockAchievement(userId, 'logger_50', streak);
    if (unlocked) newAchievements.push(ACHIEVEMENTS.LOGGER_50);
  }
  if (streak.totalLogsCount >= 100) {
    const unlocked = await unlockAchievement(userId, 'logger_100', streak);
    if (unlocked) newAchievements.push(ACHIEVEMENTS.LOGGER_100);
  }
  
  // Check money achievements
  if (streak.totalMoneySaved >= 10) {
    const unlocked = await unlockAchievement(userId, 'saver_10', streak);
    if (unlocked) newAchievements.push(ACHIEVEMENTS.SAVER_10);
  }
  if (streak.totalMoneySaved >= 50) {
    const unlocked = await unlockAchievement(userId, 'saver_50', streak);
    if (unlocked) newAchievements.push(ACHIEVEMENTS.SAVER_50);
  }
  if (streak.totalMoneySaved >= 100) {
    const unlocked = await unlockAchievement(userId, 'saver_100', streak);
    if (unlocked) newAchievements.push(ACHIEVEMENTS.SAVER_100);
  }
  
  return newAchievements;
};

/**
 * Unlock an achievement for user
 */
const unlockAchievement = async (userId, achievementId, streak) => {
  try {
    // Check if already unlocked
    const existing = await UserAchievement.findOne({ userId, achievementId });
    if (existing) return false;
    
    // Create achievement
    await UserAchievement.create({ userId, achievementId });
    
    // Get achievement XP
    const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
    if (achievement && streak) {
      await streak.addXP(achievement.xp);
    }
    
    logger.info(`Achievement unlocked: ${achievementId} for user ${userId}`);
    return true;
  } catch (error) {
    if (error.code === 11000) return false; // Duplicate
    throw error;
  }
};

/**
 * Get user's gamification stats
 */
const getUserStats = async (userId) => {
  const streak = await getOrCreateStreakFixed(userId);
  const achievements = await UserAchievement.find({ userId });
  
  // Get all achievement details
  const unlockedAchievements = achievements.map(ua => {
    const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === ua.achievementId);
    return {
      ...achievement,
      unlockedAt: ua.unlockedAt
    };
  });
  
  // Get locked achievements
  const unlockedIds = achievements.map(a => a.achievementId);
  const lockedAchievements = Object.values(ACHIEVEMENTS).filter(
    a => !unlockedIds.includes(a.id)
  );
  
  return {
    streak: {
      current: streak.currentStreak,
      longest: streak.longestStreak,
      lastActive: streak.lastActiveDate
    },
    xp: {
      total: streak.totalXP,
      level: streak.level,
      nextLevelXP: streak.xpForNextLevel(),
      progress: Math.round((streak.totalXP / streak.xpForNextLevel()) * 100)
    },
    stats: {
      totalLogs: streak.totalLogsCount,
      smokeFreeDays: streak.smokeFreedays,
      moneySaved: streak.totalMoneySaved
    },
    achievements: {
      unlocked: unlockedAchievements,
      locked: lockedAchievements,
      total: Object.keys(ACHIEVEMENTS).length,
      completed: unlockedAchievements.length
    }
  };
};

/**
 * Get leaderboard
 */
const getLeaderboard = async (limit = 10) => {
  const leaders = await Streak.find()
    .sort({ totalXP: -1 })
    .limit(limit)
    .populate('userId', 'name');
  
  return leaders.map((s, index) => ({
    rank: index + 1,
    name: s.userId?.name || 'Anonymous',
    level: s.level,
    xp: s.totalXP,
    streak: s.currentStreak
  }));
};

/**
 * Set baseline for reduction tracking
 */
const setBaseline = async (userId) => {
  const streak = await getOrCreateStreakFixed(userId);
  
  // Calculate average from last 7 days
  const weekAgo = dayjs().subtract(7, 'day').toDate();
  const intakes = await Intake.find({
    userId,
    loggedAt: { $gte: weekAgo }
  });
  
  const totalPuffs = intakes.reduce((sum, i) => sum + i.puffs, 0);
  const dailyAvg = intakes.length > 0 ? totalPuffs / 7 : 0;
  
  streak.baselineDailyAverage = dailyAvg;
  streak.baselineSetDate = new Date();
  await streak.save();
  
  return {
    baseline: dailyAvg,
    setDate: streak.baselineSetDate
  };
};

/**
 * Calculate reduction percentage
 */
const getReductionProgress = async (userId) => {
  const streak = await getOrCreateStreakFixed(userId);
  
  if (!streak.baselineDailyAverage) {
    return { hasBaseline: false, message: 'No baseline set. Log for a week to set baseline.' };
  }
  
  // Get current average
  const weekAgo = dayjs().subtract(7, 'day').toDate();
  const intakes = await Intake.find({
    userId,
    loggedAt: { $gte: weekAgo }
  });
  
  const totalPuffs = intakes.reduce((sum, i) => sum + i.puffs, 0);
  const currentAvg = intakes.length > 0 ? totalPuffs / 7 : 0;
  
  const reduction = streak.baselineDailyAverage > 0 
    ? ((streak.baselineDailyAverage - currentAvg) / streak.baselineDailyAverage) * 100
    : 0;
  
  return {
    hasBaseline: true,
    baseline: streak.baselineDailyAverage,
    currentAverage: currentAvg,
    reductionPercent: Math.round(reduction * 10) / 10,
    direction: reduction > 0 ? 'down' : reduction < 0 ? 'up' : 'stable'
  };
};

module.exports = {
  updateStreakOnLog,
  getUserStats,
  getLeaderboard,
  setBaseline,
  getReductionProgress,
  checkAchievements,
  unlockAchievement,
  ACHIEVEMENTS
};

