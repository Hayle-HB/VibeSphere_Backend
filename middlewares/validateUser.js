const Joi = require("joi");

/**
 * Validation schema definitions for user-related data
 */
const schemas = {
  name: Joi.string().min(2).trim().required().messages({
    "string.min": "Name must be at least 2 characters long",
    "string.empty": "Name is required",
  }),
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .pattern(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)
    .messages({
      "string.email": "Please enter a valid email",
      "string.empty": "Email is required", 
      "string.pattern.base": "Please enter a valid email",
    }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters long",
    "string.empty": "Password is required",
  }),
  token: Joi.string().required().messages({
    "string.empty": "Reset token is required",
  }),
};

/**
 * Generic validation middleware factory
 * Creates a middleware function that validates request body against provided schema
 * @param {Object} schemaMap - Object containing Joi schema definitions
 * @returns {Function} Express middleware function
 */
const validate = (schemaMap) => {
  return (req, res, next) => {
    const schema = Joi.object(schemaMap);
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message,
      }));
      return res.status(400).json({ errors });
    }

    next();
  };
};

/**
 * Validation middleware for user registration
 */
const validateUser = validate({
  name: schemas.name,
  email: schemas.email,
  password: schemas.password,
});

/**
 * Validation middleware for user login
 */
const validateLogin = validate({
  email: schemas.email,
  password: schemas.password,
});

/**
 * Validation middleware for email operations
 */
const validateEmail = validate({
  email: schemas.email,
});

/**
 * Validation middleware for password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateResetPassword = (req, res, next) => {
  const { token, password } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Reset token is required",
    });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long",
    });
  }

  next();
};

module.exports = {
  validateUser,
  validateLogin,
  validateEmail,
  validateResetPassword,
  validate, 
};
