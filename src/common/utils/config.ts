import dotenv from 'dotenv';
import z from 'zod';

dotenv.config();

const ConfigSchema = z.object({
  smtp: z.object({
    host: z.string(),
    port: z.number().min(1).max(65535),
    auth: z
      .object({
        user: z.string().optional(),
        pass: z.string().optional(),
      })
      .optional(),
    sender: z.string().email(),
  }),
  mongodb: z.object({
    uri: z.string(),
  }),
  jwt: z.object({
    secret: z.string(),
  }),
  cors_origin: z.string(),
  app: z.object({
    node_env: z.enum(['development', 'production', 'test']).default('development'),
    host: z.string().default('localhost'),
    port: z.number().min(1).max(65535).default(8080),
    rate_limit_max_requests: z.number().default(100),
    rate_limit_window_ms: z.number().default(15 * 60 * 1000),
  }),
});
export type Config = z.infer<typeof ConfigSchema>;

const envConfig = {
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT as string),
    auth: smtpAuth(),
    sender: process.env.SMTP_SENDER,
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  cors_origin: process.env.CORS_ORIGIN,
  app: {
    host: process.env.HOST,
    port: parseInt(process.env.PORT as string),
    node_env: process.env.NODE_ENV,
    rate_limit_max_requests: parseInt(process.env.COMMON_RATE_LIMIT_MAX_REQUESTS as string),
    rate_limit_window_ms: parseInt(process.env.COMMON_RATE_LIMIT_WINDOW_MS as string),
  },
};

const testConfig = {
  smtp: {
    host: 'smtp.test.com',
    port: 587,
    sender: 'test@test.com',
  },
  mongodb: {
    uri: 'mongodb://localhost:27017/test',
  },
  jwt: {
    secret: 'secret',
  },
  cors_origin: 'http://localhost:3000',
  app: {
    host: 'localhost',
    port: 8080,
    node_env: 'test',
    rate_limit_max_requests: 100,
    rate_limit_window_ms: 900000,
  },
};

export const config: Config =
  process.env.NODE_ENV === 'test' ? ConfigSchema.parse(testConfig) : ConfigSchema.parse(envConfig);

function smtpAuth() {
  return process.env.SMTP_USER || process.env.SMTP_PASS
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined;
}
