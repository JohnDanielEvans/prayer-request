import { categoryVars } from '../lib/theme.js';
import styles from './widget.module.css';

export function CategoryBadge({ category, confidence, size = 'md' }) {
  if (!category) return null;

  const showConfidence = typeof confidence === 'number';
  const percent = showConfidence ? Math.round(confidence * 100) : null;

  return (
    <span
      className={`${styles.badge} ${size === 'sm' ? styles.badgeSm : ''}`}
      style={categoryVars(category)}
      title={category.description || undefined}
    >
      <span className={styles.badgeDot} aria-hidden="true" />
      {category.label}
      {showConfidence && (
        <span className={styles.badgeConfidence}>
          {/* Screen readers get the meaning; sighted users get the number. */}
          <span className={styles.srOnly}>, confidence </span>
          {percent}%
        </span>
      )}
    </span>
  );
}
