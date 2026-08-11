/**
 * Public API for React consumers.
 *
 *   import { IntakeWidget } from 'smart-intake-widget';
 *   import 'smart-intake-widget/styles.css';
 */
export { IntakeWidget, default } from './widget/IntakeWidget.jsx';

// Headless: bring your own UI, keep the classification, retry and persistence.
export { useIntake } from './lib/useIntake.js';

// Providers, for custom or additional classifiers.
export {
  resolveProvider,
  createMockProvider,
  createEndpointProvider,
  createOpenAIProvider,
  buildSystemPrompt,
  toClassification,
} from './lib/providers/index.js';

// Categories and presets.
export {
  DEFAULT_CATEGORIES,
  FALLBACK_CATEGORY_ID,
  resolveCategories,
  fallbackCategory,
} from './lib/categories.js';
export { PRESETS, DEFAULT_PRESET_ID, getPreset, presetProps } from './lib/presets.js';

// The classification schema, exported so a server can validate identically.
export {
  PRIORITIES,
  DEFAULT_PRIORITY,
  MAX_TAGS,
  normalizePriority,
  normalizeTags,
  normalizeConfidence,
  maxPriority,
} from './lib/classification.js';
export {
  matchCategory,
  scoreCategories,
  extractTags,
  detectUrgency,
  resolvePriority,
} from './lib/normalize.js';

export { ClassificationError } from './lib/http.js';
export { PRODUCT_NAME, PACKAGE_NAME } from './lib/product.js';
