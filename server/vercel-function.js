/**
 * The same endpoint as a serverless function.
 *
 * Vercel: save as `api/categorize.js` in your project and set OPENAI_API_KEY in
 * the project's environment variables. Netlify and Cloudflare Workers need only
 * the handler signature changed.
 *
 * Then point the widget at it:
 *   <PrayerRequestWidget provider="endpoint" endpoint="/api/categorize" />
 *
 * A platform-managed function is the easiest correct answer for a portfolio
 * site: no server to run, and the key stays out of the browser.
 */
const CATEGORIES = [
  { id: 'health', label: 'Health', description: 'Illness, recovery, surgery, caregiving.' },
  { id: 'family', label: 'Family', description: 'Marriage, parenting, relatives.' },
  { id: 'finances', label: 'Finances', description: 'Work, provision, debt, housing.' },
  { id: 'faith', label: 'Faith', description: 'Spiritual growth, doubt, church life.' },
  { id: 'grief', label: 'Grief & Loss', description: 'Death, bereavement, mourning.' },
  { id: 'emotional', label: 'Emotional', description: 'Anxiety, depression, loneliness, fear.' },
  { id: 'guidance', label: 'Guidance', description: 'Decisions, direction, transitions.' },
  { id: 'gratitude', label: 'Gratitude', description: 'Praise, answered prayer, thanksgiving.' },
  { id: 'other', label: 'Other', description: "Anything that doesn't fit above." },
];

const MAX_TEXT_LENGTH = 2000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) {
    return res.status(400).json({ error: { message: '`text` is required' } });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(413).json({ error: { message: 'Request text is too long' } });
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt() },
          { role: 'user', content: text },
        ],
      }),
    });

    if (!upstream.ok) throw new Error(`OpenAI responded ${upstream.status}`);

    const payload = await upstream.json();
    const parsed = JSON.parse(payload.choices?.[0]?.message?.content ?? '{}');

    return res.status(200).json({
      category: parsed.category ?? 'other',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : null,
      summary: typeof parsed.summary === 'string' ? parsed.summary : null,
    });
  } catch (error) {
    console.error('[categorize]', error.message);
    return res.status(502).json({ error: { message: 'Categorization failed' } });
  }
}

function systemPrompt() {
  const list = CATEGORIES.map(
    (c) => `- ${c.id}: ${c.label} -- ${c.description}`
  ).join('\n');

  return [
    'You sort prayer requests submitted to a church into one category.',
    'These are real people writing about hard things. Be accurate and never judgmental.',
    '',
    'Categories:',
    list,
    '',
    'Reply with JSON only, in this exact shape:',
    '{"category": "<category id from the list>", "confidence": <0 to 1>, "summary": "<neutral restatement, at most 12 words>"}',
    '',
    'Rules:',
    '- "category" must be one of the ids above, verbatim.',
    '- Pick the single dominant need when a request touches several categories.',
    '- Use "other" when nothing fits, rather than forcing a match.',
    '- The summary restates the request. Never add advice, judgment, or scripture.',
  ].join('\n');
}
