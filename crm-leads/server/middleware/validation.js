const { body, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// Validaciones para registro de usuario
const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscores'),
    
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
    
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim(),
    
  body('role')
    .optional()
    .isIn(['admin', 'seller'])
    .withMessage('Role must be admin or seller'),
    
  handleValidationErrors
];

// Validaciones para login
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
    
  handleValidationErrors
];

// Validaciones para crear/actualizar lead
const validateLead = [
  body('name')
    .notEmpty()
    .withMessage('Establishment name is required')
    .trim(),
    
  body('contact')
    .notEmpty()
    .withMessage('Contact person is required')
    .trim(),
    
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .trim(),
    
  body('website')
    .notEmpty()
    .withMessage('Website is required')
    .trim(),
    
  body('type')
    .optional()
    .isIn(['clinica', 'estetica', 'otro'])
    .withMessage('Type must be clinica, estetica or otro'),
    
  body('status')
    .optional()
    .isIn(['uncontacted', 'contacted', 'interested', 'meeting', 'won', 'lost'])
    .withMessage('Invalid status'),
    
  body('rating')
    .optional()
    .isNumeric()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
    
  handleValidationErrors
];

// Validación para actualizar status de lead
const validateLeadStatus = [
  body('status')
    .isIn(['uncontacted', 'contacted', 'interested', 'meeting', 'won', 'lost'])
    .withMessage('Invalid status'),
    
  body('notes')
    .optional()
    .trim(),
    
  body('nextAction')
    .optional()
    .isISO8601()
    .withMessage('Next action must be a valid date'),
    
  handleValidationErrors
];

// Sanitizar entrada de texto para prevenir XSS
const sanitizeTextInput = (req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Remover scripts y HTML tags básicos
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '')
          .trim();
      }
    }
  }
  next();
};

module.exports = {
  validateUserRegistration,
  validateLogin,
  validateLead,
  validateLeadStatus,
  sanitizeTextInput,
  handleValidationErrors
};