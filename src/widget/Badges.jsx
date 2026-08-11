import { categoryVars, priorityVars } from '../lib/theme.js';
import styles from './widget.module.css';

export function CategoryBadge({ category, size = 'md' }) {
  if (!category) return null;

  return (
    <span
      className={`${styles.badge} ${size === 'sm' ? styles.badgeSm : ''}`}
      style={categoryVars(category)}
      title={category.description || undefined}
    >
      <span className={styles.badgeDot} aria-hidden="true" />
      {category.label}
    </span>
  );
}

/**
 * Priority is the field people scan for, so it gets a solid fill rather than
 * the category badge's tint. "Urgent" also gets a pulse -- the one place in the
 * widget where motion carries meaning rather than polish.
 */
export function PriorityBadge({ priority, size = 'md' }) {
  if (!priority) return null;

  return (
    <span
      className={[
        styles.priority,
        size === 'sm' ? styles.badgeSm : '',
        priority === 'urgent' ? styles.priorityUrgent : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={priorityVars(priority)}
    >
      {/* The label alone reads as an adjective out of context; the prefix makes
          it unambiguous to a screen reader. */}
      <span className={styles.srOnly}>Priority: </span>
      {priority}
    </span>
  );
}

export function TagList({ tags, size = 'md' }) {
  if (!tags?.length) return null;

  return (
    <ul className={`${styles.tags} ${size === 'sm' ? styles.tagsSm : ''}`}>
      {tags.map((tag) => (
        <li key={tag} className={styles.tag}>
          {tag}
        </li>
      ))}
    </ul>
  );
}

/**
 * Confidence is the classifier's own estimate, not a calibrated probability.
 * The tooltip says so rather than letting the number imply more than it means.
 */
export function ConfidenceMeter({ confidence }) {
  if (typeof confidence !== 'number') return null;
  const percent = Math.round(confidence * 100);

  return (
    <span
      className={styles.confidence}
      title="The classifier's own estimate that this category is correct. Not a calibrated probability."
    >
      <span className={styles.confidenceTrack} aria-hidden="true">
        <span className={styles.confidenceFill} style={{ width: `${percent}%` }} />
      </span>
      <span className={styles.confidenceValue}>
        <span className={styles.srOnly}>Classifier confidence: </span>
        {percent}%
      </span>
    </span>
  );
}
