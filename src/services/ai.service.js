/**
 * AI Service
 * @description AI-powered insights and coaching generation with real AI integration
 */

const Intake = require('../models/intake.model');
const Streak = require('../models/streak.model');
const { getAICoaching, getAIInsights } = require('./openai.service');
const { logger } = require('../config/logger');
const dayjs = require('dayjs');

/**
 * Generate AI-powered insights based on user's intake data
 * @param {string} userId - User ID
 * @param {string} timeframe - Time period for analysis (7d, 30d, etc.)
 */
const generateInsights = async (userId, timeframe = '7d') => {
  try {
    // Get user's intake data
    const days = parseInt(timeframe) || 7;
    const startDate = dayjs().subtract(days, 'day').toDate();
    
    const intakes = await Intake.find({
      userId,
      loggedAt: { $gte: startDate }
    }).sort({ loggedAt: -1 });

    if (intakes.length === 0) {
      return {
        message: 'Not enough data for insights. Start logging your intake!',
        insights: [],
        aiPowered: false
      };
    }

    // Analyze patterns
    const analyticsData = analyzePatterns(intakes, days);
    
    // Try to get AI-powered insights
    const aiResponse = await getAIInsights(analyticsData);
    
    // Combine rule-based insights with AI insights
    const ruleBasedInsights = generateRuleBasedInsights(intakes, analyticsData, days);

    return {
      generated: new Date().toISOString(),
      timeframe,
      totalLogs: intakes.length,
      insights: ruleBasedInsights,
      aiInsights: aiResponse.success ? aiResponse.content : null,
      aiPowered: aiResponse.success,
      source: aiResponse.source || 'rule-based'
    };
  } catch (error) {
    logger.error('Error generating insights:', error);
    throw error;
  }
};

/**
 * Analyze intake patterns
 */
const analyzePatterns = (intakes, days) => {
  // Hour analysis
  const hourCounts = {};
  intakes.forEach((intake) => {
    const hour = dayjs(intake.loggedAt).hour();
    hourCounts[hour] = (hourCounts[hour] || 0) + intake.puffs;
  });
  const peakHourEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  
  // Context analysis
  const contextCounts = {};
  intakes.forEach((intake) => {
    contextCounts[intake.context] = (contextCounts[intake.context] || 0) + 1;
  });
  const topContextEntry = Object.entries(contextCounts).sort((a, b) => b[1] - a[1])[0];
  
  // Intensity analysis
  const intensityBreakdown = { low: 0, medium: 0, high: 0 };
  intakes.forEach((intake) => {
    intensityBreakdown[intake.intensity] += intake.puffs;
  });
  
  // Totals
  const totalPuffs = intakes.reduce((sum, i) => sum + i.puffs, 0);
  const dailyAverage = totalPuffs / days;
  
  // Trend calculation
  const midpoint = Math.floor(intakes.length / 2);
  const firstHalf = intakes.slice(midpoint);
  const secondHalf = intakes.slice(0, midpoint);
  const firstHalfAvg = firstHalf.reduce((s, i) => s + i.puffs, 0) / (firstHalf.length || 1);
  const secondHalfAvg = secondHalf.reduce((s, i) => s + i.puffs, 0) / (secondHalf.length || 1);
  const trend = secondHalfAvg < firstHalfAvg ? 'decreasing' : secondHalfAvg > firstHalfAvg ? 'increasing' : 'stable';

  return {
    totalPuffs,
    totalSessions: intakes.length,
    dailyAverage: Math.round(dailyAverage * 10) / 10,
    peakHour: peakHourEntry ? parseInt(peakHourEntry[0]) : null,
    topContext: topContextEntry ? topContextEntry[0] : null,
    contextBreakdown: contextCounts,
    intensityBreakdown,
    trend
  };
};

/**
 * Generate rule-based insights
 */
const generateRuleBasedInsights = (intakes, analytics, days) => {
  const insights = [];

  // Peak hour insight
  if (analytics.peakHour !== null) {
    insights.push({
      type: 'peak_hour',
      icon: '⏰',
      title: 'Peak Usage Time',
      message: `Your highest usage is around ${analytics.peakHour}:00. Consider preparing alternatives for this time.`,
      data: { hour: analytics.peakHour }
    });
  }

  // Trigger insight
  if (analytics.topContext) {
    const triggerAdvice = {
      stress: 'Try deep breathing or a quick walk when stressed.',
      bored: 'Keep your hands busy with a stress ball or fidget toy.',
      habit: 'Break the routine by changing your environment.',
      social: 'Let friends know you\'re cutting back for support.',
      other: 'Identify what specifically triggers this and plan ahead.'
    };
    
    insights.push({
      type: 'trigger_context',
      icon: '🎯',
      title: 'Main Trigger',
      message: `"${analytics.topContext}" is your most common trigger. ${triggerAdvice[analytics.topContext] || ''}`,
      data: { context: analytics.topContext, count: analytics.contextBreakdown[analytics.topContext] }
    });
  }

  // Daily average insight
  insights.push({
    type: 'daily_average',
    icon: '📊',
    title: 'Daily Average',
    message: `You average ${analytics.dailyAverage} puffs per day over the last ${days} days.`,
    data: { average: analytics.dailyAverage, total: analytics.totalPuffs, days }
  });

  // Trend insight
  const trendMessages = {
    decreasing: '📉 Great progress! Your usage is trending down.',
    increasing: '📈 Your usage is increasing. Stay mindful of triggers.',
    stable: '➡️ Your usage is stable. Ready to start reducing?'
  };
  insights.push({
    type: 'trend',
    icon: analytics.trend === 'decreasing' ? '📉' : analytics.trend === 'increasing' ? '📈' : '➡️',
    title: 'Weekly Trend',
    message: trendMessages[analytics.trend],
    data: { trend: analytics.trend }
  });

  // High intensity warning
  const highIntensityCount = intakes.filter(i => i.intensity === 'high').length;
  if (highIntensityCount > intakes.length * 0.3) {
    insights.push({
      type: 'reduction_opportunity',
      icon: '💡',
      title: 'Reduction Opportunity',
      message: `${Math.round(highIntensityCount / intakes.length * 100)}% of your sessions are high intensity. Try reducing intensity first.`,
      data: { highIntensityPercent: Math.round(highIntensityCount / intakes.length * 100) }
    });
  }

  return insights;
};

/**
 * Generate personalized coaching plan with AI
 * @param {string} userId - User ID
 * @param {string} goal - User's goal
 * @param {string} currentChallenge - Current challenge faced
 */
const generateCoachingPlan = async (userId, goal, currentChallenge) => {
  try {
    // Get recent patterns
    const recentIntakes = await Intake.find({
      userId,
      loggedAt: { $gte: dayjs().subtract(7, 'day').toDate() }
    });

    // Get streak info
    let streak = await Streak.findOne({ userId });
    
    const totalPuffs = recentIntakes.reduce((sum, i) => sum + i.puffs, 0);
    const avgDaily = totalPuffs / 7;
    
    // Get top trigger
    const contextCounts = {};
    recentIntakes.forEach((intake) => {
      contextCounts[intake.context] = (contextCounts[intake.context] || 0) + 1;
    });
    const topTrigger = Object.entries(contextCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    // Prepare data for AI
    const userData = {
      dailyAverage: Math.round(avgDaily),
      topTrigger,
      streakDays: streak?.currentStreak || 0,
      trend: avgDaily > 10 ? 'high' : avgDaily > 5 ? 'moderate' : 'low',
      goal: goal || 'Reduce and quit',
      challenge: currentChallenge
    };

    // Try AI coaching
    const aiResponse = await getAICoaching(userData);

    // Generate base plan
    const plan = {
      generated: new Date().toISOString(),
      currentStats: {
        weeklyPuffs: totalPuffs,
        dailyAverage: Math.round(avgDaily),
        currentStreak: streak?.currentStreak || 0,
        topTrigger
      },
      dailyTarget: Math.max(1, Math.floor(avgDaily * 0.9)), // 10% reduction
      weeklyGoal: `Reduce daily average from ${Math.round(avgDaily)} to ${Math.max(1, Math.floor(avgDaily * 0.9))} puffs`,
      
      // AI-generated advice if available
      aiCoaching: aiResponse.success ? aiResponse.content : null,
      aiPowered: aiResponse.success,
      
      // Rule-based action steps (fallback/supplement)
      actionSteps: [
        {
          step: 1,
          action: 'Delay your first intake by 30 minutes each day',
          reason: 'Building delay tolerance reduces overall consumption',
          icon: '⏰'
        },
        {
          step: 2,
          action: 'Replace one high-intensity session with a low-intensity one',
          reason: 'Gradual intensity reduction is more sustainable',
          icon: '📉'
        },
        {
          step: 3,
          action: 'Log your mood before each intake',
          reason: 'Awareness of emotional triggers helps identify patterns',
          icon: '📝'
        },
        {
          step: 4,
          action: 'Set a "no vape zone" in one area of your home',
          reason: 'Environmental cues can reduce habitual use',
          icon: '🏠'
        }
      ],
      
      cravingTechniques: [
        { technique: '4-7-8 Breathing', description: 'Inhale 4 sec, hold 7 sec, exhale 8 sec', icon: '🌬️' },
        { technique: 'Drink Water', description: 'Hydration reduces craving intensity', icon: '💧' },
        { technique: '5-Minute Rule', description: 'Wait 5 minutes before giving in', icon: '⏱️' },
        { technique: 'Change Location', description: 'Move to a different room or go outside', icon: '🚶' },
        { technique: 'Text a Friend', description: 'Social support helps resist urges', icon: '📱' }
      ],
      
      motivationalMessage: getMotivationalMessage(streak?.currentStreak || 0, avgDaily)
    };

    // Add challenge-specific response
    if (currentChallenge) {
      plan.challengeResponse = getChallengeResponse(currentChallenge);
    }

    return plan;
  } catch (error) {
    logger.error('Error generating coaching plan:', error);
    throw error;
  }
};

/**
 * Get motivational message based on progress
 */
const getMotivationalMessage = (streakDays, avgDaily) => {
  const messages = [
    "Every puff you skip is a victory. You're stronger than you think! 💪",
    "Small steps lead to big changes. Keep going! 🚀",
    "Your future self will thank you for the effort you're making today. 🌟",
    "Progress, not perfection. You're doing amazing! ✨",
    "Each day is a new opportunity to be healthier. Seize it! 🌅"
  ];
  
  if (streakDays >= 7) {
    return `🔥 ${streakDays}-day streak! You're on fire! Keep this momentum going!`;
  } else if (streakDays >= 3) {
    return `⭐ ${streakDays} days strong! You're building a great habit of awareness.`;
  }
  
  return messages[Math.floor(Math.random() * messages.length)];
};

/**
 * Get challenge-specific response
 */
const getChallengeResponse = (challenge) => {
  const responses = {
    stress: {
      challenge: 'Stress',
      advice: 'Stress is a common trigger. Try the 4-7-8 breathing technique or a quick 5-minute walk.',
      alternatives: ['Deep breathing', 'Progressive muscle relaxation', 'Quick meditation', 'Call a friend'],
      icon: '😤'
    },
    bored: {
      challenge: 'Boredom',
      advice: 'Boredom vaping is about filling time. Keep your hands and mind busy.',
      alternatives: ['Fidget toys', 'Puzzles', 'Short exercise', 'Learn something new'],
      icon: '😐'
    },
    social: {
      challenge: 'Social Situations',
      advice: 'Social pressure is tough. Let friends know you\'re cutting back.',
      alternatives: ['Hold a drink', 'Step away briefly', 'Find a non-vaping buddy', 'Practice saying no'],
      icon: '👥'
    },
    morning: {
      challenge: 'Morning Cravings',
      advice: 'Morning cravings are often the strongest. Delay your first intake gradually.',
      alternatives: ['Drink water first', 'Eat breakfast', 'Morning walk', 'Stretch routine'],
      icon: '🌅'
    },
    nighttime: {
      challenge: 'Nighttime Habits',
      advice: 'Evening routines can trigger cravings. Create a new wind-down ritual.',
      alternatives: ['Herbal tea', 'Reading', 'Light stretching', 'Journaling'],
      icon: '🌙'
    }
  };

  const key = challenge.toLowerCase();
  return responses[key] || {
    challenge: challenge,
    advice: `Focus on understanding why "${challenge}" triggers you. Keep notes when it happens.`,
    alternatives: ['Deep breathing', 'Drink water', 'Take a walk', 'Call someone'],
    icon: '💭'
  };
};

module.exports = { generateInsights, generateCoachingPlan };
