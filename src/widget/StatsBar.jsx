import { categoryVars, priorityVars } from '../lib/theme.js';
import styles from './widget.module.css';

/**
 * The reason to classify at all: whoever works this queue wants the shape of
 * what came in, not to read every message. Two stacked bars, no chart library.
 */
export function StatsBar({ stats }) {
  if (stats.classified === 0) return null;

  return (
    <section className={styles.stats} aria-label="Classification breakdown">
      <div className={styles.statsHeader}>
        <span className={styles.statsTitle}>Breakdown</span>
        <span className={styles.statsCount}>
          {stats.classified} classified
          {stats.failed > 0 && ` · ${stats.failed} failed`}
        </span>
      </div>

      <div className={styles.statsTrack} role="img" aria-label={describe(stats.byCategory, 'Category', (e) => e.category.label)}>
        {stats.byCategory.map(({ category, count }) => (
          <span
            key={category.id}
            className={styles.statsSegment}
            style={{ ...categoryVars(category), flexGrow: count }}
          />
        ))}
      </div>

      <ul className={styles.legend}>
        {stats.byCategory.map(({ category, count }) => (
          <li key={category.id} className={styles.legendItem} style={categoryVars(category)}>
            <span className={styles.legendDot} aria-hidden="true" />
            {category.label}
            <span className={styles.legendCount}>{count}</span>
          </li>
        ))}
      </ul>

      {stats.byPriority.length > 1 && (
        <ul className={styles.legend}>
          {stats.byPriority.map(({ priority, count }) => (
            <li key={priority} className={styles.legendItem} style={priorityVars(priority)}>
              <span className={styles.legendPip} aria-hidden="true" />
              {priority}
              <span className={styles.legendCount}>{count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function describe(entries, noun, label) {
  const parts = entries.map((entry) => `${label(entry)}: ${entry.count}`);
  return `${noun} breakdown. ${parts.join(', ')}.`;
}
