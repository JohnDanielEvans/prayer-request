import { describe, expect, it } from 'vitest';
import { DEFAULT_CATEGORIES } from '../categories.js';
import { createMockProvider } from '../providers/mock.js';

// No latency: these assert behavior, not the demo's pacing.
const categorize = createMockProvider({ latency: [0, 0] });
const run = (text) => categorize({ text, categories: DEFAULT_CATEGORIES });

describe('mock provider', () => {
  it.each([
    ['My mother has surgery on Tuesday, pray for her recovery.', 'health'],
    ['I was laid off and rent is due Friday.', 'finances'],
    ['We buried my grandfather on Saturday.', 'grief'],
    ["I can't sleep, the anxiety is constant.", 'emotional'],
    ['Our adoption was finalized, we are so thankful.', 'gratitude'],
  ])('routes %j to %s', async (text, expected) => {
    const result = await run(text);
    expect(result.categoryId).toBe(expected);
  });

  it('falls back to "other" with low confidence when nothing matches', async () => {
    const result = await run('qqqq zzzz wwww');
    expect(result.categoryId).toBe('other');
    expect(result.confidence).toBeLessThan(0.5);
  });

  it('keeps confidence within 0..1', async () => {
    const result = await run(
      'sick illness cancer surgery hospital healing diagnosis pain doctor treatment'
    );
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('is deterministic for the same input', async () => {
    const [a, b] = await Promise.all([
      run('praying about a job interview'),
      run('praying about a job interview'),
    ]);
    expect(a.categoryId).toBe(b.categoryId);
    expect(a.confidence).toBe(b.confidence);
  });

  it('summarizes to the first sentence, truncated', async () => {
    const result = await run('Please pray for peace. There is a lot more here.');
    expect(result.summary).toBe('Please pray for peace.');
  });

  it('aborts instead of resolving when the signal fires', async () => {
    const slow = createMockProvider({ latency: [50, 50] });
    const controller = new AbortController();
    const promise = slow({
      text: 'anything',
      categories: DEFAULT_CATEGORIES,
      signal: controller.signal,
    });

    controller.abort();
    await expect(promise).rejects.toThrow(/abort/i);
  });
});
