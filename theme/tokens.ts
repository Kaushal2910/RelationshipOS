/**
 * JS-side mirror of the design tokens (hex) for the rare cases NativeWind classes
 * can't reach: StatusBar style, gradient stops, blurhash placeholders, native props.
 * Canonical source: version1/DESIGN.md. Keep in sync with global.css.
 * In components, PREFER NativeWind classes (bg-surface, text-text) over these.
 */
export const lightTokens = {
  primary: '#E4557B',
  primaryPressed: '#C8436A',
  primarySoft: '#FBE3EA',
  secondary: '#6C5CE7',
  secondarySoft: '#ECEAFB',
  like: '#2FBF71',
  pass: '#F0616D',
  warning: '#E0A32E',
  info: '#3B82F6',
  bg: '#FDF8F6',
  surface: '#FFFFFF',
  surfaceAlt: '#F5EEEB',
  border: '#ECE2DE',
  text: '#22181C',
  textMuted: '#6E6167',
  textSubtle: '#9A8E93',
  overlay: 'rgba(34,24,28,0.55)',
} as const;

export const darkTokens = {
  ...lightTokens,
  primary: '#F06E8F',
  primaryPressed: '#D85C7D',
  primarySoft: '#40222C',
  secondarySoft: '#2A2540',
  bg: '#161114',
  surface: '#211A1E',
  surfaceAlt: '#2B2227',
  border: '#3A2F35',
  text: '#F5ECEF',
  textMuted: '#B7A9AF',
  textSubtle: '#8A7D83',
  overlay: 'rgba(0,0,0,0.6)',
} as const;

export type ThemeTokens = Record<keyof typeof lightTokens, string>;

export const tokensFor = (scheme: 'light' | 'dark' | null | undefined): ThemeTokens =>
  scheme === 'dark' ? darkTokens : lightTokens;
