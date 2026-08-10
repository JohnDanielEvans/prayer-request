import { createMockProvider } from './mock.js';
import { createEndpointProvider } from './endpoint.js';
import { createOpenAIProvider } from './openai.js';

export { createMockProvider, createEndpointProvider, createOpenAIProvider };

/**
 * Turns the `provider` prop into a categorize function.
 *
 * Accepts a name, or your own async function -- `(({ text, categories, signal })
 * => ({ categoryId, confidence, summary }))` -- so you can wire in Anthropic,
 * a local model, or an existing internal classifier without touching the UI.
 */
export function resolveProvider(provider, options = {}) {
  if (typeof provider === 'function') return provider;

  switch (provider) {
    case 'endpoint':
      return createEndpointProvider({
        url: options.endpoint,
        headers: options.headers,
        credentials: options.credentials,
        retries: options.retries,
      });
    case 'openai':
      return createOpenAIProvider({
        apiKey: options.apiKey,
        model: options.model,
        retries: options.retries,
      });
    case 'mock':
    default:
      return createMockProvider({ latency: options.latency });
  }
}
