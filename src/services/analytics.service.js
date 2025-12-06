/**
 * Analytics Service
 * @description Aggregation and trend analysis for intake data
 */

const Intake = require('../models/intake.model');
const dayjs = require('dayjs');
const { logger } = require('../config/logger');

/**
 * Get daily statistics for a user
 * @param {string} userId - User ID
 * @param {string} date - Date string (YYYY-MM-DD), defaults to today
 */
const getDailyStats = async (userId, date) => {
  try {
    const targetDate = date ? dayjs(date) : dayjs();
    const startOfDay = targetDate.startOf('day').toDate();
    const endOfDay = targetDate.endOf('day').toDate();

    const intakes = await Intake.find({
      userId,
      loggedAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ loggedAt: 1 });

    // Hourly breakdown
    const hourlyData = Array(24).fill(0);
    intakes.forEach((intake) => {
      const hour = dayjs(intake.loggedAt).hour();
      hourlyData[hour] += intake.puffs;
    });

    // Context breakdown
    const contextBreakdown = {};
    intakes.forEach((intake) => {
      contextBreakdown[intake.context] = (contextBreakdown[intake.context] || 0) + 1;
    });

    // Intensity breakdown
    const intensityBreakdown = { low: 0, medium: 0, high: 0 };
    intakes.forEach((intake) => {
      intensityBreakdown[intake.intensity] += intake.puffs;
    });

    return {
      date: targetDate.format('YYYY-MM-DD'),
      totalPuffs: intakes.reduce((sum, i) => sum + i.puffs, 0),
      totalSessions: intakes.length,
      hourlyData,
      contextBreakdown,
      intensityBreakdown,
      peakHour: hourlyData.indexOf(Math.max(...hourlyData)),
      firstIntake: intakes[0]?.loggedAt || null,
      lastIntake: intakes[intakes.length - 1]?.loggedAt || null
    };
  } catch (error) {
    logger.error('Error getting daily stats:', error);
    throw error;
  }
};

/**
 * Get weekly statistics for a user
 * @param {string} userId - User ID
 * @param {string} startDate - Start date of week (YYYY-MM-DD)
 */
const getWeeklyStats = async (userId, startDate) => {
  try {
    const weekStart = startDate ? dayjs(startDate) : dayjs().startOf('week');
    const weekEnd = weekStart.add(6, 'day').endOf('day');

    const intakes = await Intake.find({
      userId,
      loggedAt: { $gte: weekStart.toDate(), $lte: weekEnd.toDate() }
    }).sort({ loggedAt: 1 });

    // Daily breakdown
    const dailyData = [];
    for (let i = 0; i < 7; i++) {
      const day = weekStart.add(i, 'day');
      const dayIntakes = intakes.filter((intake) => 
        dayjs(intake.loggedAt).isSame(day, 'day')
      );
      dailyData.push({
        date: day.format('YYYY-MM-DD'),
        dayOfWeek: day.format('dddd'),
        totalPuffs: dayIntakes.reduce((sum, i) => sum + i.puffs, 0),
        sessions: dayIntakes.length
      });
    }

    // Calculate trend (simple linear regression slope)
    const puffsPerDay = dailyData.map(d => d.totalPuffs);
    const trend = calculateTrend(puffsPerDay);

    // Context summary
    const contextSummary = {};
    intakes.forEach((intake) => {
      contextSummary[intake.context] = (contextSummary[intake.context] || 0) + intake.puffs;
    });

    return {
      weekStart: weekStart.format('YYYY-MM-DD'),
      weekEnd: weekEnd.format('YYYY-MM-DD'),
      totalPuffs: intakes.reduce((sum, i) => sum + i.puffs, 0),
      totalSessions: intakes.length,
      dailyAverage: intakes.reduce((sum, i) => sum + i.puffs, 0) / 7,
      dailyData,
      contextSummary,
      trend: {
        direction: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
        slope: trend,
        message: getTrendMessage(trend)
      }
    };
  } catch (error) {
    logger.error('Error getting weekly stats:', error);
    throw error;
  }
};

/**
 * Get monthly statistics for a user
 * @param {string} userId - User ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 */
const getMonthlyStats = async (userId, month, year) => {
  try {
    const targetMonth = month ? parseInt(month) - 1 : dayjs().month();
    const targetYear = year ? parseInt(year) : dayjs().year();
    
    const monthStart = dayjs().year(targetYear).month(targetMonth).startOf('month');
    const monthEnd = monthStart.endOf('month');
    const daysInMonth = monthEnd.date();

    const intakes = await Intake.find({
      userId,
      loggedAt: { $gte: monthStart.toDate(), $lte: monthEnd.toDate() }
    }).sort({ loggedAt: 1 });

    // Weekly breakdown
    const weeklyData = [];
    let weekStart = monthStart;
    while (weekStart.isBefore(monthEnd)) {
      const weekEnd = weekStart.add(6, 'day');
      const actualEnd = weekEnd.isAfter(monthEnd) ? monthEnd : weekEnd;
      
      const weekIntakes = intakes.filter((intake) => {
        const logDate = dayjs(intake.loggedAt);
        return logDate.isAfter(weekStart.subtract(1, 'day')) && logDate.isBefore(actualEnd.add(1, 'day'));
      });

      weeklyData.push({
        weekStart: weekStart.format('YYYY-MM-DD'),
        weekEnd: actualEnd.format('YYYY-MM-DD'),
        totalPuffs: weekIntakes.reduce((sum, i) => sum + i.puffs, 0),
        sessions: weekIntakes.length
      });

      weekStart = weekStart.add(7, 'day');
    }

    // Heatmap data (hour x day)
    const heatmapData = {};
    intakes.forEach((intake) => {
      const day = dayjs(intake.loggedAt).day();
      const hour = dayjs(intake.loggedAt).hour();
      const key = `${day}-${hour}`;
      heatmapData[key] = (heatmapData[key] || 0) + intake.puffs;
    });

    return {
      month: monthStart.format('MMMM YYYY'),
      monthStart: monthStart.format('YYYY-MM-DD'),
      monthEnd: monthEnd.format('YYYY-MM-DD'),
      totalPuffs: intakes.reduce((sum, i) => sum + i.puffs, 0),
      totalSessions: intakes.length,
      dailyAverage: intakes.reduce((sum, i) => sum + i.puffs, 0) / daysInMonth,
      weeklyData,
      heatmapData,
      daysWithLogs: new Set(intakes.map(i => dayjs(i.loggedAt).format('YYYY-MM-DD'))).size,
      daysInMonth
    };
  } catch (error) {
    logger.error('Error getting monthly stats:', error);
    throw error;
  }
};

/**
 * Calculate simple linear trend
 */
const calculateTrend = (values) => {
  const n = values.length;
  if (n < 2) return 0;

  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) ** 2;
  }

  return denominator === 0 ? 0 : numerator / denominator;
};

/**
 * Get human-readable trend message
 */
const getTrendMessage = (slope) => {
  if (slope < -2) return 'Great progress! Your usage is decreasing significantly.';
  if (slope < -0.5) return 'Good job! Your usage is trending down.';
  if (slope < 0.5) return 'Your usage is stable this week.';
  if (slope < 2) return 'Your usage is slightly increasing. Stay mindful!';
  return 'Your usage is increasing. Consider reviewing your triggers.';
};

module.exports = { getDailyStats, getWeeklyStats, getMonthlyStats };

