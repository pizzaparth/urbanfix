import User from '../models/User.js';
import { sendAccessExpiringEmail } from './emailService.js';

const SIX_HOURS = 6 * 60 * 60 * 1000;
const NOTICE_WINDOW = 3 * 24 * 60 * 60 * 1000; // 3 days

// Emails a researcher once, when their access is 3 days from ending. A plain
// interval is enough here: one process, one notice per researcher, and the
// `expiryNoticeSentAt` marker makes a restart harmless.
export const runExpiryNotices = async () => {
  const now = new Date();
  const due = await User.find({
    role: 'researcher',
    isActive: { $ne: false },
    'researcher.accessExpiresAt': { $gt: now, $lte: new Date(now.getTime() + NOTICE_WINDOW) },
    'researcher.expiryNoticeSentAt': null,
  });

  for (const user of due) {
    await sendAccessExpiringEmail(user.email, user.name, user.researcher.accessExpiresAt);
    user.researcher.expiryNoticeSentAt = new Date();
    await user.save({ validateBeforeSave: false });
  }
  return due.length;
};

export const startExpiryJob = () => {
  if (process.env.DISABLE_JOBS === 'true') return;
  const tick = () =>
    runExpiryNotices().catch((err) => console.error('Expiry notice job failed:', err.message));
  setTimeout(tick, 30 * 1000).unref(); // shortly after boot, once Mongo is up
  setInterval(tick, SIX_HOURS).unref();
};
