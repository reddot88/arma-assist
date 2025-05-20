import os
import requests
import uuid
from docx import Document
import pdfplumber
from dotenv import load_dotenv

# Load .env for config
load_dotenv()

API_ENDPOINT = os.getenv("UPLOAD_ENDPOINT", "http://localhost:8000/upload")

def split_text(text, max_tokens=300):
    """Splits text into smaller chunks"""
    paragraphs = text.split("\n")
    chunks = []
    current_chunk = ""
    for para in paragraphs:
        if len(current_chunk) + len(para) < max_tokens * 4:  # Rough token estimate
            current_chunk += para + "\n"
        else:
            chunks.append(current_chunk.strip())
            current_chunk = para + "\n"
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

def read_docx(path):
    doc = Document(path)
    full_text = "\n".join([p.text for p in doc.paragraphs])
    return full_text

def read_pdf(path):
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text

def process_file(file_path):
    if file_path.endswith(".docx"):
        text = read_docx(file_path)
    elif file_path.endswith(".pdf"):
        text = read_pdf(file_path)
    else:
        print(f"Unsupported file: {file_path}")
        return []

    chunks = split_text(text)
    return [{"id": f"{os.path.basename(file_path)}-{uuid.uuid4()}", "content": chunk} for chunk in chunks]

def upload_chunks(chunks):
    response = requests.post(API_ENDPOINT, json=chunks)
    if response.status_code == 200:
        print(f"Uploaded {len(chunks)} chunks.")
    else:
        print("Failed to upload:", response.text)

def run_on_folder(folder):
    for filename in os.listdir(folder):
        if filename.endswith(".pdf") or filename.endswith(".docx"):
            file_path = os.path.join(folder, filename)
            print(f"Processing {file_path}")
            chunks = process_file(file_path)
            upload_chunks(chunks)

if __name__ == "__main__":
    folder_path = "data/"
    run_on_folder(folder_path)
