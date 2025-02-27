import { useState } from "react";
import RequestForm from "../components/RequestForm";
import RequestList from "../components/RequestList";
import { categorizeRequest } from "../api/openaiService";

export default function Home() {
  const [requests, setRequests] = useState([]);

  const handleNewRequest = async (text) => {
    const category = await categorizeRequest(text);
    setRequests([...requests, { text, category }]);
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-gray-100 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">How can we pray for you today?</h1>
      <RequestForm onSubmit={handleNewRequest} />
      <RequestList requests={requests} />
    </div>
  );
}
