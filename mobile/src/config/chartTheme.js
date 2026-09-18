// Chart color/axis config, pulled straight from theme.js so there's a single
// source of truth for color.
import { color } from '../theme.js';

export const CHART_COLORS = {
  grid: color.gray800,
  border: color.gray750,
  textMuted: color.gray500,
  textSecondary: color.gray400,
  textPrimary: color.gray100,
  surfaceRaised: color.surfaceRaised,
  accent: color.accent,
  gray400: color.gray400,
  gray500: color.gray500,
  statusPending: color.statusPending,
  statusProgress: color.statusProgress,
  statusResolved: color.statusResolved,
  statusRejected: color.statusRejected,
};

// Fixed identity order for category-breakdown charts — a genuinely categorical
// (multi-hue) palette, not tints/shades of the one accent color. This is a
// deliberate, scoped exception to "the one accent color" elsewhere in the app:
// with 10 issue categories shown simultaneously in one donut, a monochrome ramp
// made adjacent slices hard to tell apart at a glance.
//
// Slots 1-8 are a validated categorical set (dark-mode steps), checked against
// this app's actual dark surface (#111111) for lightness band, chroma floor,
// contrast, and CVD/normal-vision separation on the adjacent-pair list. Slots
// 9-10 (cyan, brown) extend the set for our 10-category taxonomy and pass the
// same adjacent-pair checks, but 10 simultaneous colors can't all clear pairwise
// separation against *every* other slot (a hard limit past ~3-4 categorical
// hues), so slices are never told apart by hue alone: every consumer pairs this
// with an always-visible label (legend row with name + count + percentage).
export const CHART_CATEGORY_COLORS = [
  '#3987E5', // blue
  '#D95926', // orange
  '#199E70', // aqua/teal-green
  '#C98500', // amber
  '#D55181', // magenta
  '#008300', // green
  '#9085E9', // violet
  '#E66767', // red
  '#0891B2', // cyan
  '#A8541A', // brown
];

export const getCategoryColor = (index) =>
  CHART_CATEGORY_COLORS[index % CHART_CATEGORY_COLORS.length];

// Sequential ramp for the activity heatmap — magnitude, not identity, so it's a
// single hue (the accent) at monotone lightness, not the categorical set above.
// Level 0 is neutral (no activity, not part of the hue ramp). Levels 1-4 blend
// the accent toward --surface-raised at increasing intensity.
export const HEATMAP_LEVEL_COLORS = [
  color.gray800, // level 0 — no activity
  '#213659', // level 1
  '#2A5191', // level 2
  '#336AC5', // level 3
  color.accent, // level 4 — full accent, max activity
];

// Bucket a raw day count into a 0-4 heatmap level relative to the max count in
// the current window. Guarded against maxCount <= 0 (all-zero window).
export const getHeatmapLevel = (count, maxCount) => {
  if (!count || count <= 0 || !maxCount || maxCount <= 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
};
