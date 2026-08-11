import { fallbackCategory, slugify } from './categories.js';
import { DEFAULT_PRIORITY, maxPriority, normalizePriority } from './classification.js';

/**
 * Text matching shared by the offline classifier and by the recovery paths that
 * run when a model returns something off-script.
 */

/**
 * Global urgency signals, applied on top of a category's `defaultPriority`.
 *
 * These are lexical, not semantic -- "as soon as possible" really is a stronger
 * signal than "whenever you get a chance", and that holds across every preset.
 * The final priority is the more severe of this and the category default, so a
 * bug report never quietly drops to "low" just because someone was polite.
 */
const URGENCY_RULES = [
  {
    priority: 'urgent',
    match: [
      'urgent', 'urgently', 'emergency', 'asap', 'immediately', 'right now',
      'critical', 'outage', 'is down', 'completely down', 'cannot access',
      "can't access", 'crisis', 'evicted', 'no food',
      'nothing to eat', 'today or', 'losing', 'lost everything',
    ],
  },
  {
    priority: 'high',
    match: [
      'soon', 'today', 'tomorrow', 'deadline', 'blocked', 'blocking', 'stuck',
      'not working', 'broken', 'failing', 'failed', 'error', 'worried',
      'scared', 'hospital', 'surgery', 'this week', 'overdue', 'still waiting',
      // Being shut out of an account is serious, but it is not an emergency --
      // reserving "urgent" for genuine ones keeps the label meaningful.
      'locked out', 'cannot log in', "can't log in",
    ],
  },
  {
    priority: 'low',
    match: [
      'whenever', 'no rush', 'no hurry', 'not urgent', 'just curious',
      'someday', 'eventually', 'nice to have', 'would be nice', 'down the road',
      'no pressure', 'when you get a chance',
    ],
  },
];

/** Lowercased, punctuation-stripped, single-spaced, padded for phrase matching. */
function prepare(text) {
  const normalized = String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    haystack: ` ${normalized} `,
    tokens: new Set(normalized.split(' ').filter(Boolean)),
  };
}

/**
 * Does this term appear? Multi-word terms match as phrases; single words match
 * whole tokens, or as a prefix for inflections.
 *
 * Bare substring matching is deliberately not used: it makes "grandfather" look
 * like "father" and "still" look like "ill".
 */
function hasTerm({ haystack, tokens }, term) {
  const needle = String(term).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  if (!needle) return false;
  if (needle.includes(' ')) return haystack.includes(` ${needle} `);
  if (tokens.has(needle)) return true;
  if (needle.length < 4) return false;
  for (const token of tokens) {
    if (token.length > needle.length && token.startsWith(needle)) return true;
  }
  return false;
}

/** Score every non-fallback category against the text, best first. */
export function scoreCategories(text, categories) {
  const prepared = prepare(text);

  return categories
    .filter((c) => !c.fallback)
    .map((category) => {
      let score = 0;
      for (const keyword of category.keywords ?? []) {
        if (hasTerm(prepared, keyword)) score += keyword.includes(' ') ? 3 : 2;
      }
      return { category, score };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Map whatever a classifier returned onto a real category.
 *
 * Models answer the way people do: "Billing", "billing.", "Category: Billing",
 * "Technical Support / Account". This degrades to the fallback rather than
 * throwing, and never invents a category outside the configured set.
 */
export function matchCategory(raw, categories) {
  const fallback = fallbackCategory(categories);
  if (!raw || typeof raw !== 'string') return fallback;

  const cleaned = raw
    .replace(/^\s*category\s*[:\-]\s*/i, '')
    .replace(/[."'`]+/g, ' ')
    .trim();
  const slug = slugify(cleaned);
  if (!slug) return fallback;

  const exact = categories.find(
    (c) => c.id === slug || slugify(c.label) === slug
  );
  if (exact) return exact;

  // "technical-support-issue", "billing-and-payments". The length floor stops a
  // stray "fai" claiming "faith".
  const partial = categories.find(
    (c) => !c.fallback && slug.length >= 4 && (slug.includes(c.id) || c.id.includes(slug))
  );
  if (partial) return partial;

  const scored = scoreCategories(cleaned, categories);
  return scored[0]?.score > 0 ? scored[0].category : fallback;
}

/**
 * Extract tags from the text using a category's `tagRules`. Used by the offline
 * classifier, and as a backfill when a model returns a category but no tags.
 */
export function extractTags(text, category) {
  if (!category?.tagRules?.length) return [];
  const prepared = prepare(text);

  return category.tagRules
    .filter((rule) => (rule.match ?? []).some((term) => hasTerm(prepared, term)))
    .map((rule) => rule.tag);
}

/**
 * Priority implied by the text alone, or null when nothing stands out.
 * Strongest signal wins: an "urgent" phrase beats a "no rush" one.
 */
export function detectUrgency(text) {
  const prepared = prepare(text);
  for (const rule of URGENCY_RULES) {
    if (rule.match.some((term) => hasTerm(prepared, term))) return rule.priority;
  }
  return null;
}

/**
 * Resolve the final priority from the three things that can suggest one.
 *
 * A classifier that gives a usable answer wins over the category floor -- it
 * read the message and the floor didn't -- but never sits below the urgency the
 * text plainly states. With no usable answer we fall back to the floor, raised
 * by any urgency in the text.
 *
 * `reported` is normalized before it is trusted: a truthy-but-meaningless value
 * like "banana" has to behave as "nothing reported", not as a valid answer.
 */
export function resolvePriority({ reported, category, text }) {
  const floor = category?.defaultPriority ?? DEFAULT_PRIORITY;
  const detected = text ? detectUrgency(text) : null;
  const stated = normalizePriority(reported);

  return stated ? maxPriority(stated, detected) : maxPriority(detected, floor);
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
