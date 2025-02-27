import RequestItem from "./RequestItem";

export default function RequestList({ requests }) {
  return (
    <div>
      {requests.map((req, index) => (
        <RequestItem key={index} request={req} />
      ))}
    </div>
  );
}
