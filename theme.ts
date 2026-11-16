export const theme = {
  bg: '#F4F2EA',
  card: '#FFFFFF',
  ink: '#141414',
  sub: '#6E6A5E',
  line: '#E4E1D6',
  accent: '#F2E23C',
  accentSoft: '#FBF7C9',
  accentInk: '#141414',
  danger: '#C8402F',
  radius: 14,
  gap: 8,
} as const;

export const typo = {
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.4 },
  h2: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  small: { fontSize: 12, fontWeight: '600' as const },
  mono: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.6 },
};
