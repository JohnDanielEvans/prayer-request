import { ResultCard } from './ResultCard.jsx';
import styles from './widget.module.css';

export function ResultList({
  submissions,
  onRetry,
  onRemove,
  showTimestamps,
  showJson,
  emptyText,
}) {
  if (submissions.length === 0) {
    return <p className={styles.empty}>{emptyText}</p>;
  }

  return (
    <ul className={styles.list}>
      {/* Newest first: the thing you just submitted should be the thing you see. */}
      {[...submissions].reverse().map((submission) => (
        <ResultCard
          key={submission.id}
          submission={submission}
          onRetry={onRetry}
          onRemove={onRemove}
          showTimestamps={showTimestamps}
          showJson={showJson}
        />
      ))}
    </ul>
  );
}
