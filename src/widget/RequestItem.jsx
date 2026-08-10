import { CategoryBadge } from './CategoryBadge.jsx';
import { AlertIcon, RetryIcon, TrashIcon } from './Icons.jsx';
import { categoryVars } from '../lib/theme.js';
import styles from './widget.module.css';

export function RequestItem({ request, onRetry, onRemove, showTimestamps }) {
  const { status, text, category, confidence, summary, error, createdAt } = request;

  return (
    <li
      className={`${styles.item} ${styles[`item_${status}`] ?? ''}`}
      style={categoryVars(category)}
    >
      <div className={styles.itemHeader}>
        {status === 'pending' && (
          <span className={styles.pendingBadge}>
            <span className={styles.pendingDots} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            Categorizing
          </span>
        )}
        {status === 'done' && (
          <CategoryBadge category={category} confidence={confidence} />
        )}
        {status === 'error' && (
          <span className={styles.errorBadge}>
            <AlertIcon width={14} height={14} />
            Not categorized
          </span>
        )}

        <div className={styles.itemActions}>
          {showTimestamps && createdAt && (
            <time className={styles.timestamp} dateTime={createdAt}>
              {formatTime(createdAt)}
            </time>
          )}
          {status === 'error' && (
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => onRetry(request.id)}
              title="Try again"
            >
              <RetryIcon width={14} height={14} />
              <span className={styles.srOnly}>Try categorizing again</span>
            </button>
          )}
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => onRemove(request.id)}
            title="Remove"
          >
            <TrashIcon width={14} height={14} />
            <span className={styles.srOnly}>Remove this request</span>
          </button>
        </div>
      </div>

      <p className={styles.itemText}>{text}</p>

      {summary && status === 'done' && (
        <p className={styles.itemSummary}>{summary}</p>
      )}
      {status === 'error' && error && <p className={styles.itemError}>{error}</p>}
    </li>
  );
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
