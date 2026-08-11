/**
 * Reference classification endpoint. Zero dependencies -- `node server/node-proxy.mjs`.
 *
 * This is the piece that makes the widget safe to deploy. The browser posts
 * message text here; this process holds the API key and talks to the model. The
 * key never ships to a client, so it can't be lifted out of your bundle.
 *
 *   OPENAI_API_KEY=sk-... node server/node-proxy.mjs
 *   <IntakeWidget provider="endpoint" endpoint="http://localhost:8787/api/classify" />
 *
 * It reuses the widget's own prompt and validators (src/lib), so the server and
 * the browser agree on what a valid ClassificationResult is. Validation happens
 * here as well as client-side: the endpoint is trusted infrastructure, but the
 * model behind it isn't.
 *
 * Treat it as a starting point, not a finished service. Before production: put
 * it behind your real backend or a serverless function, use a durable
 * rate-limit store instead of the in-memory one below, and set ALLOWED_ORIGINS.
 */
import { createServer } from 'node:http';
import { DEFAULT_CATEGORIES, resolveCategories } from '../src/lib/categories.js';
import { buildSystemPrompt, toClassification } from '../src/lib/providers/shared.js';
import { parseJsonLoose } from '../src/lib/normalize.js';

const PORT = Number(process.env.PORT ?? 8787);
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const MAX_BODY_BYTES = 16 * 1024;
const MAX_TEXT_LENGTH = 2000;
const MAX_CATEGORIES = 24;
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
  if (req.method !== 'POST' || !req.url.startsWith('/api/classify')) {
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
  if (!text) return end(res, 400, { error: { message: '`text` is required' } });
  if (text.length > MAX_TEXT_LENGTH) {
    return end(res, 413, { error: { message: 'Message text is too long' } });
  }

  const categories = readCategories(body?.categories);

  try {
    const result = await classify(text, categories);
    return end(res, 200, result);
  } catch (error) {
    // Never echo the upstream error verbatim; it can contain key metadata.
    console.error('[proxy] classification failed:', error.message);
    return end(res, 502, { error: { message: 'Classification failed' } });
  }
});

/**
 * The widget sends the categories it is configured with, which is what makes
 * the endpoint reusable across forms. They're still bounded and normalized --
 * a caller shouldn't be able to reshape the prompt or send a thousand of them.
 *
 * If you'd rather pin the taxonomy server-side, ignore `body.categories` and
 * return your own list here instead.
 */
function readCategories(input) {
  if (!Array.isArray(input) || input.length === 0) return DEFAULT_CATEGORIES;

  const cleaned = input
    .filter((c) => c && typeof c.id === 'string' && typeof c.label === 'string')
    .slice(0, MAX_CATEGORIES)
    .map((c) => ({
      id: c.id.slice(0, 40),
      label: c.label.slice(0, 60),
      description: typeof c.description === 'string' ? c.description.slice(0, 200) : '',
    }));

  return cleaned.length > 0 ? resolveCategories(cleaned) : DEFAULT_CATEGORIES;
}

async function classify(text, categories) {
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

  if (!response.ok) throw new Error(`OpenAI responded ${response.status}`);

  const payload = await response.json();
  const parsed = parseJsonLoose(payload.choices?.[0]?.message?.content) ?? {};

  // Same validator the browser uses: the category is forced back into the
  // configured set, priority into the enum, tags normalized and capped.
  const result = toClassification({
    raw: parsed,
    text,
    categories,
    provider: 'endpoint',
  });

  return {
    category: result.categoryId,
    priority: result.priority,
    tags: result.tags,
    confidence: result.confidence,
    summary: result.summary,
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
  console.log(`Smart Intake classifier proxy -> http://localhost:${PORT}/api/classify`);
  console.log(`Model: ${MODEL} · Origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
