import React, { useState } from "react";

export default function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [chunks, setChunks] = useState("");

  const ask = async () => {
    if (!question.trim()) return;
    const res = await fetch("http://147.93.81.222:8000/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setMessages([...messages, { role: "user", text: question }, { role: "bot", text: data.answer }]);
    setQuestion("");
  };

  const uploadChunks = async () => {
    const lines = chunks.split("\n").filter(Boolean);
    const data = lines.map((line, i) => ({ id: `chunk-${i}`, content: line }));
    await fetch("http://147.93.81.222:8000/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    alert("✅ Chunks uploaded successfully!");
  };

  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://147.93.81.222:8000/upload-pdf", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    alert(`✅ Uploaded ${data.pages} pages from ${file.name}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold text-center mb-6">AI Audit Assistant</h1>

      <div className="flex flex-col space-y-4 max-w-2xl mx-auto flex-1">
        <div className="space-y-2 bg-gray-800 p-4 rounded shadow">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-blue-400" : "text-green-400"}>
              <strong>{m.role === "user" ? "You" : "Bot"}:</strong> {m.text}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
            placeholder="Ask your question..."
          />
          <button onClick={ask} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded">
            Send
          </button>
        </div>

        <textarea
          rows={4}
          value={chunks}
          onChange={(e) => setChunks(e.target.value)}
          className="p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
          placeholder="Paste document chunks here, one per line..."
        />
        <button onClick={uploadChunks} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded">
          Upload Chunks
        </button>

        <div className="flex items-center gap-2">
          <label className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded cursor-pointer">
            Choose PDF
            <input type="file" accept="application/pdf" onChange={handlePDFUpload} className="hidden" />
          </label>
        </div>
      </div>

      <footer className="text-center text-gray-500 mt-6 text-sm">
        Made with ❤️ for IT Auditors
      </footer>
    </div>
  );
}
