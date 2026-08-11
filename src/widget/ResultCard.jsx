import { useState } from 'react';
import { CategoryBadge, ConfidenceMeter, PriorityBadge, TagList } from './Badges.jsx';
import { AlertIcon, CodeIcon, RetryIcon, TrashIcon } from './Icons.jsx';
import { categoryVars } from '../lib/theme.js';
import styles from './widget.module.css';

/**
 * One submission and what the classifier made of it.
 *
 * The classification is the product demo, so it's laid out as labelled fields
 * rather than a line of prose -- Category / Priority / Tags read at a glance,
 * which is how someone triaging an inbox would actually use it.
 */
export function ResultCard({ submission, onRetry, onRemove, showTimestamps, showJson }) {
  const [jsonOpen, setJsonOpen] = useState(false);
  const { status, text, category, priority, tags, confidence, summary, error, createdAt } =
    submission;

  return (
    <li
      className={`${styles.card} ${styles[`card_${status}`] ?? ''}`}
      style={categoryVars(category)}
    >
      <div className={styles.cardHeader}>
        <p className={styles.cardText}>{text}</p>

        <div className={styles.cardActions}>
          {showTimestamps && createdAt && (
            <time className={styles.timestamp} dateTime={createdAt}>
              {formatTime(createdAt)}
            </time>
          )}
          {status === 'done' && showJson && (
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setJsonOpen((open) => !open)}
              aria-expanded={jsonOpen}
              title={jsonOpen ? 'Hide JSON' : 'Show JSON'}
            >
              <CodeIcon width={14} height={14} />
              <span className={styles.srOnly}>
                {jsonOpen ? 'Hide the raw result' : 'Show the raw result'}
              </span>
            </button>
          )}
          {status === 'error' && (
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => onRetry(submission.id)}
              title="Try again"
            >
              <RetryIcon width={14} height={14} />
              <span className={styles.srOnly}>Try classifying again</span>
            </button>
          )}
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => onRemove(submission.id)}
            title="Remove"
          >
            <TrashIcon width={14} height={14} />
            <span className={styles.srOnly}>Remove this submission</span>
          </button>
        </div>
      </div>

      {status === 'pending' && (
        <div className={styles.pendingRow}>
          <span className={styles.pendingDots} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Classifying
        </div>
      )}

      {status === 'error' && (
        <div className={styles.errorRow}>
          <AlertIcon width={14} height={14} />
          {error || 'Could not classify this message.'}
        </div>
      )}

      {status === 'done' && (
        <>
          <dl className={styles.fields}>
            <div className={styles.field}>
              <dt className={styles.fieldLabel}>Category</dt>
              <dd className={styles.fieldValue}>
                <CategoryBadge category={category} />
              </dd>
            </div>

            <div className={styles.field}>
              <dt className={styles.fieldLabel}>Priority</dt>
              <dd className={styles.fieldValue}>
                <PriorityBadge priority={priority} />
              </dd>
            </div>

            {tags?.length > 0 && (
              <div className={`${styles.field} ${styles.fieldWide}`}>
                <dt className={styles.fieldLabel}>Tags</dt>
                <dd className={styles.fieldValue}>
                  <TagList tags={tags} />
                </dd>
              </div>
            )}

            {typeof confidence === 'number' && (
              <div className={styles.field}>
                <dt className={styles.fieldLabel}>Confidence</dt>
                <dd className={styles.fieldValue}>
                  <ConfidenceMeter confidence={confidence} />
                </dd>
              </div>
            )}
          </dl>

          {summary && <p className={styles.summary}>{summary}</p>}

          {jsonOpen && (
            <pre className={styles.json}>
              <code>{formatJson(submission)}</code>
            </pre>
          )}
        </>
      )}
    </li>
  );
}

/** Exactly the shape `onClassified` receives, minus UI-only bookkeeping. */
function formatJson({ category, priority, tags, confidence, summary }) {
  return JSON.stringify(
    {
      category: category?.id ?? null,
      priority,
      tags,
      confidence,
      summary,
    },
    null,
    2
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
