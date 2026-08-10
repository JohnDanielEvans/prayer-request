/** Error carrying enough context for the UI to say something useful. */
export class CategorizeError extends Error {
  constructor(message, { status, cause, retryable = false } = {}) {
    super(message);
    this.name = 'CategorizeError';
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
      throw new CategorizeError(
        timeoutController.signal.aborted
          ? 'The categorizer timed out. Please try again.'
          : 'Could not reach the categorizer. Check your connection.',
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

    throw new CategorizeError(messageForStatus(response.status, await safeText(response)), {
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
  const suffix = detail ? ` (${detail.slice(0, 140)})` : '';
  if (status === 401 || status === 403) {
    return `The categorizer rejected the request -- check the API credentials.${suffix}`;
  }
  if (status === 429) {
    return `Rate limited by the categorizer. Wait a moment and try again.${suffix}`;
  }
  if (status >= 500) {
    return `The categorizer is having trouble right now.${suffix}`;
  }
  return `Categorization failed with status ${status}.${suffix}`;
}

async function safeText(response) {
  try {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      return json?.error?.message ?? json?.message ?? text;
    } catch {
      return text;
    }
  } catch {
    return '';
  }
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
