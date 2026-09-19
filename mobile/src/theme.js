// UrbanFix mobile theme based on UrbanFix.dc.html

export const color = {
  // UrbanFix core colors
  accent: '#FF5FA2',
  accentHover: '#FFA3C8',

  // Status colors
  statusPending: '#FFB86B',
  statusProgress: '#C08BFF',
  statusResolved: '#4ADE9B',
  statusRejected: '#FF5A7A',
  
  // Urgency colors
  urgencyHigh: '#FF5A7A',
  urgencyMedium: '#FFB86B',
  urgencyStandard: '#4ADE9B',

  // Surfaces
  bg: '#000000',
  surface: '#120E13',
  surfaceRaised: '#1C0F15',
  border: '#2C222B',
  borderStrong: '#231B22',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B5A8B2',
  textMuted: '#8E8290',
  
  // Specific
  danger: '#FF5A7A',
  success: '#4ADE9B',
  white: '#FFFFFF',
  
  // Backwards compatibility for ui.jsx
  gray950: '#0A0A0A',
  gray900: '#171717',
  gray50: '#FAFAFA',
  accentWash: 'rgba(255, 95, 162, 0.1)',
  navCtaBg: '#FFFFFF',
  navCtaBgHover: '#F5F5F5',
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
  bg: '#000000',
  surface: '#120E13',
  surfaceSunken: '#0D0A0D',
  surfaceInput: '#1A141A',
  border: '#231B22',
  borderStrong: '#2C222B',
  borderDashed: '#3B2E3A',

  text: '#FFFFFF',
  muted: '#B5A8B2',
  dim: '#8E8290',
  faint: '#978A95',
  body: '#D2C6CE',
  placeholder: '#6B5F68',

  accent: '#FF5FA2',
  accentInk: '#1C0512',
  accentSoft: '#FFA3C8',
  secondary: '#C08BFF',

  dangerFill: '#7E1038',
  dangerBorder: '#B02159',
  errorBg: '#1C0F15',
};

export const statusColors = {
  Pending: '#FFB86B',
  'In Progress': '#C08BFF',
  Resolved: '#4ADE9B',
  Rejected: '#FF5A7A',
};

// The API returns urgency as "High Urgency" / "Medium Urgency" / "Standard
// Urgency"; the reference app used the bare word. Both keys are present so
// either shape resolves to a colour.
export const urgencyColors = {
  Standard: '#4ADE9B',
  Medium: '#FFB86B',
  High: '#FF5A7A',
  'Standard Urgency': '#4ADE9B',
  'Medium Urgency': '#FFB86B',
  'High Urgency': '#FF5A7A',
};

// Deliberately distinct from the UI palette so data never reads as chrome.
export const chartPalette = ['#C08BFF', '#7BE0D6', '#FFC77D', '#FF8FC7'];
export const chartUrgency = {
  High: '#FF8FC7',
  Medium: '#FFC77D',
  Standard: '#7BE0D6',
  'High Urgency': '#FF8FC7',
  'Medium Urgency': '#FFC77D',
  'Standard Urgency': '#7BE0D6',
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
