import { createMockProvider } from './mock.js';
import { createEndpointProvider } from './endpoint.js';
import { createOpenAIProvider } from './openai.js';

export { createMockProvider, createEndpointProvider, createOpenAIProvider };
export { buildSystemPrompt, toClassification } from './shared.js';

/**
 * Turns the `provider` prop into a classify function.
 *
 * Accepts a name, or your own async function --
 * `async ({ text, categories, signal }) => ClassificationResult` -- so you can
 * wire in Anthropic, a local model, or an existing internal classifier without
 * touching the UI. Custom functions should return their result through
 * `toClassification()` so they get the same validation as the built-ins.
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
    case 'offline':
    default:
      return createMockProvider({ latency: options.latency });
  }
}
