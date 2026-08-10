import { useEffect, useState } from 'react';
import { RequestForm } from './RequestForm.jsx';
import { RequestList } from './RequestList.jsx';
import { StatsBar } from './StatsBar.jsx';
import { LockIcon, TrashIcon } from './Icons.jsx';
import { usePrayerRequests } from '../lib/usePrayerRequests.js';
import { buildThemeVars } from '../lib/theme.js';
import styles from './widget.module.css';

/**
 * The whole widget. Self-contained, theme-aware, and safe to drop into a page
 * you don't control: styles are CSS-module scoped, colors come from custom
 * properties set on this element, and nothing touches document or body.
 */
export function PrayerRequestWidget({
  // --- categorization ---
  provider = 'mock',
  endpoint,
  apiKey,
  model,
  headers,
  credentials,
  retries,
  categories,

  // --- copy ---
  title = 'How can we pray for you?',
  subtitle = 'Share a request and it will be sorted so our prayer team can follow up.',
  placeholder = 'Write your prayer request...',
  submitLabel = 'Submit request',
  helperText = 'Press Cmd/Ctrl + Enter to submit.',
  emptyText = 'Your requests will appear here.',
  privacyNote = 'Requests stay in this browser.',

  // --- appearance ---
  theme = 'auto',
  accent,
  radius,
  fontFamily,
  maxWidth,
  density = 'comfortable',
  showHeader = true,
  showStats = true,
  showTimestamps = true,
  showPrivacyNote = true,
  showClear = true,

  // --- behavior ---
  maxLength = 600,
  persist = true,
  storageKey,
  disabled = false,

  // --- escape hatches ---
  onSubmit,
  onResult,
  onError,
  className = '',
  style,
}) {
  const {
    requests,
    stats,
    error,
    isBusy,
    submit,
    retry,
    remove,
    clear,
  } = usePrayerRequests({
    provider,
    endpoint,
    apiKey,
    model,
    headers,
    credentials,
    retries,
    categories,
    persist,
    storageKey,
    onResult,
    onError,
  });

  const resolvedTheme = useResolvedTheme(theme);

  const handleSubmit = (text) => {
    onSubmit?.(text);
    submit(text);
  };

  return (
    <section
      className={[
        styles.widget,
        styles[`theme_${resolvedTheme}`],
        density === 'compact' ? styles.compact : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...buildThemeVars({ accent, radius, fontFamily, maxWidth }), ...style }}
      data-theme={resolvedTheme}
    >
      {showHeader && (
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </header>
      )}

      <RequestForm
        onSubmit={handleSubmit}
        placeholder={placeholder}
        submitLabel={submitLabel}
        helperText={helperText}
        maxLength={maxLength}
        isBusy={isBusy}
        disabled={disabled}
      />

      {showPrivacyNote && persist && (
        <p className={styles.privacy}>
          <LockIcon width={13} height={13} />
          {privacyNote}
        </p>
      )}

      {/* Errors are announced, not just colored -- the form may be off-screen
          by the time a slow request fails. */}
      <div className={styles.srOnly} role="status" aria-live="polite">
        {isBusy ? 'Categorizing your request.' : ''}
        {error ? `Error: ${error}` : ''}
      </div>

      {showStats && <StatsBar stats={stats} />}

      <div className={styles.listHeader}>
        {requests.length > 0 && (
          <>
            <span className={styles.listTitle}>
              {requests.length} {requests.length === 1 ? 'request' : 'requests'}
            </span>
            {showClear && (
              <button type="button" className={styles.textButton} onClick={clear}>
                <TrashIcon width={13} height={13} />
                Clear all
              </button>
            )}
          </>
        )}
      </div>

      <RequestList
        requests={requests}
        onRetry={retry}
        onRemove={remove}
        showTimestamps={showTimestamps}
        emptyText={emptyText}
      />
    </section>
  );
}

/**
 * `auto` follows the host's color scheme. We resolve it in JS rather than with
 * a media query so an explicit `theme` prop always wins -- a host that renders
 * this inside a dark panel on a light page needs to be able to say so.
 */
function useResolvedTheme(theme) {
  const [systemTheme, setSystemTheme] = useState('light');

  useEffect(() => {
    if (theme !== 'auto' || typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemTheme(query.matches ? 'dark' : 'light');

    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [theme]);

  return theme === 'auto' ? systemTheme : theme;
}

export default PrayerRequestWidget;
