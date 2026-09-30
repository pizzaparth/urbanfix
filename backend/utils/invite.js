import crypto from 'crypto';

export const INVITE_TTL_MS = 72 * 60 * 60 * 1000; // 72h

const hash = (token) => crypto.createHash('sha256').update(token).digest('hex');
export const hashInviteToken = hash;

// Only the hash is persisted; the raw token exists only in the email.
export const generateInvite = () => {
  const token = crypto.randomBytes(24).toString('hex');
  return { token, hashed: hash(token), expires: new Date(Date.now() + INVITE_TTL_MS) };
};

// The account is unusable until the invite is redeemed, so it gets a random
// password nobody knows (and login is additionally blocked by mustSetPassword).
export const unusablePassword = () => crypto.randomBytes(24).toString('base64url');
