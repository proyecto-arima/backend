import dotenv from 'dotenv';
import z from 'zod';

dotenv.config();

const ConfigSchema = z.object({
  smtp: z.object({
    host: z.string().default('localhost'),
    port: z.number().min(1).max(65535),
    secure: z.boolean().default(false),
    auth: z
      .object({
        user: z.string(),
        pass: z.string(),
      })
      .optional(),
    sender: z.string().email(),
  }),
  googleAuth: z.object({
    clientId: z.string(),
    clientSecret: z.string(),
    callbackUrl: z.string(),
  }),
  mongodb: z.object({
    uri: z.string(),
  }),
  jwt: z.object({
    secret: z.string(),
  }),
  cors_origin: z.string(),
  cloud_service: z.object({
    aws: z.object({
      aws_access_key_id: z.string(),
      aws_secret_access_key: z.string(),
      region: z.string().default('us-east-1'),
      bucket: z.string(),
      prefix: z.string(),
      imagesBucket: z.string(),
    }),
  }),
  app: z.object({
    node_env: z.enum(['development', 'production', 'test']).default('development'),
    host: z.string().default('localhost'),
    port: z.number().min(1).max(65535).default(8080),
    rate_limit_max_requests: z.number().default(100),
    rate_limit_window_ms: z.number().default(15 * 60 * 1000),
    frontendUrl: z.string(),
  }),
  openai: z.object({
    organization: z.string(),
    apiKey: z.string(),
  }),
});
export type Config = z.infer<typeof ConfigSchema>;

export function setSmtpAuth() {
  return process.env.SMTP_AUTH_TYPE == 'login'
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined;
}

export function setTLS() {
  return process.env.SMTP_TLS == 'on' ? true : false;
}

const envConfig = {
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT as string),
    auth: setSmtpAuth(),
    secure: setTLS(),
    sender: process.env.SMTP_SENDER,
  },
  googleAuth: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL_HOST,
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  cors_origin: process.env.CORS_ORIGIN,
  cloud_service: {
    aws: {
      aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
      aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      bucket: process.env.BUCKET,
      prefix: process.env.PREFIX,
      imagesBucket: process.env.IMAGES_BUCKET,
    },
  },
  app: {
    host: process.env.HOST,
    port: parseInt(process.env.PORT as string),
    node_env: process.env.NODE_ENV,
    rate_limit_max_requests: parseInt(process.env.COMMON_RATE_LIMIT_MAX_REQUESTS as string),
    rate_limit_window_ms: parseInt(process.env.COMMON_RATE_LIMIT_WINDOW_MS as string),
    frontendUrl: process.env.FRONTEND_URL,
  },
  openai: {
    organization: process.env.OPENAI_ORGANIZATION,
    apiKey: process.env.OPENAI_API_KEY,
  },
};

const testConfig = {
  smtp: {
    host: 'smtp.test.com',
    port: 587,
    sender: 'test@test.com',
  },
  googleAuth: {
    clientId: 'test',
    clientSecret: 'test',
  },
  mongodb: {
    uri: 'mongodb://localhost:27017/test',
  },
  jwt: {
    secret: 'secret',
  },
  cors_origin: 'http://localhost:3000',
  cloud_service: {
    aws: {
      aws_access_key_id: '',
      aws_secret_access_key: '',
      region: '',
      bucket: '',
      prefix: '',
      imagesBucket: '',
    },
  },
  app: {
    host: 'localhost',
    port: 8080,
    node_env: 'test',
    rate_limit_max_requests: 100,
    rate_limit_window_ms: 900000,
    frontendUrl: 'http://localhost:3000',
  },
  openai: {
    organization: '',
    apiKey: '',
  },
};

export const config: Config =
  process.env.NODE_ENV === 'test' ? ConfigSchema.parse(testConfig) : ConfigSchema.parse(envConfig);
