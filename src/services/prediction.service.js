/**
 * Prediction Service
 * @description Advanced craving prediction engine with ML-like scoring
 */

const Intake = require('../models/intake.model');
const dayjs = require('dayjs');
const { logger } = require('../config/logger');

/**
 * Predict craving probability for a user with enhanced accuracy
 * @param {string} userId - User ID
 */
const predictCraving = async (userId) => {
  try {
    // Get last 14 days of data for pattern analysis
    const twoWeeksAgo = dayjs().subtract(14, 'day').toDate();
    const intakes = await Intake.find({
      userId,
      loggedAt: { $gte: twoWeeksAgo }
    }).sort({ loggedAt: 1 });

    if (intakes.length < 5) {
      return {
        probability: null,
        confidence: 'low',
        message: 'Not enough data for accurate prediction. Keep logging!',
        nextLikelyTime: null,
        recommendation: {
          level: 'info',
          message: 'Log at least 5 entries to enable predictions.',
          actions: ['Start logging your intake', 'Be consistent with tracking']
        }
      };
    }

    const currentHour = dayjs().hour();
    const currentDay = dayjs().day();
    const currentMinute = dayjs().minute();

    // ========== FACTOR 1: Hourly Pattern (40% weight) ==========
    const hourlyWeights = Array(24).fill(0);
    const hourlySessionCounts = Array(24).fill(0);
    intakes.forEach((intake) => {
      const hour = dayjs(intake.loggedAt).hour();
      hourlyWeights[hour] += intake.puffs;
      hourlySessionCounts[hour] += 1;
    });

    const maxHourWeight = Math.max(...hourlyWeights, 1);
    const normalizedHourly = hourlyWeights.map(w => w / maxHourWeight);
    const hourFactor = normalizedHourly[currentHour];

    // ========== FACTOR 2: Day of Week Pattern (15% weight) ==========
    const dayWeights = Array(7).fill(0);
    intakes.forEach((intake) => {
      const day = dayjs(intake.loggedAt).day();
      dayWeights[day] += intake.puffs;
    });
    const maxDayWeight = Math.max(...dayWeights, 1);
    const normalizedDaily = dayWeights.map(w => w / maxDayWeight);
    const dayFactor = normalizedDaily[currentDay];

    // ========== FACTOR 3: Time Since Last Intake (25% weight) ==========
    const lastIntake = intakes[intakes.length - 1];
    const hoursSinceLastIntake = dayjs().diff(dayjs(lastIntake.loggedAt), 'hour', true);
    
    // Calculate average gap between intakes
    const gaps = [];
    for (let i = 1; i < intakes.length; i++) {
      const gap = dayjs(intakes[i].loggedAt).diff(dayjs(intakes[i-1].loggedAt), 'hour', true);
      if (gap < 24) gaps.push(gap); // Ignore overnight gaps
    }
    const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 4;
    
    // Time factor increases as we approach/pass typical gap
    const timeFactor = Math.min(1, Math.pow(hoursSinceLastIntake / avgGap, 1.5));

    // ========== FACTOR 4: Context Pattern (10% weight) ==========
    const contextCounts = {};
    intakes.forEach((intake) => {
      contextCounts[intake.context] = (contextCounts[intake.context] || 0) + 1;
    });
    const totalContexts = Object.values(contextCounts).reduce((a, b) => a + b, 0);
    const contextEntropy = Object.values(contextCounts).reduce((entropy, count) => {
      const p = count / totalContexts;
      return entropy - (p * Math.log2(p));
    }, 0);
    // Lower entropy = more predictable = higher factor
    const contextFactor = 1 - (contextEntropy / Math.log2(5)); // 5 context types

    // ========== FACTOR 5: Recent Trend (10% weight) ==========
    const lastThreeDays = intakes.filter(i => 
      dayjs(i.loggedAt).isAfter(dayjs().subtract(3, 'day'))
    );
    const last3DaysPuffs = lastThreeDays.reduce((s, i) => s + i.puffs, 0);
    const previous3Days = intakes.filter(i => 
      dayjs(i.loggedAt).isAfter(dayjs().subtract(6, 'day')) &&
      dayjs(i.loggedAt).isBefore(dayjs().subtract(3, 'day'))
    );
    const prev3DaysPuffs = previous3Days.reduce((s, i) => s + i.puffs, 0);
    
    let trendFactor = 0.5; // neutral
    if (prev3DaysPuffs > 0) {
      const trendRatio = last3DaysPuffs / prev3DaysPuffs;
      trendFactor = Math.min(1, Math.max(0, trendRatio - 0.5)); // 0.5-1.5 range -> 0-1
    }

    // ========== COMBINED PROBABILITY ==========
    const baseProbability = (
      (hourFactor * 0.40) +
      (dayFactor * 0.15) +
      (timeFactor * 0.25) +
      (contextFactor * 0.10) +
      (trendFactor * 0.10)
    );
    
    // Apply sigmoid-like smoothing
    const smoothedProbability = 1 / (1 + Math.exp(-6 * (baseProbability - 0.5)));
    const probability = Math.min(0.95, Math.max(0.05, smoothedProbability));

    // ========== NEXT LIKELY CRAVING TIME ==========
    const upcomingHours = [];
    for (let i = 1; i <= 8; i++) {
      const futureHour = (currentHour + i) % 24;
      upcomingHours.push({
        hour: futureHour,
        weight: normalizedHourly[futureHour],
        sessions: hourlySessionCounts[futureHour]
      });
    }
    const peakUpcoming = upcomingHours.sort((a, b) => b.weight - a.weight)[0];

    // ========== TRIGGER ANALYSIS ==========
    const likelyTrigger = Object.entries(contextCounts).sort((a, b) => b[1] - a[1])[0];
    
    // Time-based trigger hints
    let timeBasedTrigger = null;
    if (currentHour >= 6 && currentHour < 10) timeBasedTrigger = 'morning routine';
    else if (currentHour >= 12 && currentHour < 14) timeBasedTrigger = 'lunch break';
    else if (currentHour >= 17 && currentHour < 19) timeBasedTrigger = 'after work';
    else if (currentHour >= 21) timeBasedTrigger = 'evening wind-down';

    // ========== CONFIDENCE CALCULATION ==========
    let confidence = 'medium';
    if (intakes.length > 50 && gaps.length > 20) confidence = 'high';
    else if (intakes.length < 15) confidence = 'low';

    // ========== RISK LEVEL & RECOMMENDATIONS ==========
    const riskLevel = probability > 0.7 ? 'high' : probability > 0.4 ? 'moderate' : 'low';

    return {
      probability: Math.round(probability * 100),
      riskLevel,
      confidence,
      
      factors: {
        hourOfDay: { score: Math.round(hourFactor * 100), weight: '40%' },
        dayOfWeek: { score: Math.round(dayFactor * 100), weight: '15%' },
        timeSinceLastIntake: { score: Math.round(timeFactor * 100), weight: '25%' },
        patternPredictability: { score: Math.round(contextFactor * 100), weight: '10%' },
        recentTrend: { score: Math.round(trendFactor * 100), weight: '10%' }
      },
      
      timing: {
        hoursSinceLastIntake: Math.round(hoursSinceLastIntake * 10) / 10,
        averageGapHours: Math.round(avgGap * 10) / 10,
        currentHour,
        peakHour: hourlyWeights.indexOf(Math.max(...hourlyWeights))
      },
      
      nextLikelyTime: {
        hour: peakUpcoming.hour,
        formatted: `${peakUpcoming.hour}:00`,
        probability: Math.round(peakUpcoming.weight * 100),
        historicalSessions: peakUpcoming.sessions
      },
      
      triggers: {
        mostCommon: likelyTrigger ? {
          context: likelyTrigger[0],
          frequency: likelyTrigger[1],
          percentage: Math.round((likelyTrigger[1] / intakes.length) * 100)
        } : null,
        timeBasedHint: timeBasedTrigger
      },
      
      recommendation: getRecommendation(probability, hoursSinceLastIntake, avgGap, riskLevel),
      
      historicalContext: {
        totalDataPoints: intakes.length,
        daysOfData: 14,
        averagePerDay: Math.round((intakes.reduce((s, i) => s + i.puffs, 0) / 14) * 10) / 10
      }
    };
  } catch (error) {
    logger.error('Error predicting craving:', error);
    throw error;
  }
};

/**
 * Get recommendation based on craving probability and context
 */
const getRecommendation = (probability, hoursSince, avgGap, riskLevel) => {
  if (riskLevel === 'high') {
    return {
      level: 'high',
      icon: '🔴',
      title: 'High Craving Alert',
      message: 'Strong craving likely right now. Use your coping techniques!',
      urgentAction: 'Take 5 deep breaths immediately',
      actions: [
        { action: 'Deep breathing (4-7-8 technique)', duration: '2 min' },
        { action: 'Drink a full glass of water', duration: '1 min' },
        { action: 'Go for a quick walk', duration: '5 min' },
        { action: 'Text your accountability partner', duration: '1 min' }
      ],
      affirmation: "This craving will pass in 3-5 minutes. You've got this!"
    };
  } else if (riskLevel === 'moderate') {
    return {
      level: 'moderate',
      icon: '🟡',
      title: 'Moderate Risk',
      message: 'Craving may hit soon. Stay aware and prepared.',
      urgentAction: 'Have water or a healthy snack ready',
      actions: [
        { action: 'Prepare a distraction activity', duration: 'now' },
        { action: 'Review your motivations', duration: '2 min' },
        { action: 'Plan your next hour', duration: '1 min' }
      ],
      affirmation: "You're in control. Plan ahead and stay strong!"
    };
  } else {
    return {
      level: 'low',
      icon: '🟢',
      title: 'Low Risk Window',
      message: 'Great time to build positive habits!',
      urgentAction: null,
      actions: [
        { action: 'Practice mindfulness', duration: '5 min' },
        { action: 'Light exercise or stretching', duration: '10 min' },
        { action: 'Connect with supportive friends', duration: 'anytime' }
      ],
      affirmation: "Use this low-risk time to strengthen your resolve!"
    };
  }
};

/**
 * Get craving heatmap data for visualization
 */
const getCravingHeatmap = async (userId) => {
  try {
    const twoWeeksAgo = dayjs().subtract(14, 'day').toDate();
    const intakes = await Intake.find({
      userId,
      loggedAt: { $gte: twoWeeksAgo }
    });

    // Create 7x24 grid (day x hour)
    const heatmap = Array(7).fill(null).map(() => Array(24).fill(0));
    
    intakes.forEach((intake) => {
      const day = dayjs(intake.loggedAt).day();
      const hour = dayjs(intake.loggedAt).hour();
      heatmap[day][hour] += intake.puffs;
    });

    // Normalize
    const maxVal = Math.max(...heatmap.flat(), 1);
    const normalizedHeatmap = heatmap.map(row => 
      row.map(val => Math.round((val / maxVal) * 100))
    );

    return {
      heatmap: normalizedHeatmap,
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      hours: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      hotspots: findHotspots(normalizedHeatmap)
    };
  } catch (error) {
    logger.error('Error generating heatmap:', error);
    throw error;
  }
};

/**
 * Find top craving hotspots from heatmap
 */
const findHotspots = (heatmap) => {
  const spots = [];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  heatmap.forEach((row, dayIndex) => {
    row.forEach((value, hourIndex) => {
      if (value > 50) { // Only significant hotspots
        spots.push({
          day: days[dayIndex],
          hour: hourIndex,
          formatted: `${days[dayIndex]} at ${hourIndex}:00`,
          intensity: value
        });
      }
    });
  });

  return spots.sort((a, b) => b.intensity - a.intensity).slice(0, 5);
};

module.exports = { predictCraving, getCravingHeatmap };
