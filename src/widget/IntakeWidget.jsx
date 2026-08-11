import { useEffect, useState } from 'react';
import { IntakeForm } from './IntakeForm.jsx';
import { ResultList } from './ResultList.jsx';
import { StatsBar } from './StatsBar.jsx';
import { LockIcon, TrashIcon } from './Icons.jsx';
import { useIntake } from '../lib/useIntake.js';
import { buildThemeVars } from '../lib/theme.js';
import { STORAGE_KEY } from '../lib/product.js';
import styles from './widget.module.css';

/**
 * The whole widget. Self-contained, theme-aware, and safe to drop into a page
 * you don't control: styles are CSS-module scoped, colors come from custom
 * properties set on this element, and nothing touches document or body.
 *
 * Every preset in the demo is this component with different props. There is no
 * per-use-case branch anywhere below this line.
 */
export function IntakeWidget({
  // --- classification ---
  provider = 'mock',
  endpoint,
  apiKey,
  model,
  headers,
  credentials,
  retries,
  categories,

  // --- copy ---
  title = 'How can we help?',
  subtitle = 'Tell us what you need and it will reach the right team.',
  placeholder = 'Describe what you need...',
  submitLabel = 'Send request',
  helperText = 'Press Cmd/Ctrl + Enter to submit.',
  emptyText = 'Classified submissions will appear here.',
  privacyNote = 'Submissions stay in this browser.',

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
  showJson = true,

  // --- behavior ---
  maxLength = 600,
  persist = true,
  storageKey = STORAGE_KEY,
  disabled = false,

  // --- escape hatches ---
  onSubmit,
  onClassified,
  onError,
  className = '',
  style,
}) {
  const { submissions, stats, error, isBusy, submit, retry, remove, clear } = useIntake({
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
    onClassified,
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

      <IntakeForm
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

      {/* Announced, not just colored -- the form may be off-screen by the time
          a slow request resolves. */}
      <div className={styles.srOnly} role="status" aria-live="polite">
        {isBusy ? 'Classifying your message.' : ''}
        {error ? `Error: ${error}` : ''}
      </div>

      {showStats && <StatsBar stats={stats} />}

      <div className={styles.listHeader}>
        {submissions.length > 0 && (
          <>
            <span className={styles.listTitle}>
              {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
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

      <ResultList
        submissions={submissions}
        onRetry={retry}
        onRemove={remove}
        showTimestamps={showTimestamps}
        showJson={showJson}
        emptyText={emptyText}
      />
    </section>
  );
}

/**
 * `auto` follows the host's color scheme. Resolved in JS rather than with a
 * media query so an explicit `theme` prop always wins -- a host rendering this
 * inside a dark panel on a light page needs to be able to say so.
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

export default IntakeWidget;
