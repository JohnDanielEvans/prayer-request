import { FALLBACK_CATEGORY_ID } from '../categories.js';
import { scoreCategories } from '../normalize.js';

/**
 * Offline provider. No network, no key, no cost.
 *
 * This is what makes the widget demoable: a portfolio visitor, a CI run, and a
 * host site evaluating the component all get working behavior on first load.
 * It scores the request against category keywords, which is crude next to a
 * model but lands the obvious cases and is fully deterministic.
 */
export function createMockProvider({ latency = [500, 1100] } = {}) {
  return async function categorize({ text, categories, signal }) {
    await simulateLatency(latency, signal);

    const scored = scoreCategories(text, categories);
    const best = scored[0];
    const runnerUp = scored[1];

    if (!best || best.score === 0) {
      return {
        categoryId: FALLBACK_CATEGORY_ID,
        confidence: 0.3,
        summary: summarize(text),
        provider: 'mock',
      };
    }

    // Confidence rises with the raw score and with the gap to second place --
    // an unambiguous match should read differently from a coin flip.
    const margin = best.score - (runnerUp?.score ?? 0);
    const confidence = Math.min(
      0.95,
      0.5 + best.score * 0.06 + margin * 0.08
    );

    return {
      categoryId: best.category.id,
      confidence: Number(confidence.toFixed(2)),
      summary: summarize(text),
      provider: 'mock',
    };
  };
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
