import { RequestItem } from './RequestItem.jsx';
import styles from './widget.module.css';

export function RequestList({ requests, onRetry, onRemove, showTimestamps, emptyText }) {
  if (requests.length === 0) {
    return <p className={styles.empty}>{emptyText}</p>;
  }

  return (
    <ul className={styles.list}>
      {/* Newest first: the thing you just submitted should be the thing you see. */}
      {[...requests].reverse().map((request) => (
        <RequestItem
          key={request.id}
          request={request}
          onRetry={onRetry}
          onRemove={onRemove}
          showTimestamps={showTimestamps}
        />
      ))}
    </ul>
  );
}
