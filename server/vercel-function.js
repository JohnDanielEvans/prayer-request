/**
 * The same endpoint as a serverless function, with no imports from this repo so
 * it can be copied into a project on its own.
 *
 * Vercel: save as `api/classify.js` and set OPENAI_API_KEY in the project's
 * environment variables. Netlify and Cloudflare Workers need only the handler
 * signature changed.
 *
 *   <IntakeWidget provider="endpoint" endpoint="/api/classify" />
 *
 * A platform-managed function is the easiest correct answer for a portfolio
 * site: no server to run, and the key stays out of the browser.
 */

/** Pinned server-side. Swap for your own taxonomy. */
const CATEGORIES = [
  { id: 'billing', label: 'Billing', description: 'Invoices, payments, refunds, subscriptions.' },
  { id: 'technical-support', label: 'Technical Support', description: 'Something is not working, or setup help.' },
  { id: 'account', label: 'Account', description: 'Profile, team members, permissions, settings.' },
  { id: 'bug-report', label: 'Bug Report', description: 'A reproducible defect.' },
  { id: 'feature-request', label: 'Feature Request', description: 'Ideas and suggestions.' },
  { id: 'general', label: 'General', description: "Anything that doesn't fit the others." },
];

const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const MAX_TEXT_LENGTH = 2000;
const MAX_TAGS = 4;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) {
    return res.status(400).json({ error: { message: '`text` is required' } });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(413).json({ error: { message: 'Message text is too long' } });
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

    // Validate before returning. The model is not trusted to stay in the enum.
    return res.status(200).json({
      category: CATEGORIES.some((c) => c.id === parsed.category)
        ? parsed.category
        : 'general',
      priority: PRIORITIES.includes(parsed.priority) ? parsed.priority : 'normal',
      tags: normalizeTags(parsed.tags),
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : null,
      summary: typeof parsed.summary === 'string' ? parsed.summary : null,
    });
  } catch (error) {
    console.error('[classify]', error.message);
    return res.status(502).json({ error: { message: 'Classification failed' } });
  }
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();

  for (const entry of value) {
    if (typeof entry !== 'string') continue;
    const tag = entry
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24);
    if (tag) seen.add(tag);
    if (seen.size >= MAX_TAGS) break;
  }

  return [...seen];
}

function systemPrompt() {
  const list = CATEGORIES.map((c) => `- ${c.id}: ${c.label} -- ${c.description}`).join('\n');

  return [
    'You triage incoming messages submitted through a website contact form.',
    'Classify each message. Be accurate, neutral, and never judgemental.',
    '',
    'Categories:',
    list,
    '',
    'Reply with JSON only, in exactly this shape:',
    '{"category": "<category id>", "priority": "low|normal|high|urgent",',
    ' "tags": ["<1-4 short tags>"], "confidence": <0 to 1>,',
    ' "summary": "<neutral restatement, at most 12 words>"}',
    '',
    'Rules:',
    '- "category" must be one of the ids above, verbatim.',
    '- Use "general" when nothing fits, rather than forcing a match.',
    '- "priority" reflects time-sensitivity for the sender. Reserve "urgent"',
    '  for genuine emergencies, blocked work, or someone at risk.',
    '- "tags" are lowercase, hyphenated, one or two words each.',
    '- "summary" restates the message. Never add advice or judgement.',
  ].join('\n');
}
