// Ten wards is what the live data already uses (53 of 54 seeded/real complaints
// start with "Ward <n>"). Mirrored in mobile/src/constants/wards.js — keep the
// two in sync by hand, the app bundle can't import from here.
export const WARDS = Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`);

// Matches the "Ward 7, ..." prefix used by seeded locations.
export const WARD_PREFIX = /^\s*Ward\s+(\d+)\b/i;

export const wardFromLocation = (location = '') => {
  const m = WARD_PREFIX.exec(location);
  if (!m) return null;
  const ward = `Ward ${parseInt(m[1], 10)}`;
  return WARDS.includes(ward) ? ward : null;
};
