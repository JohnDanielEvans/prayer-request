import './RequestItem.css';
export default function RequestItem({ request }) {
  return (
    <div className="request-item">
      The text you entered: <strong>"{request.text}"</strong> has been categorized into the following category: <strong>{request.category}</strong>
    </div>
  );
}
