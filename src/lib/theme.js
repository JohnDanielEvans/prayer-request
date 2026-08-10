/**
 * Theming is CSS custom properties on the widget root -- never on :root, never
 * on body. A host page keeps its own styles; the widget keeps its own colors.
 *
 * Override any of these from the host stylesheet:
 *
 *   .my-wrapper .prw-widget { --prw-accent: #7c3aed; --prw-radius: 4px; }
 */
const RADII = { sm: '6px', md: '12px', lg: '18px', xl: '26px' };

export function buildThemeVars({ accent, radius, fontFamily, maxWidth } = {}) {
  const vars = {};

  if (accent) {
    vars['--prw-accent'] = accent;
    // Derive the hover shade in-browser rather than asking for two props.
    vars['--prw-accent-strong'] = `color-mix(in srgb, ${accent} 82%, black)`;
    vars['--prw-accent-soft'] = `color-mix(in srgb, ${accent} 14%, transparent)`;
  }
  if (radius) vars['--prw-radius'] = RADII[radius] ?? radius;
  if (fontFamily) vars['--prw-font'] = fontFamily;
  if (maxWidth) {
    vars['--prw-max-width'] =
      typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;
  }

  return vars;
}

/** Per-category color, derived from the category's hue and the active theme. */
export function categoryVars(category) {
  if (!category) return {};
  return { '--prw-cat-hue': String(category.hue ?? 220) };
}
