import crypto from 'crypto';

export const INVITE_TTL_MS = 72 * 60 * 60 * 1000; // 72h

const hash = (token) => crypto.createHash('sha256').update(token).digest('hex');
export const hashInviteToken = hash;

// Only the hash is persisted; the raw token exists only in the email.
export const generateInvite = () => {
  const token = crypto.randomBytes(24).toString('hex');
  return { token, hashed: hash(token), expires: new Date(Date.now() + INVITE_TTL_MS) };
};

// An account without a password of its own (a citizen who only files, or a staff
// member or researcher who has not redeemed the invite) gets a random marker
// instead. It is stored without bcrypt: hashing it at cost 12 blocked the event
// loop for about 250 ms on every first filing (F15), and a marker cannot be
// guessed or used to log in, because comparePassword refuses it outright. The
// validators reject any user-chosen password that starts with the prefix, so a
// real password is always hashed.
export const UNUSABLE_PREFIX = '!unusable:';
export const UNUSABLE_PATTERN = /^!unusable:[A-Za-z0-9_-]{32}$/;
export const unusablePassword = () => UNUSABLE_PREFIX + crypto.randomBytes(24).toString('base64url');
