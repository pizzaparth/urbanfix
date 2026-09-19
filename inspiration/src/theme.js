// UrbanFix design tokens — AMOLED black ground, feminine accent set.
// No gradients anywhere; no tinted pills. Solid fills or transparent + border only.

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
  'Pending': '#FFB86B',
  'In Progress': '#C08BFF',
  'Resolved': '#4ADE9B',
  'Rejected': '#FF5A7A',
};

export const urgencyColors = {
  Standard: '#4ADE9B',
  Medium: '#FFB86B',
  High: '#FF5A7A',
};

// Deliberately distinct from the UI palette so data never reads as chrome.
export const chartPalette = ['#C08BFF', '#7BE0D6', '#FFC77D', '#FF8FC7'];
export const chartUrgency = { High: '#FF8FC7', Medium: '#FFC77D', Standard: '#7BE0D6' };

export const font = {
  display: 'SpaceGrotesk_700Bold',
  displayMed: 'SpaceGrotesk_600SemiBold',
  body: 'PlusJakartaSans_500Medium',
  bodyBold: 'PlusJakartaSans_700Bold',
};

export const radius = { sm: 14, md: 22, lg: 28, xl: 38, pill: 100 };
export const space = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30 };
