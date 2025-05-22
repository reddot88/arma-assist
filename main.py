# ai-audit-assistant: Starter FastAPI + Chroma + OpenAI Project

# main.py (FastAPI backend)
from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import openai
import chromadb
from chromadb.utils import embedding_functions
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize ChromaDB in-memory
chroma_client = chromadb.Client()
embedding_func = embedding_functions.OpenAIEmbeddingFunction(api_key=openai.api_key)
collection = chroma_client.create_collection(name="audit_docs", embedding_function=embedding_func)

# Initialize FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class DocumentChunk(BaseModel):
    id: str
    content: str

class QueryRequest(BaseModel):
    question: str

# Endpoint: Add document chunks to vector DB
@app.post("/upload")
async def upload_chunks(chunks: list[DocumentChunk]):
    ids = [chunk.id for chunk in chunks]
    texts = [chunk.content for chunk in chunks]
    metadatas = [{"source": chunk.id} for chunk in chunks]
    collection.add(documents=texts, ids=ids, metadatas=metadatas)
    return {"status": "uploaded", "count": len(ids)}

# Endpoint: Ask a question
@app.post("/query")
async def query_docs(query: QueryRequest):
    results = collection.query(query_texts=[query.question], n_results=5)
    context = "\n".join(results["documents"][0])

    messages = [
        {"role": "system", "content": "You are an AI assistant helping a new IT auditor. Answer clearly based on company policy, guidance, and common practice."},
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query.question}"}
    ]

    response = openai.ChatCompletion.create(model="gpt-4", messages=messages)
    return {"answer": response.choices[0].message.content.strip()}

# Upload PDF
from fastapi import UploadFile, File
import fitz  # PyMuPDF

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    content = await file.read()
    doc = fitz.open(stream=content, filetype="pdf")
    chunks = []
    for i, page in enumerate(doc):
        text = page.get_text().strip()
        if text:
            chunks.append({
                "id": f"{file.filename}-p{i}",
                "content": text
            })
    collection.add(
        documents=[c["content"] for c in chunks],
        ids=[c["id"] for c in chunks],
        metadatas=[{"source": c["id"]} for c in chunks]
    )
    return {"status": "uploaded", "pages": len(chunks)}
