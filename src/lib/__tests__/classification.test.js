import { describe, expect, it } from 'vitest';
import {
  MAX_TAGS,
  PRIORITIES,
  maxPriority,
  normalizeConfidence,
  normalizePriority,
  normalizeTags,
} from '../classification.js';

describe('normalizePriority', () => {
  it.each(PRIORITIES)('accepts %s verbatim', (priority) => {
    expect(normalizePriority(priority)).toBe(priority);
  });

  it('is case and punctuation insensitive', () => {
    expect(normalizePriority(' HIGH ')).toBe('high');
    expect(normalizePriority('Urgent!')).toBe('urgent');
  });

  it('maps common synonyms', () => {
    expect(normalizePriority('medium')).toBe('normal');
    expect(normalizePriority('critical')).toBe('urgent');
    expect(normalizePriority('P1')).toBe('urgent');
    expect(normalizePriority('minor')).toBe('low');
  });

  it('finds a level inside a phrase', () => {
    expect(normalizePriority('high priority')).toBe('high');
    expect(normalizePriority('priority: urgent')).toBe('urgent');
  });

  it('returns null for anything unusable rather than guessing', () => {
    expect(normalizePriority('spicy')).toBeNull();
    expect(normalizePriority('')).toBeNull();
    expect(normalizePriority(null)).toBeNull();
    expect(normalizePriority(7)).toBeNull();
    expect(normalizePriority({ priority: 'high' })).toBeNull();
  });
});

describe('maxPriority', () => {
  it('returns the more severe of two', () => {
    expect(maxPriority('low', 'high')).toBe('high');
    expect(maxPriority('urgent', 'normal')).toBe('urgent');
    expect(maxPriority('normal', 'normal')).toBe('normal');
  });

  it('ignores unusable values instead of letting them win', () => {
    expect(maxPriority('high', 'nonsense')).toBe('high');
    expect(maxPriority(null, 'low')).toBe('low');
  });

  it('falls back to normal when neither side is usable', () => {
    expect(maxPriority(null, undefined)).toBe('normal');
  });
});

describe('normalizeTags', () => {
  it('kebab-cases and lowercases', () => {
    expect(normalizeTags(['Account Access', 'Invoice'])).toEqual([
      'account-access',
      'invoice',
    ]);
  });

  it('dedupes after normalizing', () => {
    expect(normalizeTags(['Billing', 'billing', 'BILLING'])).toEqual(['billing']);
  });

  it(`caps at ${MAX_TAGS} tags`, () => {
    const many = ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7'];
    expect(normalizeTags(many)).toHaveLength(MAX_TAGS);
  });

  it('caps tag length', () => {
    const [tag] = normalizeTags(['a'.repeat(80)]);
    expect(tag.length).toBeLessThanOrEqual(24);
  });

  it('accepts a delimited string', () => {
    expect(normalizeTags('invoice, payment; refund')).toEqual([
      'invoice',
      'payment',
      'refund',
    ]);
  });

  it('drops entries that normalize to nothing', () => {
    expect(normalizeTags(['???', '   ', '-', 'ok'])).toEqual(['ok']);
  });

  it('survives junk input', () => {
    expect(normalizeTags(null)).toEqual([]);
    expect(normalizeTags(undefined)).toEqual([]);
    expect(normalizeTags({})).toEqual([]);
    expect(normalizeTags([null, undefined, {}, []])).toEqual([]);
  });

  it('never emits a leading or trailing hyphen', () => {
    for (const tag of normalizeTags(['  spaced out  ', '--weird--'])) {
      expect(tag).not.toMatch(/^-|-$/);
    }
  });
});

describe('normalizeConfidence', () => {
  it('passes through a 0-1 value', () => {
    expect(normalizeConfidence(0.82)).toBe(0.82);
  });

  it('rescales a percentage', () => {
    expect(normalizeConfidence(94)).toBeCloseTo(0.94);
  });

  it('parses numeric strings', () => {
    expect(normalizeConfidence('0.5')).toBe(0.5);
  });

  it('clamps out-of-range values', () => {
    expect(normalizeConfidence(-3)).toBe(0);
    expect(normalizeConfidence(1000)).toBe(1);
  });

  it('returns null for anything unusable', () => {
    expect(normalizeConfidence('high')).toBeNull();
    expect(normalizeConfidence(undefined)).toBeNull();
  });
});
