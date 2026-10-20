
import json
from pathlib import Path
from datasets import load_dataset

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

print("Downloading CCNA dataset...")

dataset = load_dataset(
    "Rzkoohi/CCNA_small",
    split="train",
)

records = []

for row in dataset:
    question = (row.get("question") or "").strip()
    answer = (row.get("answer") or "").strip()

    if question and answer:
        records.append({
            "question": question,
            "answer": answer,
        })

output_file = DATA_DIR / "ccna.json"

with output_file.open("w", encoding="utf-8") as file:
    json.dump(records, file, ensure_ascii=False, indent=2)

print(f"Saved {len(records)} records to {output_file}")
