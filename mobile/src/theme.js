// The app's design tokens — the single source of truth for color, spacing,
// radius and type. RN has no cascade, so these live here as plain values and
// get pulled into StyleSheet.create calls.
//
// Two deliberate divergences from the web tokens:
//   - the clamp() type sizes collapse to fixed phone sizes (no viewport math in RN)
//   - spacing/radii are numbers, not px strings

export const color = {
  // Monochrome scale, near-black to white
  gray950: '#0A0A0A',
  gray900: '#111111',
  gray850: '#161616',
  gray800: '#1F1F1F',
  gray750: '#272727',
  gray600: '#3F3F3F',
  gray500: '#6E6E6E',
  gray400: '#8C8C8C',
  gray300: '#ADADAD',
  gray100: '#E4E4E4',
  gray50: '#FAFAFA',
  white: '#FFFFFF',

  // The one accent color
  accent: '#3B82F6',
  accentHover: '#60A5FA',
  accentWash: 'rgba(59, 130, 246, 0.12)',
  accentBorder: 'rgba(59, 130, 246, 0.4)',

  // Navbar CTA one-off, carried over for the tab-bar CTA
  navCtaBg: '#1D4ED8',
  navCtaBgHover: '#2563EB',

  // Semantic status tokens: icon/text/border color only, never a filled chip background
  statusPending: '#C9A227',
  statusProgress: '#3B82F6',
  statusResolved: '#22C55E',
  statusRejected: '#EF5A5A',

  // Surfaces
  bg: '#0A0A0A',
  surface: '#111111',
  surfaceRaised: '#161616',
  border: '#1F1F1F',
  borderStrong: '#272727',

  // Text
  textPrimary: '#FAFAFA',
  textSecondary: '#ADADAD',
  textMuted: '#6E6E6E',
};

// Status name -> color, keyed by the exact strings the API returns.
export const statusColor = {
  Pending: color.statusPending,
  'In Progress': color.statusProgress,
  Resolved: color.statusResolved,
  Rejected: color.statusRejected,
};

// 4px base scale. Indexed so `space[4]` reads the same as `var(--space-4)` did.
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
  8: 64,
  9: 96,
};

// Sharp/minimal, no pill radius token
export const radius = {
  sm: 2,
  md: 4,
  lg: 6,
};

// The web app loaded variable woff2 files via @font-face; RN doesn't support
// variable fonts, so each weight is a separate static face. These keys are the
// export names from @expo-google-fonts/geist, which become the family names once
// useFonts() has loaded them.
export const font = {
  sans: 'Geist_400Regular',
  sansMedium: 'Geist_500Medium',
  sansSemibold: 'Geist_600SemiBold',
  sansBold: 'Geist_700Bold',
  mono: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium',
};

// The web scale used clamp() for display/h1; on a phone those resolve to fixed sizes.
export const text = {
  display: 34,
  h1: 27,
  h2: 22,
  h3: 18,
  body: 15,
  small: 13,
  monoMd: 13,
  monoSm: 12,
};

// Motion: deliberately minimal (was --transition-fast / --transition-base)
export const motion = {
  fast: 120,
  base: 160,
};

export default { color, statusColor, space, radius, font, text, motion };
