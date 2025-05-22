import React, { useState } from "react";

export default function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [chunks, setChunks] = useState("");

  const ask = async () => {
    if (!question.trim()) return;
    const res = await fetch("http://localhost:8000/query", {
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
    await fetch("http://localhost:8000/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    alert("Uploaded!");
  };
	
  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:8000/upload-pdf", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    alert(`Uploaded ${data.pages} pages from ${file.name}`);
  };
	
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">AI Audit Assistant</h1>
      <div className="space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-blue-600" : "text-green-700"}>
            <strong>{m.role === "user" ? "You" : "Bot"}:</strong> {m.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="border p-2 flex-1"
          placeholder="Ask your question..."
        />
        <button onClick={ask} className="bg-blue-500 text-white px-4 rounded">Send</button>
      </div>

      <textarea
        rows={4}
        value={chunks}
        onChange={(e) => setChunks(e.target.value)}
        className="w-full p-2 border"
        placeholder="Paste document chunks here, one per line..."
      />
      <button onClick={uploadChunks} className="bg-green-600 text-white px-4 py-2 rounded">Upload Chunks</button>
	<input
	  type="file"
	  accept="application/pdf"
	  onChange={handlePDFUpload}
	  className="mt-4"
	/>
    </div>
  );

}
