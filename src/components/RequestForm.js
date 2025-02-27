import { useState } from "react";
import './RequestForm.css'; // Import the new CSS file

export default function RequestForm({ onSubmit }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="request-form">
      <textarea
        className="request-textarea"
        placeholder="Enter a prayer request..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows="8"
      />
      <button className="request-button" type="submit">
        Submit
      </button>
    </form>
  );
}