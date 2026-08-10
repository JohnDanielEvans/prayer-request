/**
 * The canonical category set.
 *
 * Every category carries its own hue rather than a fixed hex pair, so badges
 * derive light- and dark-mode colors from one number and stay consistent when a
 * host site swaps themes. `keywords` powers the offline provider and gives the
 * normalizer something to fall back on when a model answers off-script.
 */
export const DEFAULT_CATEGORIES = [
  {
    id: 'health',
    label: 'Health',
    hue: 158,
    description: 'Illness, recovery, surgery, chronic conditions, caregiving.',
    keywords: [
      'health', 'sick', 'illness', 'cancer', 'surgery', 'hospital', 'healing',
      'diagnosis', 'pain', 'doctor', 'treatment', 'recovery', 'chemo', 'injury',
      'covid', 'medical', 'heal', 'therapy', 'disease',
    ],
  },
  {
    id: 'family',
    label: 'Family',
    hue: 22,
    description: 'Marriage, parenting, children, relatives, household life.',
    keywords: [
      'family', 'marriage', 'wife', 'husband', 'spouse', 'son', 'daughter',
      'kids', 'children', 'child', 'mother', 'father', 'mom', 'dad', 'parents',
      'sister', 'brother', 'divorce', 'baby', 'pregnancy', 'grandchild',
    ],
  },
  {
    id: 'finances',
    label: 'Finances',
    hue: 262,
    description: 'Work, provision, debt, housing, employment.',
    keywords: [
      'money', 'finances', 'financial', 'job', 'work', 'unemployed', 'debt',
      'rent', 'mortgage', 'bills', 'income', 'layoff', 'laid off', 'interview',
      'business', 'provision', 'afford', 'eviction', 'career', 'hired',
    ],
  },
  {
    id: 'faith',
    label: 'Faith',
    hue: 200,
    description: 'Spiritual growth, doubt, discipleship, church life.',
    keywords: [
      'faith', 'god', 'jesus', 'church', 'scripture', 'bible', 'prayer life',
      'doubt', 'salvation', 'baptism', 'ministry', 'mission', 'spiritual',
      'believe', 'worship', 'discipleship', 'calling',
    ],
  },
  {
    id: 'grief',
    label: 'Grief & Loss',
    hue: 232,
    description: 'Death, bereavement, mourning, funerals.',
    keywords: [
      'died', 'death', 'passed away', 'funeral', 'grief', 'grieving', 'loss',
      'mourning', 'bereaved', 'widow', 'widower', 'miscarriage', 'burial',
      'hospice', 'passing', 'buried', 'bury', 'memorial', 'graveside', 'eulogy',
    ],
  },
  {
    id: 'emotional',
    label: 'Emotional',
    hue: 330,
    description: 'Anxiety, depression, loneliness, fear, mental health.',
    keywords: [
      'anxiety', 'anxious', 'depressed', 'depression', 'lonely', 'loneliness',
      'fear', 'afraid', 'scared', 'stress', 'stressed', 'overwhelmed', 'panic',
      'hopeless', 'worry', 'worried', 'burnout', 'mental health', 'despair',
    ],
  },
  {
    id: 'guidance',
    label: 'Guidance',
    hue: 45,
    description: 'Decisions, direction, discernment, transitions.',
    keywords: [
      'decision', 'guidance', 'direction', 'discernment', 'wisdom', 'choice',
      'moving', 'relocate', 'school', 'college', 'next step', 'clarity',
      'unsure', 'crossroads', 'considering',
    ],
  },
  {
    id: 'gratitude',
    label: 'Gratitude',
    hue: 88,
    description: 'Praise, answered prayer, thanksgiving, celebration.',
    keywords: [
      'thank', 'thanks', 'thankful', 'grateful', 'gratitude', 'praise',
      'answered', 'celebrate', 'celebration', 'blessed', 'blessing', 'rejoice',
      'good news', 'welcomed', 'engaged', 'graduated',
    ],
  },
  {
    id: 'other',
    label: 'Other',
    hue: 220,
    description: "Anything that doesn't fit the categories above.",
    keywords: [],
  },
];

/** Terminal bucket, used whenever classification fails or is unrecognized. */
export const FALLBACK_CATEGORY_ID = 'other';

/**
 * Accepts the loose shapes a host might pass to the `categories` prop --
 * `['Health', 'Family']`, or full objects, or a mix -- and returns complete
 * category records. Guarantees a fallback bucket exists so the UI can never
 * end up with an unrenderable result.
 */
export function resolveCategories(input) {
  if (!input || !Array.isArray(input) || input.length === 0) {
    return DEFAULT_CATEGORIES;
  }

  const resolved = input.map((entry, index) => {
    const raw = typeof entry === 'string' ? { label: entry } : { ...entry };
    const id = raw.id ?? slugify(raw.label ?? `category-${index}`);
    const preset = DEFAULT_CATEGORIES.find((c) => c.id === id);

    return {
      id,
      label: raw.label ?? preset?.label ?? titleCase(id),
      hue: raw.hue ?? preset?.hue ?? hueFromString(id),
      description: raw.description ?? preset?.description ?? '',
      keywords: raw.keywords ?? preset?.keywords ?? [],
    };
  });

  if (!resolved.some((c) => c.id === FALLBACK_CATEGORY_ID)) {
    resolved.push(DEFAULT_CATEGORIES.find((c) => c.id === FALLBACK_CATEGORY_ID));
  }

  return resolved;
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[&/]+/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCase(value) {
  return String(value)
    .split('-')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

/** Deterministic hue for custom categories, so colors are stable across loads. */
export function hueFromString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 360;
  }
  return hash;
}
