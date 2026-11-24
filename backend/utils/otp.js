import crypto from 'crypto';
import Otp from '../models/Otp.js';
import AppError from './appError.js';

// Email one-time codes for complaint filing and account verification.
//
// Brute-force bounds: a code is valid for OTP_TTL_MS and allows OTP_MAX_ATTEMPTS
// guesses; the request endpoint allows 3 codes per email per 15 minutes
// (middleware/rateLimits.js). An attacker therefore gets at most 3 x 5 = 15 guesses
// per email per 15 minutes, a 15 / 10^6 chance of success.
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

const normaliseEmail = (email) => String(email || '').trim().toLowerCase();

const hashCode = (email, code) =>
  crypto.createHash('sha256').update(`${normaliseEmail(email)}:${String(code)}`).digest();

export const generateOtp = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

// Replaces any earlier code for this email and returns the new plain code, which
// is only ever sent by email.
export const issueOtp = async (email) => {
  const normalised = normaliseEmail(email);
  const code = generateOtp();
  await Otp.deleteMany({ email: normalised });
  await Otp.create({
    email: normalised,
    otpHash: hashCode(normalised, code).toString('hex'),
    attempts: 0,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });
  return code;
};

// Checks a code and deletes it on success, so it works once. Every check uses up
// one attempt first (one atomic update), so parallel guesses cannot exceed the limit.
export const consumeOtp = async (email, code) => {
  const normalised = normaliseEmail(email);
  const now = new Date();

  const record = await Otp.findOneAndUpdate(
    { email: normalised, expiresAt: { $gt: now }, attempts: { $lt: OTP_MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { new: true }
  );

  if (!record) {
    const stale = await Otp.findOneAndDelete({ email: normalised });
    if (stale && stale.expiresAt <= now) {
      throw new AppError('OTP has expired. Please request a new one.', 400, 'OTP_EXPIRED');
    }
    throw new AppError('Invalid or expired OTP. Please request a new code.', 400, 'OTP_INVALID');
  }

  const expected = Buffer.from(record.otpHash, 'hex');
  const given = hashCode(normalised, code);
  const match = expected.length === given.length && crypto.timingSafeEqual(expected, given);

  if (match) {
    // deletedCount guards against two parallel requests both using one correct code.
    const { deletedCount } = await Otp.deleteOne({ _id: record._id });
    if (deletedCount === 1) return true;
    throw new AppError('Invalid or expired OTP. Please request a new code.', 400, 'OTP_INVALID');
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: record._id });
    throw new AppError('Too many wrong codes. Please request a new code.', 429, 'OTP_LOCKED');
  }
  throw new AppError('Invalid or expired OTP', 400, 'OTP_INVALID');
};
