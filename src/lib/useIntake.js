import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fallbackCategory, resolveCategories } from './categories.js';
import { PRIORITIES } from './classification.js';
import { resolveProvider } from './providers/index.js';
import { STORAGE_KEY } from './product.js';
import { clearSubmissions, loadSubmissions, saveSubmissions } from './storage.js';

let counter = 0;
const nextId = () => `si-${Date.now().toString(36)}-${(counter += 1).toString(36)}`;

/**
 * The headless API. All widget state lives here, exported so you can build your
 * own UI on top of this project's logic and keep the classification, retry,
 * abort, and persistence behavior.
 *
 * An IntakeSubmission looks like:
 *   { id, text, status, createdAt,
 *     category, priority, tags, confidence, summary, source, error }
 *
 * `status` is 'pending' | 'done' | 'error'; the classification fields are null
 * until it resolves.
 */
export function useIntake({
  provider = 'mock',
  endpoint,
  apiKey,
  model,
  headers,
  credentials,
  retries,
  categories: categoriesProp,
  persist = true,
  storageKey = STORAGE_KEY,
  onClassified,
  onError,
} = {}) {
  const categories = useMemo(
    () => resolveCategories(categoriesProp),
    [categoriesProp]
  );

  const activeStorageKey = persist ? storageKey : null;
  const [submissions, setSubmissions] = useState(() => loadSubmissions(activeStorageKey));
  const [error, setError] = useState(null);

  // In-flight requests, so unmounting or clearing cancels the network calls
  // instead of leaking them and warning on a dead component.
  const controllers = useRef(new Map());

  // Callbacks live in a ref so an inline arrow prop doesn't re-create `submit`
  // on every render of the host.
  const callbacks = useRef({ onClassified, onError });
  useEffect(() => {
    callbacks.current = { onClassified, onError };
  });

  const classify = useMemo(
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
    saveSubmissions(activeStorageKey, submissions);
  }, [activeStorageKey, submissions]);

  useEffect(
    () => () => {
      for (const controller of controllers.current.values()) controller.abort();
      controllers.current.clear();
    },
    []
  );

  const patch = useCallback((id, changes) => {
    setSubmissions((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );
  }, []);

  const run = useCallback(
    async (id, text) => {
      const controller = new AbortController();
      controllers.current.set(id, controller);

      try {
        const result = await classify({ text, categories, signal: controller.signal });

        const category =
          categories.find((c) => c.id === result?.categoryId) ??
          fallbackCategory(categories);

        const done = {
          status: 'done',
          category,
          priority: result?.priority ?? 'normal',
          tags: result?.tags ?? [],
          confidence: result?.confidence ?? null,
          summary: result?.summary ?? null,
          source: result?.provider ?? null,
          error: null,
        };

        patch(id, done);
        setError(null);
        callbacks.current.onClassified?.({ id, text, ...done });
      } catch (err) {
        if (err?.name === 'AbortError') return;

        const message = err?.message ?? 'Something went wrong classifying that message.';
        patch(id, { status: 'error', error: message });
        setError(message);
        callbacks.current.onError?.(err);
      } finally {
        controllers.current.delete(id);
      }
    },
    [classify, categories, patch]
  );

  const submit = useCallback(
    (text) => {
      const trimmed = String(text ?? '').trim();
      if (!trimmed) return null;

      const id = nextId();
      // Optimistic: the submission is on screen before the classifier answers,
      // so the person sees their words land immediately.
      setSubmissions((current) => [
        ...current,
        {
          id,
          text: trimmed,
          status: 'pending',
          category: null,
          priority: null,
          tags: [],
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
      const target = submissions.find((item) => item.id === id);
      if (!target) return;
      patch(id, { status: 'pending', error: null });
      run(id, target.text);
    },
    [submissions, patch, run]
  );

  const remove = useCallback((id) => {
    controllers.current.get(id)?.abort();
    controllers.current.delete(id);
    setSubmissions((current) => current.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => {
    for (const controller of controllers.current.values()) controller.abort();
    controllers.current.clear();
    setSubmissions([]);
    setError(null);
    clearSubmissions(activeStorageKey);
  }, [activeStorageKey]);

  const stats = useMemo(() => {
    const done = submissions.filter((item) => item.status === 'done');

    const byCategoryCount = new Map();
    const byPriorityCount = new Map();
    for (const item of done) {
      if (item.category) {
        byCategoryCount.set(item.category.id, (byCategoryCount.get(item.category.id) ?? 0) + 1);
      }
      if (item.priority) {
        byPriorityCount.set(item.priority, (byPriorityCount.get(item.priority) ?? 0) + 1);
      }
    }

    return {
      total: submissions.length,
      classified: done.length,
      pending: submissions.filter((item) => item.status === 'pending').length,
      failed: submissions.filter((item) => item.status === 'error').length,
      byCategory: categories
        .map((category) => ({ category, count: byCategoryCount.get(category.id) ?? 0 }))
        .filter((entry) => entry.count > 0)
        .sort((a, b) => b.count - a.count),
      byPriority: PRIORITIES.map((priority) => ({
        priority,
        count: byPriorityCount.get(priority) ?? 0,
      })).filter((entry) => entry.count > 0),
    };
  }, [submissions, categories]);

  return {
    submissions,
    categories,
    stats,
    error,
    isBusy: stats.pending > 0,
    latest: submissions[submissions.length - 1] ?? null,
    submit,
    retry,
    remove,
    clear,
  };
}
