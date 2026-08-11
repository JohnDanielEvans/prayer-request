import { describe, expect, it } from 'vitest';
import { DEFAULT_CATEGORIES, resolveCategories, fallbackCategory } from '../categories.js';
import {
  detectUrgency,
  extractTags,
  matchCategory,
  parseJsonLoose,
  resolvePriority,
  scoreCategories,
} from '../normalize.js';
import { getPreset } from '../presets.js';

const categories = DEFAULT_CATEGORIES;
const prayer = resolveCategories(getPreset('prayer').categories);

describe('matchCategory', () => {
  it('matches a clean category id', () => {
    expect(matchCategory('billing', categories).id).toBe('billing');
  });

  it('matches a label regardless of case and punctuation', () => {
    expect(matchCategory('Billing.', categories).id).toBe('billing');
    expect(matchCategory('  TECHNICAL SUPPORT  ', categories).id).toBe(
      'technical-support'
    );
  });

  it('strips a "Category:" prefix', () => {
    expect(matchCategory('Category: Account', categories).id).toBe('account');
  });

  it('handles an ampersand label', () => {
    expect(matchCategory('Grief & Loss', prayer).id).toBe('grief');
  });

  it('falls back to keyword scoring when the label is unknown', () => {
    expect(matchCategory('a problem with my invoice', categories).id).toBe('billing');
  });

  it('returns the fallback bucket for junk rather than throwing', () => {
    for (const input of ['~~~', '', null, undefined, 42]) {
      expect(matchCategory(input, categories).id).toBe('general');
    }
  });

  it('honours a preset with a differently named fallback', () => {
    expect(matchCategory('~~~', prayer).id).toBe('other');
  });

  it('never invents a category outside the configured set', () => {
    const small = resolveCategories(['Billing']);
    const ids = new Set(small.map((c) => c.id));
    expect(ids).toContain(matchCategory('quantum tunnelling', small).id);
  });
});

describe('scoreCategories', () => {
  it('ranks the dominant category first', () => {
    const [top] = scoreCategories(
      'the app crashes every time I open the settings page',
      categories
    );
    expect(top.category.id).toBe('bug-report');
  });

  it('weights multi-word phrases above single keywords', () => {
    const [top] = scoreCategories('it is not working since the update', categories);
    expect(['technical-support', 'bug-report']).toContain(top.category.id);
  });

  it('never proposes the fallback bucket', () => {
    const ids = scoreCategories('anything', categories).map((s) => s.category.id);
    expect(ids).not.toContain('general');
  });

  it('scores zero when nothing matches', () => {
    expect(scoreCategories('zzzz qqqq', categories)[0].score).toBe(0);
  });

  it('does not substring-match across word boundaries', () => {
    // "grandfather" must not fire the family keyword "father".
    const [top] = scoreCategories('we buried my grandfather on Saturday', prayer);
    expect(top.category.id).toBe('grief');
  });
});

describe('extractTags', () => {
  it('pulls tags from the matching category rules', () => {
    const billing = categories.find((c) => c.id === 'billing');
    expect(extractTags('my invoice charged the wrong amount', billing)).toEqual(
      expect.arrayContaining(['invoice', 'payment'])
    );
  });

  it('matches the password example from the brief', () => {
    const tech = categories.find((c) => c.id === 'technical-support');
    expect(extractTags('can someone help me reset my password', tech)).toEqual(
      expect.arrayContaining(['authentication', 'account-access'])
    );
  });

  it('returns nothing when no rule fires', () => {
    const billing = categories.find((c) => c.id === 'billing');
    expect(extractTags('the weather is nice', billing)).toEqual([]);
  });

  it('handles a category with no rules', () => {
    expect(extractTags('anything', fallbackCategory(categories))).toEqual([]);
    expect(extractTags('anything', null)).toEqual([]);
  });
});

describe('detectUrgency', () => {
  it('spots an emergency', () => {
    expect(detectUrgency('this is urgent, the site is down')).toBe('urgent');
  });

  it('spots time pressure', () => {
    expect(detectUrgency('I am blocked and the deadline is tomorrow')).toBe('high');
  });

  it('spots explicit patience', () => {
    expect(detectUrgency('no rush, just a suggestion')).toBe('low');
  });

  it('lets the strongest signal win', () => {
    expect(detectUrgency('no rush but this is an emergency')).toBe('urgent');
  });

  it('returns null when nothing stands out', () => {
    expect(detectUrgency('I have a question about the product')).toBeNull();
  });
});

describe('resolvePriority', () => {
  const bug = categories.find((c) => c.id === 'bug-report');
  const feature = categories.find((c) => c.id === 'feature-request');

  it('uses the category floor when nothing else is known', () => {
    expect(resolvePriority({ category: bug, text: 'something is off' })).toBe('high');
    expect(resolvePriority({ category: feature, text: 'an idea' })).toBe('low');
  });

  it('lets urgent text raise a low-priority category', () => {
    expect(
      resolvePriority({ category: feature, text: 'this is urgent, we are blocked' })
    ).toBe('urgent');
  });

  it('trusts a reported priority but not below detected urgency', () => {
    expect(
      resolvePriority({ reported: 'low', category: bug, text: 'the site is down' })
    ).toBe('urgent');
  });

  it('ignores an unusable reported priority', () => {
    expect(resolvePriority({ reported: 'banana', category: bug, text: 'x' })).toBe(
      'high'
    );
  });

  it('defaults to normal with no category at all', () => {
    expect(resolvePriority({ text: 'hello' })).toBe('normal');
  });
});

describe('parseJsonLoose', () => {
  it('parses plain JSON', () => {
    expect(parseJsonLoose('{"category":"billing"}')).toEqual({ category: 'billing' });
  });

  it('unwraps a fenced code block', () => {
    expect(parseJsonLoose('```json\n{"category":"account"}\n```')).toEqual({
      category: 'account',
    });
  });

  it('digs the object out of surrounding prose', () => {
    expect(
      parseJsonLoose('Sure! Here you go: {"category":"billing"} Hope that helps.')
    ).toEqual({ category: 'billing' });
  });

  it('returns null when there is no object', () => {
    expect(parseJsonLoose('no json here')).toBeNull();
    expect(parseJsonLoose('')).toBeNull();
    expect(parseJsonLoose(null)).toBeNull();
  });
});

describe('resolveCategories', () => {
  it('defaults when given nothing', () => {
    expect(resolveCategories()).toBe(DEFAULT_CATEGORIES);
    expect(resolveCategories([])).toBe(DEFAULT_CATEGORIES);
  });

  it('expands bare strings into full records', () => {
    const [billing] = resolveCategories(['Billing']);
    expect(billing.id).toBe('billing');
    expect(billing.keywords.length).toBeGreaterThan(0);
    expect(billing.defaultPriority).toBeTruthy();
  });

  it('always ends up with exactly one fallback', () => {
    const resolved = resolveCategories(['Billing', 'Refunds']);
    expect(resolved.filter((c) => c.fallback)).toHaveLength(1);
  });

  it('keeps only the first declared fallback', () => {
    const resolved = resolveCategories([
      { label: 'A', fallback: true },
      { label: 'B', fallback: true },
    ]);
    expect(resolved.filter((c) => c.fallback)).toHaveLength(1);
    expect(fallbackCategory(resolved).id).toBe('a');
  });

  it('gives custom categories a stable hue', () => {
    const first = resolveCategories([{ label: 'Logistics' }]);
    const second = resolveCategories([{ label: 'Logistics' }]);
    expect(first[0].hue).toBe(second[0].hue);
  });

  it('respects explicit overrides', () => {
    const [custom] = resolveCategories([
      { id: 'billing', label: 'Payments', hue: 12, defaultPriority: 'urgent' },
    ]);
    expect(custom.label).toBe('Payments');
    expect(custom.hue).toBe(12);
    expect(custom.defaultPriority).toBe('urgent');
  });
});
