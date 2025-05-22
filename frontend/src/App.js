import React, { useState } from "react";

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true);
    const newMessages = [...messages, { role: "user", text: question }];
    setMessages(newMessages);
    setQuestion("");

    try {
      const res = await fetch("http://localhost:8000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", text: data.answer }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", text: "⚠️ Failed to connect to backend." },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4 space-y-4">
      <h1 className="text-2xl font-semibold">AI Audit Assistant</h1>
      <div className="space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl ${
              msg.role === "user" ? "bg-blue-100" : "bg-green-100"
            }`}
          >
            <strong>{msg.role === "user" ? "You" : "Assistant"}:</strong>{" "}
            {msg.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded p-2"
          placeholder="Ask your question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && askQuestion()}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={askQuestion}
          disabled={loading}
        >
          {loading ? "..." : "Ask"}
        </button>
      </div>
    </div>
  );
}

export default App;
