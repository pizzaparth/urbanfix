// Chart.js configs need literal values, not CSS custom properties — these
// mirror the tokens defined in src/styles/tokens.css.
export const CHART_COLORS = {
  grid: '#1F1F1F',
  border: '#272727',
  textMuted: '#6E6E6E',
  textSecondary: '#8C8C8C',
  textPrimary: '#E4E4E4',
  surfaceRaised: '#161616',
  accent: '#3B82F6',
  gray400: '#8C8C8C',
  gray500: '#6E6E6E',
  statusPending: '#C9A227',
  statusProgress: '#3B82F6',
  statusResolved: '#22C55E',
  statusRejected: '#EF5A5A',
};

export const CHART_FONT_SANS = 'Geist Sans';
export const CHART_FONT_MONO = 'Geist Mono';

// Fixed identity order for category-breakdown charts — the accent leads,
// the rest step down through the neutral scale. Kept short and monochrome
// on purpose (see "the one accent color" in tokens.css); slices are never
// told apart by hue alone, so every consumer must pair this with a
// always-visible label (legend row, direct label), never color alone.
export const CHART_CATEGORY_COLORS = [
  '#3B82F6', // accent
  '#E4E4E4', // gray-100
  '#6E6E6E', // gray-500
  '#60A5FA', // accent-hover
  '#ADADAD', // gray-300
  '#8C8C8C', // gray-400
];

export const getCategoryColor = (index) => CHART_CATEGORY_COLORS[index % CHART_CATEGORY_COLORS.length];

// Sequential ramp for the activity heatmap — magnitude, not identity, so it's
// a single hue (the accent) at monotone lightness, not the categorical set
// above. Level 0 is neutral (no activity, not part of the hue ramp, same
// idea as GitHub's own empty-cell gray). Levels 1-4 blend the accent toward
// --surface-raised (#161616) at increasing intensity.
export const HEATMAP_LEVEL_COLORS = [
  '#1F1F1F', // level 0 — no activity (gray-800)
  '#213659', // level 1
  '#2A5191', // level 2
  '#336AC5', // level 3
  '#3B82F6', // level 4 — full accent, max activity
];

// Bucket a raw day count into a 0-4 heatmap level relative to the max count
// in the current window. Guarded against maxCount <= 0 (all-zero window).
export const getHeatmapLevel = (count, maxCount) => {
  if (!count || count <= 0 || !maxCount || maxCount <= 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
};
