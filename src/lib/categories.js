import { DEFAULT_PRIORITY, normalizePriority } from './classification.js';

/**
 * An IntakeCategory is the unit of configuration. Everything the widget and the
 * offline classifier need about one bucket lives here:
 *
 *   id              stable slug the classifier must return
 *   label           what a person reads
 *   hue             0-360; badge colors are derived from it in both themes
 *   description     shown in tooltips, and given to the model as a definition
 *   defaultPriority floor for anything landing here (a bug report is not "low")
 *   keywords        drives offline matching
 *   tagRules        { tag, match[] } -- offline tag extraction
 *   fallback        the catch-all bucket; exactly one per set
 *
 * Only `label` is really required. Everything else is filled in by
 * `resolveCategories`, so a host can pass `['Billing', 'Refunds']` and get
 * working, consistently colored categories.
 */

/** The catch-all appended when a category set doesn't declare its own. */
export const FALLBACK_CATEGORY_ID = 'general';

const GENERIC_FALLBACK = {
  id: FALLBACK_CATEGORY_ID,
  label: 'General',
  hue: 220,
  description: "Anything that doesn't fit the other categories.",
  keywords: [],
  tagRules: [],
  fallback: true,
};

/**
 * Used when no `categories` prop is given. These are the Support preset's --
 * the most broadly applicable starting point for a contact form.
 */
export const DEFAULT_CATEGORIES = [
  {
    id: 'billing',
    label: 'Billing',
    hue: 262,
    description: 'Invoices, payments, refunds, subscriptions, pricing questions.',
    keywords: [
      'billing', 'bill', 'billed', 'invoice', 'invoiced', 'payment', 'pay',
      'paid', 'charge', 'charged', 'overcharged', 'refund', 'refunded',
      'chargeback', 'subscription', 'renewal', 'receipt', 'card', 'credit card',
      'plan', 'upgrade', 'downgrade', 'coupon', 'discount', 'tax',
    ],
    tagRules: [
      { tag: 'invoice', match: ['invoice', 'invoiced', 'receipt', 'statement'] },
      { tag: 'payment', match: ['payment', 'pay', 'paid', 'card', 'credit card', 'charge', 'charged'] },
      { tag: 'refund', match: ['refund', 'refunded', 'chargeback', 'money back'] },
      { tag: 'subscription', match: ['subscription', 'plan', 'renewal', 'upgrade', 'downgrade'] },
    ],
  },
  {
    id: 'technical-support',
    label: 'Technical Support',
    // No `defaultPriority`: a password reset is ordinary. The urgency rules
    // raise it when the wording earns it ("locked out", "we are blocked").
    hue: 200,
    description: 'Something is not working, or help getting set up and integrated.',
    keywords: [
      'error', 'not working', 'broken', 'cannot', 'unable', 'fails', 'failing',
      'failed', 'login', 'log in', 'sign in', 'password', 'reset', 'locked out',
      'install', 'setup', 'configure', 'integration', 'api', 'webhook', 'sdk',
      'token', 'timeout', 'slow', 'loading', 'sync', 'connect', 'connection',
      // Outage vocabulary: without these, "the dashboard is down and we are
      // blocked" scored zero here and got claimed by another category.
      'is down', 'went down', 'outage', 'offline', 'unavailable', 'dashboard',
      'blocked', 'stuck', 'crashing', 'not loading', 'wont load',
    ],
    tagRules: [
      { tag: 'authentication', match: ['password', 'login', 'log in', 'sign in', 'signin', '2fa', 'mfa', 'otp', 'credentials'] },
      { tag: 'account-access', match: ['locked out', 'locked', 'access', 'reset', 'recover', 'cannot log in', "can't log in"] },
      { tag: 'integration', match: ['api', 'webhook', 'integration', 'sdk', 'token', 'endpoint'] },
      { tag: 'performance', match: ['slow', 'timeout', 'lag', 'loading', 'latency', 'hangs'] },
      { tag: 'outage', match: ['is down', 'went down', 'outage', 'offline', 'unavailable', 'not loading', 'blocked'] },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    hue: 158,
    description: 'Profile details, team members, permissions, workspace settings.',
    keywords: [
      'account', 'profile', 'username', 'email address', 'settings',
      'delete my account', 'close my account', 'cancel', 'seat', 'seats',
      'team', 'member', 'members', 'permission', 'permissions', 'role',
      'admin', 'workspace', 'organization', 'transfer', 'owner',
    ],
    tagRules: [
      { tag: 'profile', match: ['profile', 'username', 'email address', 'display name'] },
      { tag: 'permissions', match: ['permission', 'permissions', 'role', 'admin', 'owner', 'access level'] },
      { tag: 'team', match: ['team', 'seat', 'seats', 'member', 'members', 'workspace', 'organization'] },
      { tag: 'cancellation', match: ['cancel', 'delete my account', 'close my account', 'deactivate'] },
    ],
  },
  {
    id: 'bug-report',
    label: 'Bug Report',
    hue: 0,
    defaultPriority: 'high',
    description: 'A reproducible defect: crashes, wrong output, regressions.',
    keywords: [
      'bug', 'crash', 'crashes', 'crashed', 'freeze', 'froze', 'exception',
      'stack trace', 'error message', 'reproduce', 'reproducible', 'regression',
      'glitch', 'unexpected', 'wrong', 'incorrect', 'duplicate', 'missing',
      'disappeared', 'corrupted',
    ],
    tagRules: [
      { tag: 'crash', match: ['crash', 'crashes', 'crashed', 'freeze', 'froze', 'hang'] },
      { tag: 'data-loss', match: ['lost', 'missing', 'disappeared', 'deleted', 'gone', 'corrupted'] },
      { tag: 'regression', match: ['regression', 'used to work', 'worked before', 'after the update', 'since the update'] },
      { tag: 'incorrect-output', match: ['wrong', 'incorrect', 'duplicate', 'mismatch'] },
    ],
  },
  {
    id: 'feature-request',
    label: 'Feature Request',
    hue: 45,
    defaultPriority: 'low',
    description: 'Something that does not exist yet: ideas, suggestions, roadmap.',
    keywords: [
      'feature', 'request', 'suggestion', 'suggest', 'would be nice',
      'would love', 'wish', 'idea', 'enhancement', 'improve', 'roadmap',
      'support for', 'add', 'could you add', 'any plans', 'consider',
    ],
    tagRules: [
      { tag: 'enhancement', match: ['improve', 'enhancement', 'better', 'easier', 'nicer', 'would be nice', 'nice to have', 'wish'] },
      { tag: 'integration-request', match: ['integrate', 'support for', 'connect to', 'work with'] },
      { tag: 'api', match: ['api', 'webhook', 'sdk', 'endpoint'] },
      { tag: 'roadmap', match: ['roadmap', 'any plans', 'planned', 'coming soon'] },
    ],
  },
  GENERIC_FALLBACK,
];

/**
 * Accepts the loose shapes a host might pass -- `['Billing', 'Refunds']`, full
 * objects, or a mix -- and returns complete category records. Guarantees exactly
 * one fallback bucket, so the UI can never receive a category it can't render.
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
      defaultPriority:
        normalizePriority(raw.defaultPriority) ??
        preset?.defaultPriority ??
        DEFAULT_PRIORITY,
      keywords: raw.keywords ?? preset?.keywords ?? [],
      tagRules: raw.tagRules ?? preset?.tagRules ?? [],
      fallback: raw.fallback === true,
    };
  });

  // Exactly one fallback: honor the first declared, otherwise append a generic.
  const declared = resolved.filter((c) => c.fallback);
  if (declared.length === 0) {
    resolved.push({ ...GENERIC_FALLBACK });
  } else if (declared.length > 1) {
    for (const category of declared.slice(1)) category.fallback = false;
  }

  return resolved;
}

/** The catch-all for a resolved set. Never returns undefined for a valid set. */
export function fallbackCategory(categories) {
  return (
    categories.find((c) => c.fallback) ??
    categories.find((c) => c.id === FALLBACK_CATEGORY_ID) ??
    categories[categories.length - 1]
  );
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
