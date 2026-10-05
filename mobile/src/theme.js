// UrbanFix mobile theme based on UrbanFix.dc.html — light mode.
// The original palette was dark (pure black canvas, white text); this is its
// inversion. Status, urgency and chart hues are darker steps of the same
// colours so they stay legible as text and thin strokes on white.

export const color = {
  // UrbanFix core colors
  accent: '#FF5FA2',
  accentHover: '#E84D8F',

  // Status colors
  statusPending: '#C2700F',
  statusProgress: '#8B4FD8',
  statusResolved: '#16935A',
  statusRejected: '#E0234E',
  
  // Urgency colors
  urgencyHigh: '#E0234E',
  urgencyMedium: '#C2700F',
  urgencyStandard: '#16935A',

  // Surfaces
  bg: '#FFFFFF',
  surface: '#F7F2F5',
  surfaceRaised: '#FBEDF3',
  border: '#DDD1D9',
  borderStrong: '#E8DFE4',

  // Text
  textPrimary: '#000000',
  textSecondary: '#5C505A',
  textMuted: '#776B75',
  
  // Specific
  danger: '#E0234E',
  success: '#16935A',
  white: '#FFFFFF',
  
  // Backwards compatibility for ui.jsx
  gray950: '#0A0A0A',
  gray900: '#F1ECEF',
  gray50: '#FAFAFA',
  accentWash: 'rgba(255, 95, 162, 0.1)',
  navCtaBg: '#000000',
  navCtaBgHover: '#1F1A1E',
};

export const statusColor = {
  Pending: color.statusPending,
  'In Progress': color.statusProgress,
  Resolved: color.statusResolved,
  Rejected: color.statusRejected,
};

// Simplified spacing scale
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 48,
  9: 64,
};

// UrbanFix relies on very rounded corners
export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const font = {
  sans: 'PlusJakartaSans_400Regular',
  sansMedium: 'PlusJakartaSans_500Medium',
  sansSemibold: 'PlusJakartaSans_600SemiBold',
  sansBold: 'SpaceGrotesk_700Bold',
  mono: 'PlusJakartaSans_400Regular',
  monoMedium: 'PlusJakartaSans_500Medium',
};

export const text = {
  display: 46,
  h1: 38,
  h2: 30,
  h3: 24,
  body: 16,
  small: 13,
  monoMd: 13,
  monoSm: 11,
};

export const motion = {
  fast: 120,
  base: 180,
};

// ---------------------------------------------------------------------------
// UrbanFix tokens, carried over verbatim from inspiration/src/theme.js.
//
// The `color`/`font` exports above keep their original names so the screens that
// haven't been restyled yet still compile; these are the names the ported
// UrbanFix components use. Both sets describe the same palette — this one is
// just complete, with the surface and chart values the original theme dropped.
// ---------------------------------------------------------------------------
export const colors = {
  bg: '#FFFFFF',
  surface: '#F7F2F5',
  surfaceSunken: '#F2ECEF',
  surfaceInput: '#F4EEF2',
  border: '#E8DFE4',
  borderStrong: '#DDD1D9',
  borderDashed: '#CBBDC6',

  text: '#000000',
  muted: '#5C505A',
  dim: '#776B75',
  faint: '#7A6E78',
  body: '#3A2F38',
  placeholder: '#9C909A',

  accent: '#FF5FA2',
  accentInk: '#1C0512',
  accentSoft: '#FFA3C8',
  secondary: '#8B4FD8',

  dangerFill: '#FFE3EC',
  dangerBorder: '#E0234E',
  errorBg: '#FFF0F4',
  success: '#16935A',
  danger: '#E0234E',
};

export const statusColors = {
  Pending: color.statusPending,
  'In Progress': color.statusProgress,
  Resolved: color.statusResolved,
  Rejected: color.statusRejected,
};

// The API returns urgency as "High Urgency" / "Medium Urgency" / "Standard
// Urgency"; the reference app used the bare word. Both keys are present so
// either shape resolves to a colour.
export const urgencyColors = {
  Standard: color.urgencyStandard,
  Medium: color.urgencyMedium,
  High: color.urgencyHigh,
  'Standard Urgency': color.urgencyStandard,
  'Medium Urgency': color.urgencyMedium,
  'High Urgency': color.urgencyHigh,
};

// Deliberately distinct from the UI palette so data never reads as chrome.
export const chartPalette = ['#8B4FD8', '#0F9E91', '#D98A10', '#E0478F'];
export const chartUrgency = {
  High: '#E0478F',
  Medium: '#D98A10',
  Standard: '#0F9E91',
  'High Urgency': '#E0478F',
  'Medium Urgency': '#D98A10',
  'Standard Urgency': '#0F9E91',
};

// The reference app's radius/space scales. They are NOT the same numbers as the
// `radius`/`space` exports above (its lg is 28, this project's lg is 22), so the
// ported components use these to stay pixel-accurate rather than silently
// rounding a card 6px less than the design.
export const ufRadius = { sm: 14, md: 22, lg: 28, xl: 38, pill: 100 };
export const ufSpace = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30 };

// Space Grotesk for display, Plus Jakarta for body — the reference app's names.
export const uf = {
  display: 'SpaceGrotesk_700Bold',
  displayMed: 'SpaceGrotesk_600SemiBold',
  body: 'PlusJakartaSans_500Medium',
  bodyBold: 'PlusJakartaSans_700Bold',
};

export default { color, statusColor, space, radius, font, text, motion };
