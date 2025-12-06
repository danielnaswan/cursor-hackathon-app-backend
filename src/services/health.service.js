/**
 * Health Service
 * @description Tracks health improvements and money saved
 */

const Streak = require('../models/streak.model');
const Intake = require('../models/intake.model');
const { logger } = require('../config/logger');
const dayjs = require('dayjs');

/**
 * Health milestones after quitting smoking/vaping
 * Based on medical research
 */
const HEALTH_MILESTONES = [
  {
    id: 'milestone_20min',
    time: 20, // minutes
    unit: 'minutes',
    title: 'Heart Rate Normalizes',
    description: 'Your heart rate and blood pressure begin to drop to normal levels.',
    icon: '❤️',
    category: 'cardiovascular'
  },
  {
    id: 'milestone_8hr',
    time: 8 * 60, // 8 hours in minutes
    unit: 'hours',
    title: 'Oxygen Levels Improve',
    description: 'Carbon monoxide levels in your blood drop, and oxygen levels increase.',
    icon: '🫁',
    category: 'respiratory'
  },
  {
    id: 'milestone_24hr',
    time: 24 * 60,
    unit: 'hours',
    title: 'Heart Attack Risk Decreases',
    description: 'Your risk of heart attack begins to decrease.',
    icon: '💪',
    category: 'cardiovascular'
  },
  {
    id: 'milestone_48hr',
    time: 48 * 60,
    unit: 'hours',
    title: 'Senses Improve',
    description: 'Nerve endings start to regrow. Taste and smell begin to improve.',
    icon: '👃',
    category: 'neurological'
  },
  {
    id: 'milestone_72hr',
    time: 72 * 60,
    unit: 'hours',
    title: 'Breathing Easier',
    description: 'Bronchial tubes relax, making breathing easier. Energy increases.',
    icon: '🌬️',
    category: 'respiratory'
  },
  {
    id: 'milestone_2wk',
    time: 14 * 24 * 60,
    unit: 'weeks',
    title: 'Circulation Improves',
    description: 'Circulation improves significantly. Walking becomes easier.',
    icon: '🚶',
    category: 'cardiovascular'
  },
  {
    id: 'milestone_1mo',
    time: 30 * 24 * 60,
    unit: 'month',
    title: 'Lung Function Increases',
    description: 'Lung function increases up to 30%. Coughing and shortness of breath decrease.',
    icon: '🏃',
    category: 'respiratory'
  },
  {
    id: 'milestone_3mo',
    time: 90 * 24 * 60,
    unit: 'months',
    title: 'Fertility Improves',
    description: 'Circulation continues to improve. Fertility chances increase.',
    icon: '🌱',
    category: 'reproductive'
  },
  {
    id: 'milestone_6mo',
    time: 180 * 24 * 60,
    unit: 'months',
    title: 'Stress Reduces',
    description: 'You handle stress better without nicotine. Airways are less inflamed.',
    icon: '🧘',
    category: 'mental'
  },
  {
    id: 'milestone_1yr',
    time: 365 * 24 * 60,
    unit: 'year',
    title: 'Heart Disease Risk Halved',
    description: 'Your risk of coronary heart disease is now half that of a smoker.',
    icon: '🏆',
    category: 'cardiovascular'
  }
];

/**
 * Get or create streak for health tracking
 */
const getOrCreateStreak = async (userId) => {
  let streak = await Streak.findOne({ userId });
  if (!streak) {
    streak = await Streak.create({ userId });
  }
  return streak;
};

/**
 * Set quit date for health tracking
 */
const setQuitDate = async (userId, quitDate = new Date()) => {
  const streak = await getOrCreateStreak(userId);
  streak.quitDate = quitDate;
  await streak.save();
  
  return {
    quitDate: streak.quitDate,
    message: 'Quit date set! Your health journey begins now.'
  };
};

/**
 * Get health progress since quit date
 */
const getHealthProgress = async (userId) => {
  const streak = await getOrCreateStreak(userId);
  
  if (!streak.quitDate) {
    return {
      hasQuitDate: false,
      message: 'Set your quit date to start tracking health improvements!',
      milestones: HEALTH_MILESTONES.map(m => ({ ...m, achieved: false, progress: 0 }))
    };
  }
  
  const minutesSinceQuit = dayjs().diff(dayjs(streak.quitDate), 'minute');
  const hoursSinceQuit = minutesSinceQuit / 60;
  const daysSinceQuit = hoursSinceQuit / 24;
  
  // Calculate milestone progress
  const milestones = HEALTH_MILESTONES.map(milestone => {
    const progress = Math.min(100, (minutesSinceQuit / milestone.time) * 100);
    return {
      ...milestone,
      achieved: minutesSinceQuit >= milestone.time,
      progress: Math.round(progress),
      timeRemaining: milestone.time - minutesSinceQuit > 0 
        ? formatTimeRemaining(milestone.time - minutesSinceQuit)
        : null
    };
  });
  
  const achievedCount = milestones.filter(m => m.achieved).length;
  const nextMilestone = milestones.find(m => !m.achieved);
  
  return {
    hasQuitDate: true,
    quitDate: streak.quitDate,
    timeSinceQuit: {
      minutes: Math.round(minutesSinceQuit),
      hours: Math.round(hoursSinceQuit * 10) / 10,
      days: Math.round(daysSinceQuit * 10) / 10
    },
    milestones,
    achievedCount,
    totalMilestones: HEALTH_MILESTONES.length,
    nextMilestone,
    encouragement: getEncouragement(daysSinceQuit, achievedCount)
  };
};

/**
 * Format time remaining in human readable format
 */
const formatTimeRemaining = (minutes) => {
  if (minutes < 60) {
    return `${Math.round(minutes)} minutes`;
  } else if (minutes < 24 * 60) {
    return `${Math.round(minutes / 60)} hours`;
  } else {
    return `${Math.round(minutes / (24 * 60))} days`;
  }
};

/**
 * Get encouragement message
 */
const getEncouragement = (days, achievedMilestones) => {
  if (days < 1) {
    return "Every minute counts! You're already making progress.";
  } else if (days < 3) {
    return "The first 72 hours are the hardest. You're doing amazing!";
  } else if (days < 7) {
    return "Almost a week! Your body is thanking you.";
  } else if (days < 30) {
    return "Keep going! Each day makes you stronger.";
  } else if (days < 90) {
    return "A month in! You're officially breaking the habit.";
  } else {
    return "You're a champion! Your health is transforming.";
  }
};

/**
 * Set cost settings for money tracking
 */
const setCostSettings = async (userId, costPerPack, puffsPerPack) => {
  const streak = await getOrCreateStreak(userId);
  streak.costPerPack = costPerPack || streak.costPerPack;
  streak.puffsPerPack = puffsPerPack || streak.puffsPerPack;
  await streak.save();
  
  return {
    costPerPack: streak.costPerPack,
    puffsPerPack: streak.puffsPerPack
  };
};

/**
 * Calculate money saved based on reduction
 */
const calculateMoneySaved = async (userId) => {
  const streak = await getOrCreateStreak(userId);
  
  if (!streak.baselineDailyAverage || !streak.baselineSetDate) {
    return {
      hasBaseline: false,
      message: 'Set a baseline to track money saved'
    };
  }
  
  // Get total puffs since baseline
  const intakes = await Intake.find({
    userId,
    loggedAt: { $gte: streak.baselineSetDate }
  });
  
  const daysSinceBaseline = dayjs().diff(dayjs(streak.baselineSetDate), 'day') || 1;
  const totalActualPuffs = intakes.reduce((sum, i) => sum + i.puffs, 0);
  const expectedPuffs = streak.baselineDailyAverage * daysSinceBaseline;
  const puffsSaved = Math.max(0, expectedPuffs - totalActualPuffs);
  
  const costPerPuff = streak.costPerPack / streak.puffsPerPack;
  const moneySaved = puffsSaved * costPerPuff;
  
  // Update streak
  streak.totalMoneySaved = moneySaved;
  await streak.save();
  
  return {
    hasBaseline: true,
    daysSinceBaseline,
    baselineDailyAverage: streak.baselineDailyAverage,
    currentDailyAverage: totalActualPuffs / daysSinceBaseline,
    expectedPuffs: Math.round(expectedPuffs),
    actualPuffs: totalActualPuffs,
    puffsSaved: Math.round(puffsSaved),
    costPerPack: streak.costPerPack,
    moneySaved: Math.round(moneySaved * 100) / 100,
    projectedMonthlySavings: Math.round((puffsSaved / daysSinceBaseline) * 30 * costPerPuff * 100) / 100,
    projectedYearlySavings: Math.round((puffsSaved / daysSinceBaseline) * 365 * costPerPuff * 100) / 100
  };
};

/**
 * Get comprehensive health dashboard
 */
const getHealthDashboard = async (userId) => {
  const [healthProgress, moneySaved, streak] = await Promise.all([
    getHealthProgress(userId),
    calculateMoneySaved(userId),
    getOrCreateStreak(userId)
  ]);
  
  return {
    health: healthProgress,
    money: moneySaved,
    summary: {
      daysTracking: streak.lastActiveDate 
        ? dayjs().diff(dayjs(streak.createdAt), 'day') 
        : 0,
      currentStreak: streak.currentStreak,
      level: streak.level,
      totalXP: streak.totalXP
    }
  };
};

module.exports = {
  setQuitDate,
  getHealthProgress,
  setCostSettings,
  calculateMoneySaved,
  getHealthDashboard,
  HEALTH_MILESTONES
};

