/**
 * Environment Configuration
 * @description Centralized environment variable access
 */

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/smokeless',
  JWT_SECRET: process.env.JWT_SECRET || 'default-dev-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  AI_API_KEY: process.env.AI_API_KEY || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};

// Validate required environment variables in production
const validateEnv = () => {
  const required = ['MONGO_URI', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  
  if (missing.length > 0 && env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

module.exports = { env, validateEnv };

