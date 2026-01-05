import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DATABASE_URL: Joi.string().required().messages({
    'string.empty': 'DATABASE_URL is required',
    'any.required': 'DATABASE_URL is required',
  }),

  // JWT
  JWT_SECRET: Joi.string().min(16).required().messages({
    'string.empty': 'JWT_SECRET is required',
    'string.min': 'JWT_SECRET must be at least 16 characters',
    'any.required': 'JWT_SECRET is required',
  }),
  JWT_EXPIRATION: Joi.number().default(900),

  // Storage
  STORAGE_TYPE: Joi.string().valid('local', 's3').default('local'),
  UPLOAD_DIR: Joi.string().default('./uploads'),
  MAX_FILE_SIZE: Joi.number().default(10485760),
  ALLOWED_MIME_TYPES: Joi.string().default(
    'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain',
  ),

  // S3 (required only if STORAGE_TYPE is 's3')
  AWS_REGION: Joi.string().when('STORAGE_TYPE', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  AWS_ACCESS_KEY_ID: Joi.string().when('STORAGE_TYPE', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  AWS_SECRET_ACCESS_KEY: Joi.string().when('STORAGE_TYPE', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  AWS_S3_BUCKET: Joi.string().when('STORAGE_TYPE', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // Thumbnails
  THUMBNAIL_WIDTH: Joi.number().default(200),
  THUMBNAIL_HEIGHT: Joi.number().default(200),

  // User Storage
  DEFAULT_STORAGE_LIMIT: Joi.number().default(104857600),
});
