import { ClassificationError, postJson } from '../http.js';
import { toClassification } from './shared.js';

/**
 * The provider you should ship.
 *
 * The widget posts to an endpoint you own; your server holds the API key and
 * talks to the model. Nothing secret reaches the browser, you can rate-limit
 * and log on your terms, and you can swap models without redeploying the front
 * end. See server/ for two working implementations.
 *
 * Request:  { text, categories: [{ id, label, description }] }
 * Response: { category, priority?, tags?, confidence?, summary? }
 *
 * The response is validated client-side as well as server-side -- your endpoint
 * is trusted infrastructure, but the model behind it still isn't.
 */
export function createEndpointProvider({ url, headers, credentials, retries } = {}) {
  if (!url) {
    throw new ClassificationError(
      'The "endpoint" provider needs an `endpoint` URL prop.'
    );
  }

  return async function classify({ text, categories, signal }) {
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

    return toClassification({
      raw: payload,
      text,
      categories,
      provider: 'endpoint',
    });
  };
}
