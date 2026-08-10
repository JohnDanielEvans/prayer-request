/**
 * Reference categorization endpoint. Zero dependencies -- `node server/node-proxy.mjs`.
 *
 * This is the piece that makes the widget safe to deploy. The browser posts
 * request text here; this process holds the API key and talks to OpenAI. The
 * key never ships to a client, so it can't be lifted out of your bundle.
 *
 *   OPENAI_API_KEY=sk-... node server/node-proxy.mjs
 *   <PrayerRequestWidget provider="endpoint" endpoint="http://localhost:8787/api/categorize" />
 *
 * Treat it as a starting point, not a finished service. Before production:
 * put it behind your real backend or a serverless function, use a durable
 * rate-limit store (Redis) instead of the in-memory one below, and set
 * ALLOWED_ORIGINS to your own domains.
 */
import { createServer } from 'node:http';
import { DEFAULT_CATEGORIES } from '../src/lib/categories.js';
import { buildSystemPrompt } from '../src/lib/providers/openai.js';

const PORT = Number(process.env.PORT ?? 8787);
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const MAX_BODY_BYTES = 8 * 1024;
const MAX_TEXT_LENGTH = 2000;
const RATE_LIMIT = { windowMs: 60_000, max: 20 };

if (!API_KEY) {
  console.error('Set OPENAI_API_KEY before starting the proxy.');
  process.exit(1);
}

/** In-memory and per-process: fine for one box, wrong behind a load balancer. */
const hits = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const record = hits.get(ip);

  if (!record || now > record.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return { ok: true };
  }
  if (record.count >= RATE_LIMIT.max) {
    return { ok: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count += 1;
  return { ok: true };
}

// Unbounded growth is a slow leak on a long-lived process.
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of hits) if (now > record.resetAt) hits.delete(ip);
}, RATE_LIMIT.windowMs).unref();

const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  const allowed =
    ALLOWED_ORIGINS.includes('*') || (origin && ALLOWED_ORIGINS.includes(origin));

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin ?? '*');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return end(res, 204, null);
  if (req.method !== 'POST' || !req.url.startsWith('/api/categorize')) {
    return end(res, 404, { error: { message: 'Not found' } });
  }
  if (origin && !allowed) {
    return end(res, 403, { error: { message: 'Origin not allowed' } });
  }

  const ip = req.socket.remoteAddress ?? 'unknown';
  const limit = rateLimit(ip);
  if (!limit.ok) {
    res.setHeader('Retry-After', String(limit.retryAfter));
    return end(res, 429, { error: { message: 'Too many requests' } });
  }

  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch (error) {
    return end(res, 400, { error: { message: error.message } });
  }

  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return end(res, 400, { error: { message: '`text` is required' } });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return end(res, 413, { error: { message: 'Request text is too long' } });
  }

  // Trust our own category list over whatever the client posted -- a caller
  // shouldn't be able to reshape the prompt.
  const categories = Array.isArray(body?.categories) && body.categories.length
    ? body.categories.filter((c) => DEFAULT_CATEGORIES.some((d) => d.id === c.id))
    : DEFAULT_CATEGORIES;

  try {
    const result = await categorize(text, categories.length ? categories : DEFAULT_CATEGORIES);
    return end(res, 200, result);
  } catch (error) {
    // Never echo the upstream error verbatim; it can contain key metadata.
    console.error('[proxy] categorization failed:', error.message);
    return end(res, 502, { error: { message: 'Categorization failed' } });
  }
});

async function categorize(text, categories) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(categories) },
        { role: 'user', content: text },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`OpenAI responded ${response.status}`);
  }

  const payload = await response.json();
  const parsed = JSON.parse(payload.choices?.[0]?.message?.content ?? '{}');

  return {
    category: parsed.category ?? 'other',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : null,
    summary: typeof parsed.summary === 'string' ? parsed.summary : null,
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function end(res, status, payload) {
  if (payload === null) {
    res.writeHead(status);
    res.end();
    return;
  }
  const json = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

server.listen(PORT, () => {
  console.log(`Prayer categorizer proxy -> http://localhost:${PORT}/api/categorize`);
  console.log(`Model: ${MODEL} · Origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
