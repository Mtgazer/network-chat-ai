
import json
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# 1. Load the cleaned dataset
DATA_FILE = Path(__file__).parent / "data" / "ccna_clean.json"

with DATA_FILE.open("r", encoding="utf-8") as file:
    dataset = json.load(file)


# 2. Prepare the questions
questions = [record["question"] for record in dataset]


# 3. Convert questions into TF-IDF vectors
vectorizer = TfidfVectorizer(
    lowercase=True,
    stop_words="english",
    ngram_range=(1, 2),
)

question_vectors = vectorizer.fit_transform(questions)


# 4. Search for the most similar questions
def search_dataset(user_question: str, limit: int = 3) -> list[dict]:
    query_vector = vectorizer.transform([user_question])

    scores = cosine_similarity(
        query_vector,
        question_vectors,
    ).flatten()

    # Sort indexes by similarity score, highest first
    ranked_indexes = scores.argsort()[::-1]

    results = []

    for index in ranked_indexes:
        score = float(scores[index])

        # Ignore questions with no shared vocabulary
        if score <= 0:
            break

        record = dataset[index]

        results.append({
            "question": record["question"],
            "answer": record["answer"],
            "score": round(score, 3),
        })

        if len(results) >= limit:
            break

    return results


# 5. Test the search
if __name__ == "__main__":
    question = input("Ask a networking question: ")

    matches = search_dataset(question)

    if not matches:
        print("No matching questions found.")
    else:
        for index, match in enumerate(matches, start=1):
            print(f"\nResult {index}")
            print(f"Question: {match['question']}")
            print(f"Answer: {match['answer']}")
            print(f"Similarity: {match['score']}")
