/**
 * Iron design tokens: colors, radii, spacing, fonts and text styles.
 * Screens and components should use these instead of raw hex colors or font strings.
 */

const iron = {
  background: '#0D0D0F',
  surface: '#17171B',
  surfaceMuted: '#212127', // raised: stepper buttons, chips, icon tiles
  text: '#F4F4F5',
  mutedText: '#9A9AA3',
  placeholder: '#55555D',
  border: '#2A2A31',
  primary: '#F4F4F5', // neutral buttons (NOT lime: steppers use this today)
  onPrimary: '#0D0D0F',
  destructive: '#F87171',
  success: '#4ADE80',
  accent: '#C8F031', // ONLY for primary actions, the active tab and the week strip
  onAccent: '#0D0D0F',
  tabBar: '#121215',
  noteText: '#D4D4D8',
};

// The app is dark only, so there is a single flat palette (no light/dark variants).
export const Colors = iron;

// RIR effort scale, index = RIR (4 means 4+). Hot = hard, cool = easy.
export const RirColors = ['#F87171', '#FB923C', '#FACC15', '#4ADE80', '#60A5FA'] as const;
export const rirTint = (rir: number) => RirColors[Math.min(rir, 4)] + '1F'; // ~12% alpha row background
export const rirLabel = (rir: number) => (rir >= 4 ? '4+' : String(rir));

export const Radius = { sm: 8, md: 12, lg: 16, xl: 18, pill: 999 };
export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };

export const Fonts = {
  display: 'BarlowCondensed_700Bold',
  displaySemi: 'BarlowCondensed_600SemiBold',
};

// Text styles. Uppercase labels use letterSpacing in px (RN has no em): 0.14em x 11px ~ 1.5
export const Type = {
  hero: { fontFamily: Fonts.display, fontSize: 46, lineHeight: 46, textTransform: 'uppercase' },
  title: { fontFamily: Fonts.display, fontSize: 34, lineHeight: 36, textTransform: 'uppercase' },
  number: { fontFamily: Fonts.display, fontSize: 64, lineHeight: 64 },
  button: { fontFamily: Fonts.display, fontSize: 22, letterSpacing: 0.9, textTransform: 'uppercase' },
  cell: { fontFamily: Fonts.displaySemi, fontSize: 20 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' }, // color: mutedText
  body: { fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 13 },
} as const;
