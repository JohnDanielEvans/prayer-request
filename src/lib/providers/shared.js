import { normalizeConfidence, normalizeTags } from '../classification.js';
import { extractTags, matchCategory, resolvePriority } from '../normalize.js';

/**
 * The single validation funnel every provider passes through.
 *
 * Whatever a classifier hands back -- a model, your endpoint, the offline
 * heuristic -- ends up here before the UI sees it. That means one place decides
 * what a valid ClassificationResult is, and no provider can leak an unvalidated
 * field through. Anything unrecognised degrades; nothing throws.
 */
export function toClassification({ raw, text, categories, provider }) {
  const payload = raw ?? {};

  // A category outside the configured set is not a category.
  const category = matchCategory(
    payload.category ?? payload.categoryId ?? payload.label,
    categories
  );

  const priority = resolvePriority({
    reported: payload.priority,
    category,
    text,
  });

  // A classifier that returns no usable tags gets them derived from the text,
  // so the field is consistently populated rather than sometimes empty.
  const reported = normalizeTags(payload.tags);
  const tags = reported.length > 0 ? reported : normalizeTags(extractTags(text, category));

  return {
    categoryId: category.id,
    priority,
    tags,
    confidence: normalizeConfidence(payload.confidence),
    summary: typeof payload.summary === 'string' ? payload.summary.trim() || null : null,
    provider,
  };
}

/**
 * The classification contract, written once and shared by the browser-side
 * OpenAI provider and the server examples so both classify identically.
 */
export function buildSystemPrompt(categories) {
  const list = categories
    .map((c) => `- ${c.id}: ${c.label}${c.description ? ` -- ${c.description}` : ''}`)
    .join('\n');

  return [
    'You triage incoming messages submitted through a website contact form.',
    'Classify each message. Be accurate, neutral, and never judgemental -- these',
    'are real people, and some are writing about difficult things.',
    '',
    'Categories:',
    list,
    '',
    'Reply with JSON only, in exactly this shape:',
    '{"category": "<category id>", "priority": "low|normal|high|urgent",',
    ' "tags": ["<1-4 short tags>"], "confidence": <0 to 1>,',
    ' "summary": "<neutral restatement, at most 12 words>"}',
    '',
    'Rules:',
    '- "category" must be one of the ids above, verbatim. Pick the single',
    '  dominant need when a message touches several.',
    '- Use the catch-all category when nothing fits, rather than forcing a match.',
    '- "priority" reflects how time-sensitive the message is for the sender,',
    '  not how interesting it is. Reserve "urgent" for genuine emergencies,',
    '  blocked work, or someone at risk.',
    '- "tags" are lowercase, hyphenated, one or two words each. Describe the',
    '  specifics ("invoice", "account-access"), not the category name again.',
    '- "confidence" is your own estimate that the category is correct.',
    '- "summary" restates the message. Never add advice, judgement, or opinion.',
  ].join('\n');
}
