/**
 * Theming is CSS custom properties on the widget root -- never on :root, never
 * on body. A host page keeps its own styles; the widget keeps its own colors.
 *
 * Override any of these from the host stylesheet:
 *
 *   .my-wrapper .si-widget { --si-accent: #7c3aed; --si-radius: 4px; }
 */
const RADII = { sm: '6px', md: '12px', lg: '18px', xl: '26px' };

export function buildThemeVars({ accent, radius, fontFamily, maxWidth } = {}) {
  const vars = {};

  if (accent) {
    vars['--si-accent'] = accent;
    // Derive the hover shade in-browser rather than asking for two props.
    vars['--si-accent-strong'] = `color-mix(in srgb, ${accent} 82%, black)`;
    vars['--si-accent-soft'] = `color-mix(in srgb, ${accent} 14%, transparent)`;
  }
  if (radius) vars['--si-radius'] = RADII[radius] ?? radius;
  if (fontFamily) vars['--si-font'] = fontFamily;
  if (maxWidth) {
    vars['--si-max-width'] =
      typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;
  }

  return vars;
}

/** Per-category color, derived from the category's hue and the active theme. */
export function categoryVars(category) {
  if (!category) return {};
  return { '--si-cat-hue': String(category.hue ?? 220) };
}

/**
 * Priority uses a fixed four-step ramp rather than per-category hues: "high"
 * has to look the same whatever bucket it lands in, or the badge stops being
 * scannable at a glance.
 */
const PRIORITY_HUES = { low: 215, normal: 195, high: 32, urgent: 0 };

export function priorityVars(priority) {
  return {
    '--si-pri-hue': String(PRIORITY_HUES[priority] ?? PRIORITY_HUES.normal),
  };
}
