import { FALLBACK_CATEGORY_ID, slugify } from './categories.js';

/**
 * Models answer the way people do: "Health", "health.", "Category: Health",
 * "Death/Grieving", sometimes a whole sentence. This maps whatever came back
 * onto a real category, and degrades to `other` rather than throwing.
 */
export function matchCategory(raw, categories) {
  const fallback =
    categories.find((c) => c.id === FALLBACK_CATEGORY_ID) ??
    categories[categories.length - 1];

  if (!raw || typeof raw !== 'string') return fallback;

  const cleaned = raw
    .replace(/^\s*category\s*[:\-]\s*/i, '')
    .replace(/[."'`]+/g, ' ')
    .trim();
  const slug = slugify(cleaned);
  if (!slug) return fallback;

  // Exact id or label.
  const exact = categories.find(
    (c) => c.id === slug || slugify(c.label) === slug
  );
  if (exact) return exact;

  // The model returned something like "health-concerns" or "family-and-marriage".
  // The length floor keeps a stray "fai" from claiming "faith".
  const partial = categories.find(
    (c) =>
      c.id !== FALLBACK_CATEGORY_ID &&
      slug.length >= 4 &&
      (slug.includes(c.id) || c.id.includes(slug))
  );
  if (partial) return partial;

  // Last resort: score the reply against category keywords.
  const scored = scoreCategories(cleaned, categories);
  return scored[0]?.score > 0 ? scored[0].category : fallback;
}

/**
 * Keyword scoring over the request text. Shared by the offline provider and by
 * `matchCategory`'s fallback path.
 */
export function scoreCategories(text, categories) {
  const normalized = String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = new Set(normalized.split(/\s+/).filter(Boolean));
  const haystack = ` ${normalized.replace(/\s+/g, ' ').trim()} `;

  return categories
    .filter((c) => c.id !== FALLBACK_CATEGORY_ID)
    .map((category) => {
      let score = 0;

      for (const keyword of category.keywords ?? []) {
        if (keyword.includes(' ')) {
          // Multi-word keyword: match the phrase.
          if (haystack.includes(` ${keyword} `)) score += 2;
          continue;
        }

        if (tokens.has(keyword)) {
          score += 2;
          continue;
        }

        // Inflections only -- a token that *begins* with the keyword. Bare
        // substring matching is what makes "grandfather" look like "father"
        // and "still" look like "ill", so it isn't used at all.
        if (keyword.length >= 4) {
          for (const token of tokens) {
            if (token.length > keyword.length && token.startsWith(keyword)) {
              score += 1;
              break;
            }
          }
        }
      }

      return { category, score };
    })
    .sort((a, b) => b.score - a.score);
}

/** Clamp a model-reported confidence into 0..1, or null when absent. */
export function normalizeConfidence(value) {
  const num = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (typeof num !== 'number' || Number.isNaN(num)) return null;
  const scaled = num > 1 ? num / 100 : num;
  return Math.min(1, Math.max(0, scaled));
}

/**
 * Models sometimes wrap JSON in prose or a ```json fence. Pull the object out
 * instead of failing the whole request over formatting.
 */
export function parseJsonLoose(content) {
  if (!content || typeof content !== 'string') return null;

  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : content).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}
