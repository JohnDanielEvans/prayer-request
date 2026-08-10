import { CategorizeError, postJson } from '../http.js';
import { matchCategory, normalizeConfidence, parseJsonLoose } from '../normalize.js';

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
    throw new CategorizeError(
      'The "openai" provider needs an `apiKey`. Set VITE_OPENAI_API_KEY in .env, or switch to provider="endpoint".'
    );
  }

  if (typeof window !== 'undefined' && !hasWarned) {
    hasWarned = true;
    console.warn(
      '[prayer-request-widget] provider="openai" exposes your API key to every ' +
        'visitor. Use provider="endpoint" with the proxy in server/ before deploying.'
    );
  }

  return async function categorize({ text, categories, signal }) {
    const payload = await postJson(
      OPENAI_URL,
      {
        model,
        // Deterministic: the same request should not land in two buckets on
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
    const parsed = parseJsonLoose(content) ?? {};
    const category = matchCategory(parsed.category ?? content, categories);

    return {
      categoryId: category.id,
      confidence: normalizeConfidence(parsed.confidence),
      summary: typeof parsed.summary === 'string' ? parsed.summary : null,
      provider: 'openai',
    };
  };
}

let hasWarned = false;

/** Shared with server/ so both paths classify identically. */
export function buildSystemPrompt(categories) {
  const list = categories
    .map((c) => `- ${c.id}: ${c.label}${c.description ? ` -- ${c.description}` : ''}`)
    .join('\n');

  return [
    'You sort prayer requests submitted to a church into one category.',
    'These are real people writing about hard things. Be accurate and never judgmental.',
    '',
    'Categories:',
    list,
    '',
    'Reply with JSON only, in this exact shape:',
    '{"category": "<category id from the list>", "confidence": <0 to 1>, "summary": "<neutral restatement, at most 12 words>"}',
    '',
    'Rules:',
    '- "category" must be one of the ids above, verbatim.',
    '- Pick the single dominant need when a request touches several categories.',
    '- Use "other" when nothing fits, rather than forcing a match.',
    '- The summary restates the request. Never add advice, judgment, or scripture.',
  ].join('\n');
}
