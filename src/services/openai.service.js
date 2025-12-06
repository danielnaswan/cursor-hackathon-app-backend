/**
 * OpenAI Service
 * @description Real AI integration for intelligent coaching and insights
 */

const axios = require('axios');
const { logger } = require('../config/logger');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Generate AI response using OpenAI/Claude
 * @param {string} systemPrompt - System context
 * @param {string} userPrompt - User's question/data
 * @param {object} options - Additional options
 */
const generateAIResponse = async (systemPrompt, userPrompt, options = {}) => {
  const apiKey = process.env.AI_API_KEY;
  
  // Check if it's an Anthropic key (Claude)
  const isAnthropic = apiKey?.startsWith('sk-ant-');
  
  if (isAnthropic) {
    return generateClaudeResponse(systemPrompt, userPrompt, options);
  }
  
  // Default to OpenAI
  return generateOpenAIResponse(systemPrompt, userPrompt, options);
};

/**
 * Generate response using OpenAI
 */
const generateOpenAIResponse = async (systemPrompt, userPrompt, options = {}) => {
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: options.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: options.maxTokens || 500,
        temperature: options.temperature || 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.AI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      content: response.data.choices[0].message.content,
      usage: response.data.usage
    };
  } catch (error) {
    logger.error('OpenAI API Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || 'AI service unavailable',
      fallback: true
    };
  }
};

/**
 * Generate response using Anthropic Claude
 */
const generateClaudeResponse = async (systemPrompt, userPrompt, options = {}) => {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: options.model || 'claude-3-haiku-20240307',
        max_tokens: options.maxTokens || 500,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      },
      {
        headers: {
          'x-api-key': process.env.AI_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      }
    );

    return {
      success: true,
      content: response.data.content[0].text,
      usage: response.data.usage
    };
  } catch (error) {
    logger.error('Claude API Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || 'AI service unavailable',
      fallback: true
    };
  }
};

/**
 * Generate personalized coaching advice
 */
const getAICoaching = async (userData) => {
  const systemPrompt = `You are a compassionate and knowledgeable health coach specializing in helping people quit smoking and vaping. 
Your responses should be:
- Empathetic and non-judgmental
- Evidence-based and practical
- Encouraging and motivating
- Personalized to the user's specific situation
Keep responses concise (2-3 paragraphs max).`;

  const userPrompt = `Based on this user's data, provide personalized coaching advice:

User Stats:
- Daily average puffs: ${userData.dailyAverage}
- Most common trigger: ${userData.topTrigger}
- Current streak: ${userData.streakDays} days
- Weekly trend: ${userData.trend}
- Goal: ${userData.goal || 'Reduce and quit'}

Current challenge they're facing: ${userData.challenge || 'General cravings'}

Provide specific, actionable advice for today.`;

  const response = await generateAIResponse(systemPrompt, userPrompt);
  
  if (!response.success) {
    // Fallback to rule-based response
    return {
      success: true,
      content: generateFallbackCoaching(userData),
      source: 'fallback'
    };
  }
  
  return { ...response, source: 'ai' };
};

/**
 * Generate AI-powered insights
 */
const getAIInsights = async (analyticsData) => {
  const systemPrompt = `You are a data analyst specializing in behavioral health patterns. 
Analyze the user's vaping/smoking data and provide 3-4 key insights.
Format each insight with an emoji, title, and brief explanation.
Be specific with numbers and patterns you observe.`;

  const userPrompt = `Analyze this user's intake data and provide insights:

Weekly Data:
- Total puffs: ${analyticsData.totalPuffs}
- Sessions: ${analyticsData.totalSessions}
- Daily average: ${analyticsData.dailyAverage}
- Peak hour: ${analyticsData.peakHour}:00
- Top trigger: ${analyticsData.topContext}
- Trend: ${analyticsData.trend}

Context breakdown:
${JSON.stringify(analyticsData.contextBreakdown, null, 2)}

Intensity breakdown:
${JSON.stringify(analyticsData.intensityBreakdown, null, 2)}

Provide actionable insights based on this data.`;

  const response = await generateAIResponse(systemPrompt, userPrompt);
  
  if (!response.success) {
    return {
      success: true,
      content: generateFallbackInsights(analyticsData),
      source: 'fallback'
    };
  }
  
  return { ...response, source: 'ai' };
};

/**
 * Fallback coaching when AI is unavailable
 */
const generateFallbackCoaching = (userData) => {
  const tips = [];
  
  if (userData.topTrigger === 'stress') {
    tips.push("Try the 4-7-8 breathing technique when stressed: inhale 4 seconds, hold 7, exhale 8.");
  }
  if (userData.dailyAverage > 10) {
    tips.push("Consider reducing by just 1-2 puffs per day. Small steps lead to big changes.");
  }
  if (userData.streakDays > 0) {
    tips.push(`Great job on your ${userData.streakDays}-day streak! Keep the momentum going.`);
  }
  
  tips.push("Remember: every craving passes within 3-5 minutes. You've got this!");
  
  return tips.join('\n\n');
};

/**
 * Fallback insights when AI is unavailable
 */
const generateFallbackInsights = (analyticsData) => {
  return `📊 **Weekly Summary**
You had ${analyticsData.totalPuffs} puffs across ${analyticsData.totalSessions} sessions.

⏰ **Peak Time**
Your highest usage is around ${analyticsData.peakHour}:00. Plan distractions for this time.

🎯 **Main Trigger**
"${analyticsData.topContext}" triggers most of your usage. Focus on managing this.

📈 **Trend**
Your usage is ${analyticsData.trend}. ${analyticsData.trend === 'decreasing' ? 'Great progress!' : 'Stay mindful and keep trying.'}`;
};

module.exports = {
  generateAIResponse,
  getAICoaching,
  getAIInsights
};

