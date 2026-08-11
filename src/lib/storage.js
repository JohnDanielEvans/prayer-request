/**
 * localStorage that never throws.
 *
 * Submissions can be personal, so this is deliberately local-only and easy to
 * clear from the UI -- nothing is persisted anywhere else. Private browsing,
 * disabled storage, and quota errors all degrade to in-memory state instead of
 * taking the widget down with them.
 */
const MAX_ENTRIES = 100;

export function loadSubmissions(key) {
  if (!key || typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item.text === 'string')
      .slice(-MAX_ENTRIES)
      .map((item) => ({
        ...item,
        // A submission persisted mid-flight would otherwise reload as a spinner
        // that never resolves.
        status: item.status === 'done' ? 'done' : 'error',
        error: item.status === 'done' ? null : (item.error ?? 'Not classified.'),
        tags: Array.isArray(item.tags) ? item.tags : [],
      }));
  } catch {
    return [];
  }
}

export function saveSubmissions(key, submissions) {
  if (!key || typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      key,
      JSON.stringify(submissions.slice(-MAX_ENTRIES))
    );
  } catch {
    // Quota or a locked-down browser. In-memory state still works.
  }
}

export function clearSubmissions(key) {
  if (!key || typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to do.
  }
}
