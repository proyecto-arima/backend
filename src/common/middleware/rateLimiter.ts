import { Request } from 'express';
import { rateLimit } from 'express-rate-limit';

import { config } from '../utils/config';

const rateLimiter = rateLimit({
  legacyHeaders: true,
  limit: config.app.rate_limit_max_requests,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  windowMs: 15 * 60 * config.app.rate_limit_window_ms,
  keyGenerator: (req: Request) => req.ip as string,
});

export default rateLimiter;
