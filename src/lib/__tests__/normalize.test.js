import { describe, expect, it } from 'vitest';
import { DEFAULT_CATEGORIES, resolveCategories } from '../categories.js';
import {
  matchCategory,
  normalizeConfidence,
  parseJsonLoose,
  scoreCategories,
} from '../normalize.js';

const categories = DEFAULT_CATEGORIES;

describe('matchCategory', () => {
  it('matches a clean category id', () => {
    expect(matchCategory('health', categories).id).toBe('health');
  });

  it('matches a label regardless of case and punctuation', () => {
    expect(matchCategory('Health.', categories).id).toBe('health');
    expect(matchCategory('  FINANCES  ', categories).id).toBe('finances');
  });

  it('handles the "Death/Grieving" style label the old prompt produced', () => {
    expect(matchCategory('Grief & Loss', categories).id).toBe('grief');
  });

  it('strips a "Category:" prefix', () => {
    expect(matchCategory('Category: Family', categories).id).toBe('family');
  });

  it('falls back to keyword scoring when the label is unknown', () => {
    expect(matchCategory('worries about a hospital stay', categories).id).toBe(
      'health'
    );
  });

  it('returns "other" for junk rather than throwing', () => {
    expect(matchCategory('~~~', categories).id).toBe('other');
    expect(matchCategory('', categories).id).toBe('other');
    expect(matchCategory(null, categories).id).toBe('other');
    expect(matchCategory(undefined, categories).id).toBe('other');
  });
});

describe('scoreCategories', () => {
  it('ranks the dominant category first', () => {
    const [top] = scoreCategories(
      'my father passed away last week and the funeral is Friday',
      categories
    );
    expect(top.category.id).toBe('grief');
  });

  it('never proposes the fallback bucket', () => {
    const ids = scoreCategories('anything', categories).map((s) => s.category.id);
    expect(ids).not.toContain('other');
  });

  it('scores zero when nothing matches', () => {
    const [top] = scoreCategories('zzzz qqqq', categories);
    expect(top.score).toBe(0);
  });
});

describe('normalizeConfidence', () => {
  it('passes through a 0-1 value', () => {
    expect(normalizeConfidence(0.82)).toBe(0.82);
  });

  it('rescales a percentage', () => {
    expect(normalizeConfidence(87)).toBeCloseTo(0.87);
  });

  it('parses numeric strings', () => {
    expect(normalizeConfidence('0.5')).toBe(0.5);
  });

  it('returns null for anything unusable', () => {
    expect(normalizeConfidence('high')).toBeNull();
    expect(normalizeConfidence(undefined)).toBeNull();
  });
});

describe('parseJsonLoose', () => {
  it('parses plain JSON', () => {
    expect(parseJsonLoose('{"category":"health"}')).toEqual({
      category: 'health',
    });
  });

  it('unwraps a fenced code block', () => {
    expect(parseJsonLoose('```json\n{"category":"faith"}\n```')).toEqual({
      category: 'faith',
    });
  });

  it('digs the object out of surrounding prose', () => {
    expect(
      parseJsonLoose('Sure! Here you go: {"category":"family"} Hope that helps.')
    ).toEqual({ category: 'family' });
  });

  it('returns null when there is no object', () => {
    expect(parseJsonLoose('no json here')).toBeNull();
    expect(parseJsonLoose('')).toBeNull();
  });
});

describe('resolveCategories', () => {
  it('defaults when given nothing', () => {
    expect(resolveCategories()).toBe(DEFAULT_CATEGORIES);
    expect(resolveCategories([])).toBe(DEFAULT_CATEGORIES);
  });

  it('expands bare strings into full records', () => {
    const [health] = resolveCategories(['Health']);
    expect(health.id).toBe('health');
    expect(health.keywords.length).toBeGreaterThan(0);
  });

  it('always appends a fallback bucket', () => {
    const ids = resolveCategories(['Health', 'Family']).map((c) => c.id);
    expect(ids).toContain('other');
  });

  it('gives custom categories a stable hue', () => {
    const first = resolveCategories([{ label: 'Missions' }]);
    const second = resolveCategories([{ label: 'Missions' }]);
    expect(first[0].hue).toBe(second[0].hue);
  });

  it('respects explicit overrides', () => {
    const [custom] = resolveCategories([{ id: 'health', label: 'Wellbeing', hue: 12 }]);
    expect(custom.label).toBe('Wellbeing');
    expect(custom.hue).toBe(12);
  });
});
