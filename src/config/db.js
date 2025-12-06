/**
 * Database Configuration
 * @description MongoDB connection setup using Mongoose
 */

const mongoose = require('mongoose');
const { logger } = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 6+ doesn't need these options, but keeping for compatibility
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB Disconnected');
  } catch (error) {
    logger.error(`MongoDB Disconnect Error: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };

