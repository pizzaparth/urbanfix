// Mirrors backend/constants/wards.js — the app bundle can't import from the
// backend, so keep the two in sync by hand. Ten is what the live data uses.
export const WARDS = Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`);
