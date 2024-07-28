import dotenv from 'dotenv';
import z from 'zod';

dotenv.config();

const ConfigSchema = z.object({
  smtp: z.object({
    host: z.string().default('localhost'),
    port: z.number().min(1).max(65535),
    auth: z.object({
      type: z.enum(['login', 'plain']).default('plain'),
      secure: z.boolean().default(false),
      user: z.string(),
      pass: z.string(),
    }),
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
    frontendUrl: z.string(),
  }),
});
export type Config = z.infer<typeof ConfigSchema>;

const envConfig = {
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT as string),
    auth: setSmtpAuth(),
    secure: setTLS(),
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
    frontendUrl: process.env.FRONTEND_URL,
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
    frontendUrl: 'http://localhost:3000',
  },
};

export const config: Config =
  process.env.NODE_ENV === 'test' ? ConfigSchema.parse(testConfig) : ConfigSchema.parse(envConfig);

export function setSmtpAuth() {
  return process.env.SMTP_AUTH_TYPE == 'login'
    ? {
        type: process.env.SMTP_AUTH_TYPE,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : {
        type: 'plain',
      };
}

export function setTLS() {
  return process.env.SMTP_TLS == 'on' ? true : false;
}
