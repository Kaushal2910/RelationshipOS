/** @type {import('tailwindcss').Config} */
// Tokens from version1/DESIGN.md + UI_UX_Brief.md §10. Colors resolve from CSS
// variables in global.css so semantic classes auto-switch light/dark (darkMode: 'media').
const withOpacity = (name) => `rgb(var(${name}) / <alpha-value>)`;

module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: withOpacity('--color-primary'),
          pressed: withOpacity('--color-primary-pressed'),
          soft: withOpacity('--color-primary-soft'),
        },
        secondary: {
          DEFAULT: withOpacity('--color-secondary'),
          soft: withOpacity('--color-secondary-soft'),
        },
        like: withOpacity('--color-like'),
        pass: withOpacity('--color-pass'),
        warning: withOpacity('--color-warning'),
        info: withOpacity('--color-info'),
        bg: withOpacity('--color-bg'),
        surface: withOpacity('--color-surface'),
        'surface-alt': withOpacity('--color-surface-alt'),
        border: withOpacity('--color-border'),
        overlay: withOpacity('--color-overlay'),
        text: {
          DEFAULT: withOpacity('--color-text'),
          muted: withOpacity('--color-text-muted'),
          subtle: withOpacity('--color-text-subtle'),
        },
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        card: '20px',
        pill: '9999px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        base: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      // Distinct family per weight (RN doesn't synthesize weights for custom fonts).
      // Keys avoid Tailwind's font-weight utility names (medium/semibold/bold).
      fontFamily: {
        sans: ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
        display: ['Fraunces_700Bold'],
      },
      fontSize: {
        display: ['34px', { lineHeight: '40px', fontWeight: '700' }],
        h1: ['28px', { lineHeight: '34px', fontWeight: '700' }],
        h2: ['22px', { lineHeight: '28px', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '24px', fontWeight: '600' }],
        body: ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-strong': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        label: ['14px', { lineHeight: '20px', fontWeight: '500' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '500' }],
        overline: ['11px', { lineHeight: '14px', fontWeight: '600', letterSpacing: '0.05em' }],
      },
      boxShadow: {
        e1: '0 1px 3px rgba(34, 24, 28, 0.06)',
        e2: '0 4px 20px rgba(34, 24, 28, 0.08)',
        e3: '0 -4px 24px rgba(34, 24, 28, 0.12)',
      },
    },
  },
  plugins: [],
};
