
import json
from pathlib import Path

# Paths
DATA_DIR = Path(__file__).parent / "data"
INPUT_FILE = DATA_DIR / "ccna.json"
OUTPUT_FILE = DATA_DIR / "ccna_clean.json"

# Read original dataset
with INPUT_FILE.open("r", encoding="utf-8") as file:
    records = json.load(file)

# Remove duplicate question-answer pairs
unique_records = []
seen_pairs = set()

for record in records:
    question = record["question"].strip()
    answer = record["answer"].strip()

    # Normalize text only for duplicate detection
    key = (question.casefold(), answer.casefold())

    if key not in seen_pairs:
        seen_pairs.add(key)

        unique_records.append({
            "question": question,
            "answer": answer,
        })

# Save cleaned dataset
with OUTPUT_FILE.open("w", encoding="utf-8") as file:
    json.dump(
        unique_records,
        file,
        ensure_ascii=False,
        indent=2,
    )

print(f"Original records: {len(records)}")
print(f"Unique records: {len(unique_records)}")
print(f"Duplicates removed: {len(records) - len(unique_records)}")
print(f"Saved to: {OUTPUT_FILE}")
