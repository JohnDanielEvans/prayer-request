/** Error carrying enough context for the UI to say something useful. */
export class ClassificationError extends Error {
  constructor(message, { status, cause, retryable = false } = {}) {
    super(message);
    this.name = 'ClassificationError';
    this.status = status;
    this.retryable = retryable;
    if (cause) this.cause = cause;
  }
}

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  });

/**
 * POST JSON with bounded exponential backoff and jitter.
 *
 * Rate limits (429) are the common failure here -- free-tier OpenAI keys hit
 * them constantly -- so we honor `Retry-After` when the server sends it rather
 * than guessing. Aborts propagate immediately and are never retried.
 */
export async function postJson(url, body, { headers = {}, signal, retries = 3, baseDelay = 800, timeout = 30000 } = {}) {
  let attempt = 0;

  for (;;) {
    const timeoutController = new AbortController();
    const timer = setTimeout(() => timeoutController.abort(), timeout);
    const composed = anySignal([signal, timeoutController.signal]);

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: composed,
      });
    } catch (error) {
      clearTimeout(timer);
      if (signal?.aborted) throw error;

      // Timeout or network blip -- both worth another attempt.
      if (attempt < retries) {
        await sleep(backoffDelay(baseDelay, attempt), signal);
        attempt += 1;
        continue;
      }
      throw new ClassificationError(
        timeoutController.signal.aborted
          ? 'The classifier timed out. Please try again.'
          : 'Could not reach the classifier. Check your connection.',
        { cause: error, retryable: true }
      );
    } finally {
      clearTimeout(timer);
    }

    if (response.ok) return response.json();

    if (RETRYABLE_STATUSES.has(response.status) && attempt < retries) {
      const retryAfter = Number.parseFloat(response.headers.get('retry-after'));
      const delay = Number.isFinite(retryAfter)
        ? retryAfter * 1000
        : backoffDelay(baseDelay, attempt);
      await sleep(delay, signal);
      attempt += 1;
      continue;
    }

    throw new ClassificationError(messageForStatus(response.status, await safeText(response)), {
      status: response.status,
      retryable: RETRYABLE_STATUSES.has(response.status),
    });
  }
}

function backoffDelay(base, attempt) {
  const exponential = base * 2 ** attempt;
  // Jitter keeps a page full of widgets from retrying in lockstep.
  return exponential + Math.random() * base;
}

function messageForStatus(status, detail) {
  const suffix = detail ? ` (${detail})` : '';
  if (status === 401 || status === 403) {
    return `The classifier rejected the request -- check the API credentials.${suffix}`;
  }
  if (status === 429) {
    return `Rate limited by the classifier. Wait a moment and try again.${suffix}`;
  }
  if (status >= 500) {
    return `The classifier is having trouble right now.${suffix}`;
  }
  return `Classification failed with status ${status}.${suffix}`;
}

/**
 * A short, human-usable detail from an error response -- or nothing.
 *
 * Endpoints that fail often answer with an HTML error page, and pasting that
 * into the widget's error message put a doctype and a stylesheet in front of
 * the user. Only structured messages are surfaced; anything that looks like
 * markup is dropped.
 */
async function safeText(response) {
  try {
    const text = (await response.text()).trim();
    if (!text) return '';

    try {
      const json = JSON.parse(text);
      const message = json?.error?.message ?? json?.message;
      return typeof message === 'string' ? clip(message) : '';
    } catch {
      if (text.startsWith('<') || /<\/?[a-z][\s\S]*>/i.test(text.slice(0, 200))) {
        return '';
      }
      return clip(text);
    }
  } catch {
    return '';
  }
}

/** One line, bounded length -- error text belongs in a sentence, not a wall. */
function clip(value, max = 120) {
  const flat = value.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

/** AbortSignal.any, with a fallback for browsers that predate it. */
export function anySignal(signals) {
  const present = signals.filter(Boolean);
  if (present.length === 0) return undefined;
  if (present.length === 1) return present[0];
  if (typeof AbortSignal !== 'undefined' && AbortSignal.any) {
    return AbortSignal.any(present);
  }

  const controller = new AbortController();
  for (const signal of present) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), {
      once: true,
    });
  }
  return controller.signal;
}
