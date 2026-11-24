import { rateLimit, MemoryStore, ipKeyGenerator } from 'express-rate-limit';
import AppError from '../utils/appError.js';

// Request limits for the unauthenticated endpoints. In-memory stores are enough for
// one server process; a multi-instance deployment would swap in a shared store.
//
// RATE_LIMIT_SCALE multiplies every limit. It exists only for the load test
// (tests/load), which must not be throttled; production leaves it unset (= 1).
const scale = () => Math.max(1, Number(process.env.RATE_LIMIT_SCALE) || 1);

const stores = [];

const limiter = ({ windowMs, limit, message, keyGenerator }) => {
  const store = new MemoryStore();
  stores.push(store);
  return rateLimit({
    windowMs,
    limit: () => limit * scale(),
    store,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    ...(keyGenerator && { keyGenerator }),
    handler: (req, res, next) => next(new AppError(message, 429, 'RATE_LIMITED')),
  });
};

const MIN = 60 * 1000;

const byEmail = (req) => `email:${String(req.body?.email || '').trim().toLowerCase()}`;

// 3 codes per email per 15 minutes: stops brute force across fresh codes and
// stops the endpoint being used to flood someone's inbox.
export const otpPerEmail = limiter({
  windowMs: 15 * MIN,
  limit: 3,
  keyGenerator: byEmail,
  message: 'Too many codes requested for this email. Try again in 15 minutes.',
});

export const otpPerIp = limiter({
  windowMs: 60 * MIN,
  limit: 20,
  keyGenerator: (req) => `ip:${ipKeyGenerator(req.ip)}`,
  message: 'Too many code requests from this network. Try again later.',
});

export const submitPerIp = limiter({
  windowMs: 60 * MIN,
  limit: 20,
  keyGenerator: (req) => `ip:${ipKeyGenerator(req.ip)}`,
  message: 'Too many complaints filed from this network. Try again later.',
});

export const loginPerIp = limiter({
  windowMs: 15 * MIN,
  limit: 30,
  keyGenerator: (req) => `ip:${ipKeyGenerator(req.ip)}`,
  message: 'Too many sign-in attempts. Try again in 15 minutes.',
});

// Tests start each case with empty counters.
export const resetRateLimits = async () => {
  await Promise.all(stores.map((s) => s.resetAll()));
};
