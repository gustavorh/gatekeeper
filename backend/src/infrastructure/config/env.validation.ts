import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),

  DATABASE_URL: Joi.string()
    .uri({ scheme: ['mysql'] })
    .optional(),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(3306),
  DB_USER: Joi.string().default('root'),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_NAME: Joi.string().default('gatekeeper'),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  FRONTEND_URL: Joi.string().uri().optional(),
  CORS_ORIGINS: Joi.string().default('http://localhost:8000'),

  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),
  THROTTLE_AUTH_TTL: Joi.number().default(60),
  THROTTLE_AUTH_LIMIT: Joi.number().default(5),

  BULL_REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).optional(),
}).custom((value: Record<string, string | undefined>, helpers) => {
  if (!value.DATABASE_URL && !value.DB_HOST) {
    return helpers.error('any.invalid', {
      message: 'Either DATABASE_URL or DB_HOST must be provided',
    });
  }
  return value;
});
