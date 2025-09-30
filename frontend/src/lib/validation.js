import Joi from 'joi';

// User registration validation schema
export const registerSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters'
    }),
  
  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'string.empty': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'string.max': 'Password cannot exceed 128 characters',
      'string.empty': 'Password is required'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'string.empty': 'Password confirmation is required'
    }),
  
  dateOfBirth: Joi.date()
    .max('now')
    .min('1900-01-01')
    .required()
    .messages({
      'date.max': 'Date of birth cannot be in the future',
      'date.min': 'Please enter a valid date of birth',
      'any.required': 'Date of birth is required'
    }),
  
  diabetesType: Joi.string()
    .valid('type1', 'type2', 'gestational', 'prediabetes', 'other', 'prefer-not-to-say', '')
    .allow('')
    .default(''),
  
  subscribeNewsletter: Joi.boolean()
    .default(false)
});

// User login validation schema
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'string.empty': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required'
    }),
  
  rememberMe: Joi.boolean()
    .default(false)
});

// Glucose reading validation schema
export const glucoseReadingSchema = Joi.object({
  value: Joi.number()
    .min(0)
    .max(1000)
    .required()
    .messages({
      'number.min': 'Glucose value must be positive',
      'number.max': 'Glucose value seems too high, please check',
      'any.required': 'Glucose value is required'
    }),
  
  timestamp: Joi.date()
    .max('now')
    .default(Date.now),
  
  mealContext: Joi.string()
    .valid('fasting', 'before-meal', 'after-meal', 'bedtime', 'random')
    .default('random'),
  
  notes: Joi.string()
    .max(500)
    .allow('')
    .default('')
});

// Medication validation schema
export const medicationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Medication name is required',
      'string.min': 'Medication name must be at least 2 characters'
    }),
  
  dosage: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Dosage is required'
    }),
  
  frequency: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Frequency is required'
    }),
  
  reminderTimes: Joi.array()
    .items(Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/))
    .default([])
    .messages({
      'string.pattern.base': 'Reminder times must be in HH:MM format'
    }),
  
  isActive: Joi.boolean()
    .default(true)
});

// Profile update validation schema
export const profileUpdateSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters'
    }),
  
  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  
  dateOfBirth: Joi.date()
    .max('now')
    .min('1900-01-01')
    .messages({
      'date.max': 'Date of birth cannot be in the future',
      'date.min': 'Please enter a valid date of birth'
    }),
  
  diabetesType: Joi.string()
    .valid('type1', 'type2', 'gestational', 'prediabetes', 'other', 'prefer-not-to-say', '')
    .allow(''),
  
  subscribeNewsletter: Joi.boolean(),
  
  preferences: Joi.object({
    units: Joi.object({
      glucose: Joi.string().valid('mg/dL', 'mmol/L')
    }),
    notifications: Joi.object({
      glucoseReminders: Joi.boolean(),
      medicationReminders: Joi.boolean(),
      weeklyReports: Joi.boolean()
    }),
    targetRanges: Joi.object({
      fastingGlucose: Joi.object({
        min: Joi.number().min(50).max(200),
        max: Joi.number().min(50).max(400)
      }),
      postMealGlucose: Joi.object({
        min: Joi.number().min(50).max(200),
        max: Joi.number().min(50).max(400)
      })
    })
  })
});

// Password change validation schema
export const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required'
    }),
  
  newPassword: Joi.string()
    .min(6)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'New password must be at least 6 characters',
      'string.max': 'New password cannot exceed 128 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      'string.empty': 'New password is required'
    }),
  
  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'New passwords do not match',
      'string.empty': 'New password confirmation is required'
    })
});

/**
 * Validate data against a schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Joi schema
 * @returns {Object} Validation result
 */
export const validateData = (data, schema) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return { isValid: false, errors, data: null };
  }
  
  return { isValid: true, errors: null, data: value };
};
