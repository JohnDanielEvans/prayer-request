import { DEFAULT_CATEGORIES } from './categories.js';

/**
 * IntakePresets are configuration, not code paths.
 *
 * Each one is a plain object the widget accepts as props. Switching preset in
 * the demo re-renders the same `<IntakeWidget>` with different data -- there is
 * no per-preset component, branch, or special case anywhere in the widget. That
 * is the whole point: the support desk, the sales inbox, the community centre
 * and the prayer team are the same component wearing different configuration.
 */
export const PRESETS = [
  {
    id: 'support',
    label: 'Support',
    blurb: 'A product support inbox: triage by area, flag what is blocking someone.',
    accent: '#2563eb',
    prompt: 'How can we help?',
    subtitle: 'Tell us what you need and it will reach the right team.',
    placeholder: 'Describe the issue you are running into...',
    submitLabel: 'Send request',
    categories: DEFAULT_CATEGORIES,
  },

  {
    id: 'sales',
    label: 'Sales',
    blurb: 'An inbound enquiry form: separate new work from pricing and partners.',
    accent: '#0f766e',
    prompt: 'What can we help you with?',
    subtitle: 'Tell us about your project and the right person will follow up.',
    placeholder: 'Tell us what you are looking to build...',
    submitLabel: 'Send enquiry',
    categories: [
      {
        id: 'new-project',
        label: 'New Project',
        hue: 200,
        defaultPriority: 'high',
        description: 'Someone wants work scoped, quoted, or started.',
        keywords: [
          'new project', 'project', 'quote', 'proposal', 'scope', 'build',
          'redesign', 'rebuild', 'engagement', 'kickoff', 'timeline',
          'estimate', 'rfp', 'brief', 'looking to', 'need help building',
        ],
        tagRules: [
          { tag: 'quote', match: ['quote', 'estimate', 'proposal', 'bid'] },
          { tag: 'timeline', match: ['timeline', 'deadline', 'launch', 'schedule', 'by when'] },
          { tag: 'scope', match: ['scope', 'requirements', 'brief', 'spec', 'rfp'] },
          { tag: 'redesign', match: ['redesign', 'rebuild', 'refresh', 'migrate'] },
        ],
      },
      {
        id: 'pricing',
        label: 'Pricing',
        hue: 262,
        description: 'Questions about cost, rates, plans, and budget fit.',
        keywords: [
          'pricing', 'price', 'cost', 'costs', 'rate', 'rates', 'budget',
          'how much', 'quote', 'plan', 'plans', 'tier', 'package', 'discount',
          'contract', 'retainer', 'hourly', 'afford',
        ],
        tagRules: [
          { tag: 'budget', match: ['budget', 'afford', 'cost', 'spend', 'how much'] },
          { tag: 'plans', match: ['plan', 'plans', 'tier', 'package', 'subscription'] },
          { tag: 'discount', match: ['discount', 'nonprofit', 'startup', 'volume', 'annual'] },
          { tag: 'contract', match: ['contract', 'retainer', 'terms', 'msa'] },
        ],
      },
      {
        id: 'partnership',
        label: 'Partnership',
        hue: 158,
        description: 'Resellers, agencies, affiliates, and co-marketing.',
        keywords: [
          'partner', 'partnership', 'reseller', 'affiliate', 'collaborate',
          'collaboration', 'referral', 'agency', 'white label', 'co-marketing',
          'integrate with', 'work together', 'joint',
        ],
        tagRules: [
          { tag: 'reseller', match: ['reseller', 'white label', 'agency', 'distribute'] },
          { tag: 'referral', match: ['referral', 'affiliate', 'commission', 'refer'] },
          { tag: 'co-marketing', match: ['co-marketing', 'webinar', 'event', 'content', 'joint'] },
          { tag: 'integration', match: ['integrate with', 'integration', 'api', 'technology partner'] },
        ],
      },
      {
        id: 'existing-client',
        label: 'Existing Client',
        hue: 22,
        defaultPriority: 'high',
        description: 'Someone already working with you: renewals, expansions, account questions.',
        keywords: [
          'existing', 'current client', 'already work', 'ongoing', 'retainer',
          'our contract', 'renewal', 'renew', 'expand', 'add on', 'additional',
          'more seats', 'upsell', 'account manager', 'invoice',
        ],
        tagRules: [
          { tag: 'renewal', match: ['renewal', 'renew', 'contract', 'extend', 'expiring'] },
          { tag: 'expansion', match: ['expand', 'add on', 'additional', 'more seats', 'upgrade'] },
          { tag: 'account-manager', match: ['account manager', 'our contact', 'rep', 'who handles'] },
        ],
      },
      {
        id: 'general-inquiry',
        label: 'General Inquiry',
        hue: 220,
        description: 'Anything that is not clearly one of the above.',
        keywords: [],
        tagRules: [],
        fallback: true,
      },
    ],
  },

  {
    id: 'community',
    label: 'Community',
    blurb: 'A community organisation front door: needs, volunteers, events, giving.',
    accent: '#b45309',
    prompt: 'How can we help?',
    subtitle: 'Tell us what you need and the right team will get back to you.',
    placeholder: 'Tell us how we can help, or how you would like to get involved...',
    submitLabel: 'Send message',
    categories: [
      {
        id: 'assistance',
        label: 'Assistance',
        hue: 0,
        defaultPriority: 'high',
        description: 'Someone needs practical help: food, housing, utilities, transport.',
        keywords: [
          'help', 'assistance', 'need', 'struggling', 'emergency', 'crisis',
          'food', 'groceries', 'meal', 'hungry', 'housing', 'rent', 'eviction',
          'evicted', 'shelter', 'homeless', 'utilities', 'electric', 'heat',
          'transportation', 'ride', 'childcare', 'medical', 'clothing',
        ],
        tagRules: [
          { tag: 'food', match: ['food', 'groceries', 'meal', 'meals', 'pantry', 'hungry'] },
          { tag: 'housing', match: ['housing', 'rent', 'eviction', 'evicted', 'shelter', 'homeless'] },
          { tag: 'utilities', match: ['utilities', 'electric', 'water', 'gas', 'heat', 'power'] },
          { tag: 'transportation', match: ['transportation', 'ride', 'bus', 'car', 'travel'] },
        ],
      },
      {
        id: 'volunteer',
        label: 'Volunteer',
        hue: 158,
        description: 'Offers of time and skills.',
        keywords: [
          'volunteer', 'volunteering', 'help out', 'sign up', 'serve',
          'give time', 'shift', 'shifts', 'availability', 'join', 'get involved',
          'lend a hand', 'mentor', 'tutor',
        ],
        tagRules: [
          { tag: 'signup', match: ['sign up', 'signup', 'join', 'register', 'get involved'] },
          { tag: 'schedule', match: ['shift', 'shifts', 'schedule', 'availability', 'weekend', 'evening'] },
          { tag: 'skills', match: ['skills', 'experience', 'background', 'certified', 'licensed', 'mentor', 'tutor'] },
        ],
      },
      {
        id: 'event',
        label: 'Event',
        hue: 45,
        description: 'Registrations, bookings, and questions about gatherings.',
        keywords: [
          'event', 'events', 'meeting', 'workshop', 'class', 'classes',
          'register', 'registration', 'rsvp', 'attend', 'attending', 'ticket',
          'venue', 'room', 'booking', 'book', 'schedule', 'conference',
        ],
        tagRules: [
          { tag: 'registration', match: ['register', 'registration', 'rsvp', 'sign up', 'ticket'] },
          { tag: 'venue', match: ['venue', 'room', 'space', 'location', 'hall'] },
          { tag: 'scheduling', match: ['date', 'time', 'schedule', 'when', 'reschedule'] },
        ],
      },
      {
        id: 'donation',
        label: 'Donation',
        hue: 88,
        description: 'Giving: money, goods, sponsorship, and receipts.',
        keywords: [
          'donate', 'donation', 'donating', 'give', 'gift', 'contribute',
          'contribution', 'sponsor', 'sponsorship', 'fundraiser', 'pledge',
          'in-kind', 'tax', 'receipt', 'bequest', 'matching',
        ],
        tagRules: [
          { tag: 'monetary', match: ['donate', 'donation', 'gift', 'pledge', 'contribute', 'monthly'] },
          { tag: 'in-kind', match: ['in-kind', 'items', 'supplies', 'clothing', 'furniture', 'goods'] },
          { tag: 'tax-receipt', match: ['tax', 'receipt', 'deduction', 'acknowledgment', 'letter'] },
          { tag: 'sponsorship', match: ['sponsor', 'sponsorship', 'matching', 'corporate'] },
        ],
      },
      {
        id: 'resources',
        label: 'Resources',
        hue: 200,
        description: 'Requests for information, referrals, and programme details.',
        keywords: [
          'resource', 'resources', 'information', 'info', 'referral', 'refer',
          'program', 'programme', 'service', 'services', 'where can i', 'list',
          'guide', 'directory', 'eligibility', 'eligible', 'qualify', 'apply',
        ],
        tagRules: [
          { tag: 'referral', match: ['referral', 'refer', 'direct me', 'point me', 'where can i'] },
          { tag: 'eligibility', match: ['eligibility', 'eligible', 'qualify', 'requirements', 'income'] },
          { tag: 'materials', match: ['guide', 'packet', 'brochure', 'list', 'directory', 'form'] },
        ],
      },
      {
        id: 'general',
        label: 'General',
        hue: 220,
        description: 'Anything that does not fit the other categories.',
        keywords: [],
        tagRules: [],
        fallback: true,
      },
    ],
  },

  {
    id: 'prayer',
    label: 'Prayer',
    blurb:
      'The use case this project started as -- kept as proof the same component covers something genuinely different.',
    accent: '#7c3aed',
    prompt: 'How can we pray for you?',
    subtitle: 'Share a request and it will be sorted so our prayer team can follow up.',
    placeholder: 'Write your request...',
    submitLabel: 'Submit request',
    // Tone note: this preset is read by people writing about hard things. The
    // copy stays plain, and the classifier is told never to editorialise.
    categories: [
      {
        id: 'health',
        label: 'Health',
        hue: 158,
        defaultPriority: 'high',
        description: 'Illness, recovery, surgery, chronic conditions, caregiving.',
        keywords: [
          'health', 'sick', 'illness', 'cancer', 'surgery', 'hospital',
          'healing', 'diagnosis', 'diagnosed', 'pain', 'doctor', 'treatment',
          'recovery', 'chemo', 'injury', 'medical', 'heal', 'therapy', 'disease',
          'scan', 'biopsy',
        ],
        tagRules: [
          { tag: 'surgery', match: ['surgery', 'operation', 'procedure', 'operating'] },
          { tag: 'diagnosis', match: ['diagnosis', 'diagnosed', 'test results', 'scan', 'biopsy'] },
          { tag: 'recovery', match: ['recovery', 'recovering', 'healing', 'rehab', 'physical therapy'] },
          { tag: 'caregiving', match: ['caregiver', 'caring for', 'looking after', 'caretaker'] },
        ],
      },
      {
        id: 'family',
        label: 'Family',
        hue: 22,
        description: 'Marriage, parenting, children, relatives, household life.',
        keywords: [
          'family', 'marriage', 'wife', 'husband', 'spouse', 'son', 'daughter',
          'kids', 'children', 'child', 'mother', 'father', 'mom', 'dad',
          'parents', 'sister', 'brother', 'divorce', 'baby', 'pregnancy',
          'grandchild', 'adoption',
        ],
        tagRules: [
          { tag: 'marriage', match: ['marriage', 'spouse', 'wife', 'husband', 'divorce', 'separation'] },
          { tag: 'children', match: ['child', 'children', 'kids', 'son', 'daughter', 'baby', 'teenager'] },
          { tag: 'parents', match: ['mother', 'father', 'mom', 'dad', 'parents', 'grandmother', 'grandfather'] },
        ],
      },
      {
        id: 'finances',
        label: 'Finances',
        hue: 262,
        description: 'Work, provision, debt, housing, employment.',
        keywords: [
          'money', 'finances', 'financial', 'job', 'work', 'unemployed', 'debt',
          'rent', 'mortgage', 'bills', 'income', 'layoff', 'laid off',
          'interview', 'business', 'provision', 'afford', 'eviction', 'career',
          'hired',
        ],
        tagRules: [
          { tag: 'employment', match: ['job', 'work', 'unemployed', 'layoff', 'laid off', 'interview', 'hired'] },
          { tag: 'housing', match: ['rent', 'mortgage', 'eviction', 'housing', 'foreclosure'] },
          { tag: 'debt', match: ['debt', 'bills', 'loan', 'afford', 'owe'] },
        ],
      },
      {
        id: 'faith',
        label: 'Faith',
        hue: 200,
        description: 'Spiritual growth, doubt, discipleship, church life.',
        keywords: [
          'faith', 'god', 'jesus', 'church', 'scripture', 'bible', 'doubt',
          'salvation', 'baptism', 'ministry', 'mission', 'spiritual', 'believe',
          'worship', 'discipleship', 'calling', 'prodigal',
        ],
        tagRules: [
          { tag: 'doubt', match: ['doubt', 'doubting', 'questioning', 'wrestling', 'struggling with faith'] },
          { tag: 'discipleship', match: ['discipleship', 'growth', 'bible', 'scripture', 'study'] },
          { tag: 'ministry', match: ['ministry', 'mission', 'calling', 'serving', 'missionary'] },
        ],
      },
      {
        id: 'grief',
        label: 'Grief & Loss',
        hue: 232,
        defaultPriority: 'high',
        description: 'Death, bereavement, mourning, funerals.',
        keywords: [
          'died', 'death', 'passed away', 'funeral', 'grief', 'grieving',
          'loss', 'mourning', 'bereaved', 'widow', 'widower', 'miscarriage',
          'burial', 'hospice', 'passing', 'buried', 'bury', 'memorial',
          'graveside', 'eulogy',
        ],
        tagRules: [
          { tag: 'bereavement', match: ['died', 'death', 'passed away', 'loss', 'lost'] },
          { tag: 'funeral', match: ['funeral', 'memorial', 'burial', 'buried', 'bury', 'graveside', 'service'] },
          { tag: 'anniversary', match: ['anniversary', 'birthday', 'holidays', 'first christmas'] },
        ],
      },
      {
        id: 'emotional',
        label: 'Emotional',
        hue: 330,
        defaultPriority: 'high',
        description: 'Anxiety, depression, loneliness, fear, mental health.',
        keywords: [
          'anxiety', 'anxious', 'depressed', 'depression', 'lonely',
          'loneliness', 'fear', 'afraid', 'scared', 'stress', 'stressed',
          'overwhelmed', 'panic', 'hopeless', 'worry', 'worried', 'burnout',
          'mental health', 'despair', 'exhausted',
          // People rarely name the feeling. They describe the body and the
          // sleep, so those have to count as signal too.
          'sleep', 'sleepless', 'insomnia', 'awake', 'dread', 'on edge',
          'restless', 'tense', 'bracing', 'chest is tight', 'cant stop',
        ],
        tagRules: [
          { tag: 'anxiety', match: ['anxiety', 'anxious', 'panic', 'worry', 'worried', 'nervous', 'on edge', 'dread', 'bracing'] },
          { tag: 'sleep', match: ['sleep', 'sleepless', 'insomnia', 'awake', 'restless'] },
          { tag: 'depression', match: ['depressed', 'depression', 'hopeless', 'despair', 'empty'] },
          { tag: 'loneliness', match: ['lonely', 'loneliness', 'isolated', 'alone', 'no one'] },
          { tag: 'burnout', match: ['burnout', 'exhausted', 'overwhelmed', 'stretched', 'running on empty'] },
        ],
      },
      {
        id: 'gratitude',
        label: 'Gratitude',
        hue: 88,
        defaultPriority: 'low',
        description: 'Praise, answered prayer, thanksgiving, celebration.',
        keywords: [
          'thank', 'thanks', 'thankful', 'grateful', 'gratitude', 'praise',
          'answered', 'celebrate', 'celebration', 'blessed', 'blessing',
          'rejoice', 'good news', 'engaged', 'graduated', 'finalized',
        ],
        tagRules: [
          { tag: 'answered-prayer', match: ['answered', 'answered prayer', 'came through', 'breakthrough'] },
          { tag: 'milestone', match: ['graduated', 'engaged', 'married', 'born', 'adoption', 'anniversary', 'finalized'] },
          { tag: 'recovery', match: ['recovered', 'remission', 'clear', 'healthy again'] },
        ],
      },
      {
        id: 'other',
        label: 'Other',
        hue: 220,
        description: "Anything that doesn't fit the categories above.",
        keywords: [],
        tagRules: [],
        fallback: true,
      },
    ],
  },
];

export const DEFAULT_PRESET_ID = 'support';

export function getPreset(id) {
  return PRESETS.find((preset) => preset.id === id) ?? PRESETS[0];
}

/** The widget props a preset implies. Spread straight onto `<IntakeWidget>`. */
export function presetProps(id) {
  const { prompt, subtitle, placeholder, submitLabel, categories, accent } =
    getPreset(id);
  return { title: prompt, subtitle, placeholder, submitLabel, categories, accent };
}
