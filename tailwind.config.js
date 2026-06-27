/** @type {import('tailwindcss').Config} */

// Colors are intentionally NOT hardcoded here. Every value reads from a CSS
// custom property defined in src/index.css (and seeded by src/config/theme.ts),
// so the whole palette can be re-skinned from one place without touching JSX.
const withVar = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand (red family)
        brand: {
          DEFAULT: withVar('--color-brand'),
          strong: withVar('--color-brand-strong'),
          soft: withVar('--color-brand-soft'),
        },
        // Surfaces (black/charcoal family)
        surface: {
          base: withVar('--color-surface-base'),
          raised: withVar('--color-surface-raised'),
          overlay: withVar('--color-surface-overlay'),
          sunken: withVar('--color-surface-sunken'),
        },
        // Text / content
        content: {
          primary: withVar('--color-content-primary'),
          secondary: withVar('--color-content-secondary'),
          muted: withVar('--color-content-muted'),
          inverse: withVar('--color-content-inverse'),
          'on-brand': withVar('--color-content-on-brand'),
        },
        line: {
          DEFAULT: withVar('--color-line'),
          strong: withVar('--color-line-strong'),
        },
        state: {
          success: withVar('--color-success'),
          warning: withVar('--color-warning'),
          danger: withVar('--color-danger'),
        },
        // Top-level aliases so bg-success / text-success / etc. work directly
        success: withVar('--color-success'),
        warning: withVar('--color-warning'),
        danger:  withVar('--color-danger'),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '0.875rem',
      },
      boxShadow: {
        panel: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 8px 24px -8px rgb(0 0 0 / 0.12)',
        brand: '0 12px 30px -10px rgb(var(--color-brand) / 0.35)',
      },
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, rgb(var(--color-brand)) 0%, rgb(var(--color-brand-strong)) 100%)',
        'brand-sheen':
          'radial-gradient(120% 120% at 0% 0%, rgb(var(--color-brand) / 0.06) 0%, transparent 55%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
