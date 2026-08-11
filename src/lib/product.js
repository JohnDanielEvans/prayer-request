/**
 * Naming, in one place.
 *
 * The working name is deliberately plain and is not yet a brand. Everything
 * user-visible and every code sample in the demo reads from here, so renaming
 * later means editing this file plus the CSS prefix noted below.
 *
 * Not centralizable here, for the record:
 *   - the `si-` CSS Module class prefix (vite.config.js `generateScopedName`)
 *   - the `--si-` custom property prefix (src/widget/widget.module.css)
 *   - the `data-intake-widget` attribute (src/embed.jsx)
 */
export const PRODUCT_NAME = 'Smart Intake';
export const PACKAGE_NAME = 'smart-intake-widget';

/** Global the script-tag build attaches to `window`. */
export const EMBED_GLOBAL = 'SmartIntake';

/** Default localStorage key. Versioned so a schema change can't read old rows. */
export const STORAGE_KEY = 'smart-intake:v1';
