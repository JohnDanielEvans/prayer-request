import { CategorizeError, postJson } from '../http.js';
import { matchCategory, normalizeConfidence } from '../normalize.js';

/**
 * The provider you should ship.
 *
 * The widget posts to an endpoint you own; your server holds the API key and
 * talks to the model. Nothing secret reaches the browser, you can rate-limit
 * and log on your terms, and you can swap models without redeploying the
 * front end. See server/ for a zero-dependency reference implementation.
 *
 * Request:  { text, categories: [{ id, label, description }] }
 * Response: { category, confidence?, summary? }
 */
export function createEndpointProvider({ url, headers, credentials, retries } = {}) {
  if (!url) {
    throw new CategorizeError(
      'The "endpoint" provider needs an `endpoint` URL prop.'
    );
  }

  return async function categorize({ text, categories, signal }) {
    const payload = await postJson(
      url,
      {
        text,
        categories: categories.map(({ id, label, description }) => ({
          id,
          label,
          description,
        })),
      },
      { headers, credentials, signal, retries }
    );

    const category = matchCategory(
      payload?.category ?? payload?.categoryId ?? payload?.label,
      categories
    );

    return {
      categoryId: category.id,
      confidence: normalizeConfidence(payload?.confidence),
      summary: typeof payload?.summary === 'string' ? payload.summary : null,
      provider: 'endpoint',
    };
  };
}
