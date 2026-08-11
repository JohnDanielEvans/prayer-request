import { describe, expect, it } from 'vitest';
import { DEFAULT_CATEGORIES, resolveCategories } from '../categories.js';
import { PRIORITIES } from '../classification.js';
import { getPreset } from '../presets.js';
import { createMockProvider } from '../providers/mock.js';

// No latency: these assert behavior, not the demo's pacing.
const classify = createMockProvider({ latency: [0, 0] });
const run = (text, categories = DEFAULT_CATEGORIES) => classify({ text, categories });

const prayer = resolveCategories(getPreset('prayer').categories);
const sales = resolveCategories(getPreset('sales').categories);
const community = resolveCategories(getPreset('community').categories);

describe('offline provider — the examples from the brief', () => {
  it('routes the billing example', async () => {
    const result = await run('My invoice is showing the wrong amount.');
    expect(result.categoryId).toBe('billing');
    expect(result.tags).toEqual(expect.arrayContaining(['invoice']));
  });

  it('routes the password example', async () => {
    const result = await run('Can someone help me reset my password?');
    expect(result.categoryId).toBe('technical-support');
    expect(result.tags).toEqual(
      expect.arrayContaining(['authentication', 'account-access'])
    );
  });
});

describe('offline provider — routing per preset', () => {
  it.each([
    ['The app crashes every time I open settings.', 'bug-report'],
    ['Could you add dark mode support?', 'feature-request'],
    ['I need to add two more seats to our team.', 'account'],
  ])('support: %j -> %s', async (text, expected) => {
    expect((await run(text)).categoryId).toBe(expected);
  });

  it.each([
    ['We are looking to build a new marketing site.', 'new-project'],
    ['How much does the annual plan cost?', 'pricing'],
    ['We are an agency interested in a reseller partnership.', 'partnership'],
    ['Our contract is up for renewal next month.', 'existing-client'],
  ])('sales: %j -> %s', async (text, expected) => {
    expect((await run(text, sales)).categoryId).toBe(expected);
  });

  it.each([
    ['I need help with groceries this week.', 'assistance'],
    ['I would like to volunteer on weekends.', 'volunteer'],
    ['How do I register for the workshop?', 'event'],
    ['I want to make a monthly donation.', 'donation'],
  ])('community: %j -> %s', async (text, expected) => {
    expect((await run(text, community)).categoryId).toBe(expected);
  });

  it.each([
    ['My mother has surgery on Tuesday, pray for her recovery.', 'health'],
    ['I was laid off and rent is due Friday.', 'finances'],
    ['We buried my grandfather on Saturday.', 'grief'],
    ["I can't sleep, the anxiety is constant.", 'emotional'],
    ['Our adoption was finalized, we are so thankful.', 'gratitude'],
  ])('prayer: %j -> %s', async (text, expected) => {
    expect((await run(text, prayer)).categoryId).toBe(expected);
  });
});

describe('offline provider — priority', () => {
  it('raises priority for urgent wording', async () => {
    const result = await run('URGENT: our whole account is locked out right now.');
    expect(result.priority).toBe('urgent');
  });

  it('keeps a category floor even when wording is calm', async () => {
    const result = await run('Minor thing, the totals column shows a duplicate row.');
    expect(result.priority).toBe('high'); // bug-report floor
  });

  it('lets a low-priority category stay low', async () => {
    const result = await run('It would be nice to have a dark mode someday.');
    expect(result.priority).toBe('low');
  });

  it.each(PRIORITIES.map((p) => [p]))('only ever emits valid priorities (%s)', async () => {
    for (const text of ['anything at all', '', 'urgent!!!', 'no rush']) {
      expect(PRIORITIES).toContain((await run(text)).priority);
    }
  });
});

describe('offline provider — general behavior', () => {
  it('falls back with low confidence when nothing matches', async () => {
    const result = await run('qqqq zzzz wwww');
    expect(result.categoryId).toBe('general');
    expect(result.confidence).toBeLessThan(0.5);
  });

  it('keeps confidence within 0..1', async () => {
    const result = await run(
      'invoice payment refund subscription billing charge receipt plan'
    );
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('is deterministic for the same input', async () => {
    const [a, b] = await Promise.all([
      run('a question about my invoice'),
      run('a question about my invoice'),
    ]);
    expect(a).toEqual(b);
  });

  it('caps tags at four', async () => {
    const result = await run(
      'my invoice payment refund and subscription plan receipt card charge'
    );
    expect(result.tags.length).toBeLessThanOrEqual(4);
  });

  it('summarizes to the first sentence', async () => {
    const result = await run('My invoice is wrong. There is a lot more here.');
    expect(result.summary).toBe('My invoice is wrong.');
  });

  it('reports itself as the offline provider', async () => {
    expect((await run('anything')).provider).toBe('offline');
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
