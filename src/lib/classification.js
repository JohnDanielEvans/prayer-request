/**
 * The classification schema and its validators.
 *
 * A classifier -- a model, your own endpoint, or the offline heuristic -- returns
 * something shaped like:
 *
 *   { category: 'technical-support', priority: 'high',
 *     tags: ['authentication', 'account-access'], confidence: 0.94 }
 *
 * Nothing here trusts that shape. Every field is validated and coerced before it
 * reaches the UI, because a model's output is user input as far as we're
 * concerned: it can be missing, misspelled, a sentence instead of an enum, or an
 * array of forty tags.
 */

/** Ordered low -> urgent. The order is what makes `max` comparisons meaningful. */
export const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

export const DEFAULT_PRIORITY = 'normal';

const PRIORITY_RANK = Object.fromEntries(PRIORITIES.map((p, i) => [p, i]));

/** Common synonyms, so a model saying "medium" or "P1" still lands somewhere sane. */
const PRIORITY_ALIASES = {
  lowest: 'low',
  minor: 'low',
  trivial: 'low',
  p4: 'low',
  medium: 'normal',
  moderate: 'normal',
  standard: 'normal',
  default: 'normal',
  p3: 'normal',
  elevated: 'high',
  important: 'high',
  major: 'high',
  p2: 'high',
  critical: 'urgent',
  emergency: 'urgent',
  blocker: 'urgent',
  immediate: 'urgent',
  p1: 'urgent',
  p0: 'urgent',
};

export const MAX_TAGS = 4;
const MAX_TAG_LENGTH = 24;

/**
 * Coerce anything into a valid priority, or null when there's nothing usable.
 * Returning null rather than defaulting here lets the caller decide whether a
 * category default should win.
 */
export function normalizePriority(value) {
  if (typeof value !== 'string') return null;

  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!cleaned) return null;
  if (PRIORITY_RANK[cleaned] !== undefined) return cleaned;
  if (PRIORITY_ALIASES[cleaned]) return PRIORITY_ALIASES[cleaned];

  // "high priority", "priority: urgent" -- find a known level inside the string.
  return PRIORITIES.find((p) => cleaned.includes(p)) ?? null;
}

/** The more severe of two priorities. Unknown values lose. */
export function maxPriority(a, b) {
  const left = normalizePriority(a);
  const right = normalizePriority(b);
  if (!left) return right ?? DEFAULT_PRIORITY;
  if (!right) return left;
  return PRIORITY_RANK[left] >= PRIORITY_RANK[right] ? left : right;
}

export function priorityRank(value) {
  return PRIORITY_RANK[normalizePriority(value) ?? DEFAULT_PRIORITY];
}

/**
 * Normalize a tag list: kebab-case, deduped, length-capped, count-capped.
 *
 * Tags are intentionally not restricted to a fixed vocabulary -- a model spotting
 * "chargeback" on a billing message is more useful than one forced to pick from
 * a list. The cap is what keeps that from becoming a mess.
 */
export function normalizeTags(value) {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,;]/)
      : [];

  const seen = new Set();
  const tags = [];

  for (const entry of list) {
    if (typeof entry !== 'string' && typeof entry !== 'number') continue;

    const tag = String(entry)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, MAX_TAG_LENGTH)
      .replace(/-+$/, '');

    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
    if (tags.length >= MAX_TAGS) break;
  }

  return tags;
}

/**
 * Clamp a confidence into 0..1, or null when absent.
 *
 * Worth knowing: when this comes from a model it is *self-reported* and not
 * calibrated -- an LLM saying 0.94 does not mean it is right 94% of the time.
 * It's shown as a soft signal and labelled as the classifier's own estimate,
 * never as a guarantee. The offline provider's number is a different thing
 * again: a deterministic function of keyword match strength.
 */
export function normalizeConfidence(value) {
  const num = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (typeof num !== 'number' || Number.isNaN(num)) return null;
  const scaled = num > 1 ? num / 100 : num;
  return Math.min(1, Math.max(0, scaled));
}
