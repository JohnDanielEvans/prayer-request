import { ClassificationError, postJson } from '../http.js';
import { parseJsonLoose } from '../normalize.js';
import { buildSystemPrompt, toClassification } from './shared.js';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Calls OpenAI straight from the browser.
 *
 * Local development only. A key in front-end code is readable by anyone who
 * opens devtools or the network tab on your deployed site, and it bills you.
 * Use `provider="endpoint"` in production -- see server/.
 */
export function createOpenAIProvider({ apiKey, model = 'gpt-4o-mini', retries } = {}) {
  if (!apiKey) {
    throw new ClassificationError(
      'The "openai" provider needs an `apiKey`. Set VITE_OPENAI_API_KEY in .env, or switch to provider="endpoint".'
    );
  }

  if (typeof window !== 'undefined' && !hasWarned) {
    hasWarned = true;
    console.warn(
      '[smart-intake] provider="openai" exposes your API key to every visitor. ' +
        'Use provider="endpoint" with the proxy in server/ before deploying.'
    );
  }

  return async function classify({ text, categories, signal }) {
    const payload = await postJson(
      OPENAI_URL,
      {
        model,
        // Deterministic: the same message should not land in two categories on
        // two submissions.
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildSystemPrompt(categories) },
          { role: 'user', content: text },
        ],
      },
      { headers: { Authorization: `Bearer ${apiKey}` }, signal, retries }
    );

    const content = payload?.choices?.[0]?.message?.content;

    // Even with response_format json_object, the parse is defensive: the field
    // can be missing on a refusal or a truncated response.
    return toClassification({
      raw: parseJsonLoose(content) ?? { category: content },
      text,
      categories,
      provider: 'openai',
    });
  };
}

let hasWarned = false;

export { buildSystemPrompt };
