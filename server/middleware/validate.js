import { validationResult, body, param, query } from 'express-validator';
import { createError } from './errorHandler.js';

/**
 * Middleware to check validation results and return standardized errors
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const details = {};
    errors.array().forEach((err) => {
      details[err.path] = err.msg;
    });
    
    return next(createError(400, 'validation_error', 'Request body is invalid', details));
  }
  
  next();
};

/**
 * Auth validation rules
 */
export const validateRegister = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  validate,
];

export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate,
];

/**
 * Experience validation rules
 */
export const validateCreateExperience = [
  body('type')
    .isIn(['work', 'project', 'education', 'skill'])
    .withMessage('Type must be one of: work, project, education, skill'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 120 })
    .withMessage('Title cannot exceed 120 characters'),
  body('organization')
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Organization cannot exceed 120 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 80 })
    .withMessage('Location cannot exceed 80 characters'),
  body('startDate')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Start date cannot exceed 20 characters'),
  body('endDate')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('End date cannot exceed 20 characters'),
  body('bullets')
    .optional()
    .isArray({ max: 8 })
    .withMessage('Maximum 8 bullets allowed'),
  body('bullets.*.text')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Each bullet cannot exceed 300 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('priority')
    .optional()
    .isInt()
    .withMessage('Priority must be an integer'),
  body('visible')
    .optional()
    .isBoolean()
    .withMessage('Visible must be a boolean'),
  validate,
];

export const validateUpdateExperience = [
  param('id')
    .isMongoId()
    .withMessage('Invalid experience ID'),
  body('type')
    .optional()
    .isIn(['work', 'project', 'education', 'skill'])
    .withMessage('Type must be one of: work, project, education, skill'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Title cannot exceed 120 characters'),
  body('organization')
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Organization cannot exceed 120 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 80 })
    .withMessage('Location cannot exceed 80 characters'),
  body('startDate')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Start date cannot exceed 20 characters'),
  body('endDate')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('End date cannot exceed 20 characters'),
  body('bullets')
    .optional()
    .isArray({ max: 8 })
    .withMessage('Maximum 8 bullets allowed'),
  body('bullets.*.text')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Each bullet cannot exceed 300 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('priority')
    .optional()
    .isInt()
    .withMessage('Priority must be an integer'),
  body('visible')
    .optional()
    .isBoolean()
    .withMessage('Visible must be a boolean'),
  validate,
];

export const validateExperienceId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid experience ID'),
  validate,
];

/**
 * Tailor validation rules
 */
export const validateTailor = [
  body('jobDescriptionRaw')
    .trim()
    .notEmpty()
    .withMessage('Job description is required')
    .isLength({ max: 20000 })
    .withMessage('Job description cannot exceed 20,000 characters'),
  body('jobTitle')
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Job title cannot exceed 120 characters'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Company cannot exceed 120 characters'),
  body('mode')
    .optional()
    .isIn(['pdf', 'preview', 'json', 'latex'])
    .withMessage('Mode must be one of: pdf, preview, json, latex'),
  validate,
];

export const validateSessionId = [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID'),
  validate,
];

export const validateSessionsQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  validate,
];
