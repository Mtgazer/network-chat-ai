
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from search import search_dataset

app = FastAPI(title="Network Chat AI")

# Allow requests from the local Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1000)


@app.get("/")
def home():
    return {
        "message": "Welcome to Network Chat AI",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/api/chat")
def chat(request: ChatRequest):
    question = request.question.strip()
    results = search_dataset(question)

    if not results:
        return {
            "question": question,
            "answer": None,
            "message": "I couldn't find a relevant answer in the current dataset.",
            "sources": [],
        }

    best_match = results[0]

    return {
        "question": question,
        "answer": best_match["answer"],
        "matched_question": best_match["question"],
        "similarity": best_match["score"],
        "sources": results,
    }
