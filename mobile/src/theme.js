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

export default { color, statusColor, space, radius, font, text, motion };
