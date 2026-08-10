/**
 * Public API for React consumers.
 *
 *   import { PrayerRequestWidget } from 'prayer-request-widget';
 *   import 'prayer-request-widget/styles.css';
 */
export { PrayerRequestWidget, default } from './widget/PrayerRequestWidget.jsx';

// Headless: bring your own UI, keep the categorization, retry, and persistence.
export { usePrayerRequests } from './lib/usePrayerRequests.js';

// Providers, for custom or additional backends.
export {
  resolveProvider,
  createMockProvider,
  createEndpointProvider,
  createOpenAIProvider,
} from './lib/providers/index.js';

// Categories and the prompt, so a server can classify exactly as the client does.
export {
  DEFAULT_CATEGORIES,
  FALLBACK_CATEGORY_ID,
  resolveCategories,
} from './lib/categories.js';
export { buildSystemPrompt } from './lib/providers/openai.js';
export { matchCategory, scoreCategories } from './lib/normalize.js';
export { CategorizeError } from './lib/http.js';
