import { describe, expect, it } from 'vitest';
import { PRESETS, getPreset, presetProps } from '../presets.js';
import { resolveCategories } from '../categories.js';
import { PRIORITIES } from '../classification.js';
import { createMockProvider } from '../providers/mock.js';

const classify = createMockProvider({ latency: [0, 0] });

describe('preset definitions', () => {
  it('exposes the four demo presets', () => {
    expect(PRESETS.map((p) => p.id)).toEqual([
      'support',
      'sales',
      'community',
      'prayer',
    ]);
  });

  it.each(PRESETS)('$id is fully specified', (preset) => {
    expect(preset.label).toBeTruthy();
    expect(preset.prompt).toBeTruthy();
    expect(preset.placeholder).toBeTruthy();
    expect(preset.categories.length).toBeGreaterThanOrEqual(5);
  });

  it.each(PRESETS)('$id has exactly one fallback category', (preset) => {
    const fallbacks = preset.categories.filter((c) => c.fallback);
    expect(fallbacks).toHaveLength(1);
  });

  it.each(PRESETS)('$id has unique category ids', (preset) => {
    const ids = preset.categories.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(PRESETS)('$id declares only valid default priorities', (preset) => {
    for (const category of preset.categories) {
      if (category.defaultPriority === undefined) continue;
      expect(PRIORITIES).toContain(category.defaultPriority);
    }
  });

  it.each(PRESETS)('$id gives every non-fallback category keywords', (preset) => {
    for (const category of preset.categories) {
      if (category.fallback) continue;
      expect(category.keywords.length).toBeGreaterThan(0);
    }
  });

  it('keeps the prayer preset as a first-class example', () => {
    const prayer = getPreset('prayer');
    expect(prayer.categories.map((c) => c.id)).toEqual([
      'health',
      'family',
      'finances',
      'faith',
      'grief',
      'emotional',
      'gratitude',
      'other',
    ]);
  });
});

describe('presetProps', () => {
  it('returns props the widget accepts', () => {
    const props = presetProps('support');
    expect(props).toHaveProperty('title');
    expect(props).toHaveProperty('placeholder');
    expect(props).toHaveProperty('categories');
  });

  it('falls back to the first preset for an unknown id', () => {
    expect(presetProps('nope').title).toBe(getPreset('support').prompt);
  });
});

describe('classification stays inside the configured preset', () => {
  const probes = [
    'my invoice is showing the wrong amount',
    'can someone help me reset my password',
    'we would like to discuss a partnership',
    'I need help paying rent this month',
    'my mother has surgery on Tuesday',
    'zzzz qqqq wwww',
    '',
    '?!?!',
  ];

  it.each(PRESETS)(
    '$id never returns a category outside its own set',
    async (preset) => {
      const categories = resolveCategories(preset.categories);
      const allowed = new Set(categories.map((c) => c.id));

      for (const text of probes) {
        const result = await classify({ text, categories });
        expect(allowed).toContain(result.categoryId);
        expect(PRIORITIES).toContain(result.priority);
        expect(Array.isArray(result.tags)).toBe(true);
        expect(result.tags.length).toBeLessThanOrEqual(4);
      }
    }
  );
});
