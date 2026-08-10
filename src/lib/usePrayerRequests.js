import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveCategories, FALLBACK_CATEGORY_ID } from './categories.js';
import { resolveProvider } from './providers/index.js';
import { clearRequests, loadRequests, saveRequests } from './storage.js';

let counter = 0;
const nextId = () =>
  `prw-${Date.now().toString(36)}-${(counter += 1).toString(36)}`;

/**
 * All widget state in one hook, exported so you can build your own UI on top of
 * this project's logic and keep the categorization, retry, and persistence.
 */
export function usePrayerRequests({
  provider = 'mock',
  endpoint,
  apiKey,
  model,
  headers,
  credentials,
  retries,
  categories: categoriesProp,
  persist = true,
  storageKey = 'prayer-request-widget:v2',
  onResult,
  onError,
} = {}) {
  const categories = useMemo(
    () => resolveCategories(categoriesProp),
    [categoriesProp]
  );

  const activeStorageKey = persist ? storageKey : null;
  const [requests, setRequests] = useState(() => loadRequests(activeStorageKey));
  const [error, setError] = useState(null);

  // In-flight requests, so unmounting or clearing cancels the network calls
  // instead of leaking them and warning on a dead component.
  const controllers = useRef(new Map());

  // Callbacks live in a ref so an inline arrow prop doesn't re-create `submit`
  // on every render of the host.
  const callbacks = useRef({ onResult, onError });
  useEffect(() => {
    callbacks.current = { onResult, onError };
  });

  const categorize = useMemo(
    () =>
      resolveProvider(provider, {
        endpoint,
        apiKey,
        model,
        headers,
        credentials,
        retries,
      }),
    [provider, endpoint, apiKey, model, headers, credentials, retries]
  );

  useEffect(() => {
    saveRequests(activeStorageKey, requests);
  }, [activeStorageKey, requests]);

  useEffect(
    () => () => {
      for (const controller of controllers.current.values()) controller.abort();
      controllers.current.clear();
    },
    []
  );

  const patch = useCallback((id, changes) => {
    setRequests((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );
  }, []);

  const run = useCallback(
    async (id, text) => {
      const controller = new AbortController();
      controllers.current.set(id, controller);

      try {
        const result = await categorize({
          text,
          categories,
          signal: controller.signal,
        });

        const category =
          categories.find((c) => c.id === result?.categoryId) ??
          categories.find((c) => c.id === FALLBACK_CATEGORY_ID);

        const done = {
          status: 'done',
          category,
          confidence: result?.confidence ?? null,
          summary: result?.summary ?? null,
          source: result?.provider ?? null,
          error: null,
        };

        patch(id, done);
        setError(null);
        callbacks.current.onResult?.({ id, text, ...done });
      } catch (err) {
        if (err?.name === 'AbortError') return;

        const message =
          err?.message ?? 'Something went wrong categorizing that request.';
        patch(id, { status: 'error', error: message });
        setError(message);
        callbacks.current.onError?.(err);
      } finally {
        controllers.current.delete(id);
      }
    },
    [categorize, categories, patch]
  );

  const submit = useCallback(
    (text) => {
      const trimmed = String(text ?? '').trim();
      if (!trimmed) return null;

      const id = nextId();
      // Optimistic: the request is on screen before the model answers, so the
      // person sees their words land immediately.
      setRequests((current) => [
        ...current,
        {
          id,
          text: trimmed,
          status: 'pending',
          category: null,
          confidence: null,
          summary: null,
          error: null,
          createdAt: new Date().toISOString(),
        },
      ]);

      run(id, trimmed);
      return id;
    },
    [run]
  );

  const retry = useCallback(
    (id) => {
      const target = requests.find((item) => item.id === id);
      if (!target) return;
      patch(id, { status: 'pending', error: null });
      run(id, target.text);
    },
    [requests, patch, run]
  );

  const remove = useCallback((id) => {
    controllers.current.get(id)?.abort();
    controllers.current.delete(id);
    setRequests((current) => current.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => {
    for (const controller of controllers.current.values()) controller.abort();
    controllers.current.clear();
    setRequests([]);
    setError(null);
    clearRequests(activeStorageKey);
  }, [activeStorageKey]);

  const stats = useMemo(() => {
    const done = requests.filter((item) => item.status === 'done');
    const counts = new Map();
    for (const item of done) {
      if (!item.category) continue;
      counts.set(item.category.id, (counts.get(item.category.id) ?? 0) + 1);
    }

    return {
      total: requests.length,
      categorized: done.length,
      pending: requests.filter((item) => item.status === 'pending').length,
      failed: requests.filter((item) => item.status === 'error').length,
      byCategory: categories
        .map((category) => ({ category, count: counts.get(category.id) ?? 0 }))
        .filter((entry) => entry.count > 0)
        .sort((a, b) => b.count - a.count),
    };
  }, [requests, categories]);

  return {
    requests,
    categories,
    stats,
    error,
    isBusy: stats.pending > 0,
    submit,
    retry,
    remove,
    clear,
  };
}
