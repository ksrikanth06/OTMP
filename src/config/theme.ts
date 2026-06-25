/**
 * Theme tokens — Etihad Rail colour palette.
 *
 * Values are stored as "R G B" triplets so they can be injected straight into
 * CSS custom properties and consumed by Tailwind via rgb(var(--token) / alpha).
 * Re-skinning the app means editing this file only.
 */

export type ThemeTokens = Record<string, string>;

export const themeTokens: ThemeTokens = {
  // Brand — Etihad Rail crimson red
  '--color-brand': '193 5 5', //  #C10505
  '--color-brand-strong': '155 4 4', //  #9B0404
  '--color-brand-soft': '243 230 221', //  #F3E6DD  warm sand (Etihad secondary)

  // Surfaces — warm whites and off-whites (light theme)
  '--color-surface-base': '255 255 255', //  #FFFFFF  app background
  '--color-surface-raised': '247 242 238', //  #F7F2EE  panels / cards
  '--color-surface-overlay': '240 235 230', //  #F0EBE6  popovers / hover
  '--color-surface-sunken': '242 242 242', //  #F2F2F2  insets / inputs

  // Content — near-black charcoal and warm greys
  '--color-content-primary': '47 48 52', //  #2F3034
  '--color-content-secondary': '102 102 102', //  #666666
  '--color-content-muted': '117 117 117', //  #757575
  '--color-content-inverse': '255 255 255', //  #FFFFFF
  '--color-content-on-brand': '255 255 255', //  #FFFFFF

  // Lines / borders
  '--color-line': '226 220 215', //  #E2DCD7  warm light border
  '--color-line-strong': '179 178 177', //  #B3B2B1

  // States
  '--color-success': '52 168 110', //  #34A86E
  '--color-warning': '214 158 46', //  #D69E2E
  '--color-danger': '193 5 5', //  #C10505
};

/**
 * Applies the tokens to the document root. Called once at startup so the
 * palette is available to every Tailwind utility that references a var.
 */
export const applyTheme = (tokens: ThemeTokens = themeTokens): void => {
  const root = document.documentElement;
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};
