import { categoryVars } from '../lib/theme.js';
import styles from './widget.module.css';

/**
 * The reason to categorize at all: a prayer team wants to see the shape of what
 * came in this week, not read 200 entries. One stacked bar, no chart library.
 */
export function StatsBar({ stats }) {
  if (stats.categorized === 0) return null;

  return (
    <section className={styles.stats} aria-label="Category breakdown">
      <div className={styles.statsHeader}>
        <span className={styles.statsTitle}>Breakdown</span>
        <span className={styles.statsCount}>
          {stats.categorized} categorized
          {stats.failed > 0 && ` · ${stats.failed} failed`}
        </span>
      </div>

      <div className={styles.statsTrack} role="img" aria-label={describe(stats)}>
        {stats.byCategory.map(({ category, count }) => (
          <span
            key={category.id}
            className={styles.statsSegment}
            style={{
              ...categoryVars(category),
              flexGrow: count,
            }}
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
    </section>
  );
}

function describe(stats) {
  const parts = stats.byCategory.map(
    ({ category, count }) => `${category.label}: ${count}`
  );
  return `Category breakdown. ${parts.join(', ')}.`;
}
