import { fallbackCategory } from '../categories.js';
import { detectUrgency, extractTags, scoreCategories } from '../normalize.js';
import { maxPriority } from '../classification.js';
import { toClassification } from './shared.js';

/**
 * The offline classifier. No network, no key, no cost.
 *
 * This is what makes the widget demoable: a portfolio visitor, a CI run, and a
 * team evaluating the component all get working behavior on first load. It is
 * keyword scoring, not language understanding -- crude next to a model, but
 * deterministic, instant, and honest about what it is.
 *
 * Its confidence is a real function of match strength (see below), not a number
 * invented to look convincing.
 */
export function createMockProvider({ latency = [450, 950] } = {}) {
  return async function classify({ text, categories, signal }) {
    await simulateLatency(latency, signal);

    const scored = scoreCategories(text, categories);
    const best = scored[0];
    const runnerUp = scored[1];
    const matched = best?.score > 0 ? best.category : fallbackCategory(categories);

    return toClassification({
      raw: {
        category: matched.id,
        // The category floor still applies, so a bug report stays high even
        // when the wording is calm.
        priority: maxPriority(detectUrgency(text), matched.defaultPriority),
        tags: extractTags(text, matched),
        confidence: scoreToConfidence(best?.score ?? 0, runnerUp?.score ?? 0),
        summary: summarize(text),
      },
      text,
      categories,
      provider: 'offline',
    });
  };
}

/**
 * Confidence rises with the raw score and with the gap to second place: an
 * unambiguous match should read differently from a coin flip. Capped below 1
 * because keyword scoring is never certain.
 */
function scoreToConfidence(best, runnerUp) {
  if (best <= 0) return 0.25;
  const margin = best - runnerUp;
  return Number(Math.min(0.95, 0.45 + best * 0.05 + margin * 0.07).toFixed(2));
}

/** First sentence, trimmed -- stands in for the model's one-line summary. */
function summarize(text) {
  const firstSentence = String(text).split(/(?<=[.!?])\s+/)[0] ?? text;
  const trimmed = firstSentence.trim();
  if (trimmed.length <= 90) return trimmed;
  return `${trimmed.slice(0, 87).trimEnd()}...`;
}

function simulateLatency([min, max], signal) {
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  });
}
