/**
 * Validation Middleware
 * @description Zod schema validation for request payloads
 */

const { ZodError } = require('zod');

/**
 * Validate request body against a Zod schema
 * @param {ZodSchema} schema - Zod schema to validate against
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: messages
        });
      }
      next(error);
    }
  };
};

/**
 * Validate query parameters
 * @param {ZodSchema} schema - Zod schema to validate against
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Query validation failed',
          details: messages
        });
      }
      next(error);
    }
  };
};

module.exports = { validate, validateQuery };

