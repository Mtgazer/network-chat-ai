# Network Chat AI — Project Context

> Purpose: This document is the handoff/context file for future ChatGPT conversations. If I attach `network_chat_ai.md` and say "continue the project", use this file as the source of truth for the current project state and ask for updated command output when the actual state may have changed.

## 1. Project Overview

**Project name:** Network Chat AI  
**Repository name:** `network-chat-ai` (renamed from `chat_bot`)  
**GitHub repository:** https://github.com/Mtgazer/network-chat-ai  
**Stack:** Next.js frontend + Python FastAPI backend + local CCNA Q&A dataset  
**Goal:** Build an educational chatbot for computer networks / CCNA questions. The initial version retrieves answers from a dataset rather than generating answers with an LLM.

The project is being built step by step as a learning project. Explanations should be patient, beginner-friendly, and in Egyptian Arabic when chatting with the user. Explain why each change is made and avoid changing multiple unrelated things at once.

## 2. Local Project Paths

Project root:

```text
/run/media/ibrahim-khalil/New Volume/Ibrahim/AI Course/chat_bot
```

Frontend:

```text
/run/media/ibrahim-khalil/New Volume/Ibrahim/AI Course/chat_bot/nextjs-dashboard
```

Backend:

```text
/run/media/ibrahim-khalil/New Volume/Ibrahim/AI Course/chat_bot/backend
```

These paths depend on the user's mounted external drive and may change. Confirm the current path if commands fail.

## 3. Current Architecture

```text
network-chat-ai/
├── .gitignore
├── backend/
│   ├── main.py
│   ├── search.py
│   ├── download_data.py
│   ├── clean_data.py
│   └── data/
│       ├── ccna.json
│       └── ccna_clean.json
└── nextjs-dashboard/
    ├── app/
    │   ├── page.tsx
    │   ├── layout.tsx
    │   ├── ui/
    │   │   └── global.css
    │   └── ...
    ├── package.json
    ├── pnpm-lock.yaml
    ├── pnpm-workspace.yaml
    ├── tsconfig.json
    └── ...
```

This is the key project structure, not necessarily an exhaustive list of all files.

## 4. Backend Details

### Environment

- Conda environment: `network-chat-ai`
- Python environment is activated per terminal using:

```bash
conda activate network-chat-ai
```

- The user installed FastAPI, `uvicorn[standard]`, `datasets`, and `scikit-learn` in this environment (confirm if packages have changed).
- Run backend from the `backend` directory:

```bash
conda activate network-chat-ai
cd "/run/media/ibrahim-khalil/New Volume/Ibrahim/AI Course/chat_bot/backend"
python -m uvicorn main:app --reload --port 8000
```

- API docs: http://127.0.0.1:8000/docs
- Health endpoint: http://127.0.0.1:8000/health

### Dataset

Source: Hugging Face dataset `Rzkoohi/CCNA_small`, loaded with `datasets.load_dataset(..., split="train")`.

`backend/download_data.py` loads the dataset, extracts nonempty `question` and `answer` values, and saves them to:

- `backend/data/ccna.json`

Observed output:
- Original records: 23,328
- `ccna.json` size: approximately 7.0 MB
- Example first record:

```json
{
  "question": "What are considered the upper layers of the OSI model?",
  "answer": "The upper layers consist of Layer-7 (Application), Layer-6 (Presentation), and Layer-5 (Session). These layers manage application-level functions and are generally implemented in software."
}
```

`backend/clean_data.py` removes duplicate question-answer pairs, comparing stripped, casefolded question and answer strings. It saves the result to `backend/data/ccna_clean.json`, without overwriting the original file.

Observed stats:
- Total records: 23,328
- Unique question-answer pairs: 11,662
- Duplicates removed: 11,666
- Cleaned file size: approximately 3.5 MB

### Search implementation

`backend/search.py` currently:
1. Loads `data/ccna_clean.json`.
2. Extracts all questions.
3. Uses `TfidfVectorizer(lowercase=True, stop_words="english", ngram_range=(1, 2))`.
4. Precomputes TF-IDF vectors when the module loads.
5. Uses `cosine_similarity` to rank the dataset questions for each user query.
6. Returns up to 3 results with `question`, `answer`, and a rounded similarity score.
7. Ignores zero-similarity matches.

A test query, `What are the upper layers of the OSI model?`, returned:
- Best match: `What are considered the upper layers of the OSI model?`
- Similarity: `0.873`
- Other matches: lower OSI layers (`0.604`) and all seven OSI layers (`0.520`).

An earlier simple keyword-overlap search produced poor ranking; it was replaced by TF-IDF + cosine similarity.

**Known limitation:** This is lexical similarity, not semantic understanding. A query like `What is DNS?` once returned a semantically related but not necessarily best question (similarity `0.502`). The API currently returns the top match without a confidence threshold. Arabic queries against the mostly English dataset are not supported reliably yet.

### FastAPI endpoints

`backend/main.py` currently has:
- `GET /` — basic welcome/status response
- `GET /health` — `{"status": "healthy"}`
- `POST /api/chat` — accepts a JSON body like:

```json
{
  "question": "What are the upper layers of the OSI model?"
}
```

It calls `search_dataset(question)` and returns:
- `question`
- `answer`
- `matched_question`
- `similarity`
- `sources` (top results)

If no matches are found, it returns a null answer, a message, and an empty `sources` list.

CORS was added to allow the local frontend origins:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

The API was tested successfully through Swagger UI at `http://127.0.0.1:8000/docs`; a request returned HTTP `200` and the expected answer for the OSI question.

## 5. Frontend Details

### Stack and running

- Next.js dashboard starter project, under `nextjs-dashboard`.
- `app/page.tsx` was replaced with a client-side chat UI using React state and `fetch()` to `http://127.0.0.1:8000/api/chat`.
- The page shows user and assistant messages, loading state, errors, suggested questions, matched dataset question, and similarity score.
- Chat history exists only in React state and is lost on page refresh.
- `app/layout.tsx` imports the global CSS using:

```tsx
import './ui/global.css';
```

- Chat UI styles were appended to `app/ui/global.css`.
- A white edge/margin issue around the page was fixed by adding global `html, body` reset styles and box-sizing styles; exact current CSS should be verified if the issue reappears.
- The old Acme landing page was replaced with the Network Chat AI interface.

To run frontend from its directory:

```bash
cd "/run/media/ibrahim-khalil/New Volume/Ibrahim/AI Course/chat_bot/nextjs-dashboard"
npx --yes pnpm@11.28.6 dev
```

The user's installed `pnpm` v12.14.0 previously crashed with a Rust stack overflow while verifying lockfile supply-chain policies. `npx --yes pnpm@11.28.6 dev` worked as a workaround. Recheck current behavior before assuming it remains necessary.

Frontend is expected at http://localhost:3000.

### TypeScript warning

`nextjs-dashboard/tsconfig.json` contained:

```json
"baseUrl": ".",
"paths": {
  "@/*": ["./*"]
}
```

VS Code displayed a TypeScript warning that `baseUrl` is deprecated and will stop functioning in TypeScript 7.0. The user removed the `"baseUrl": "."` line and kept `paths`. This change was committed and pushed successfully. Confirm that imports and the Next.js build still work after the change.

## 6. Git / GitHub

- Git repository initialized in the project root.
- Main branch: `main`.
- Initial commit message: `Initial commit: Network Chat AI`.
- A subsequent commit was made for the TypeScript config change; visible GitHub message was similar to `fix: remove deprecated TypeScript baseUrl option`.
- Repository was pushed to GitHub and is currently public per screenshot.
- Original repo URL: `https://github.com/Mtgazer/chat_bot`
- User renamed the GitHub repository to `network-chat-ai`.
- New URL: `https://github.com/Mtgazer/network-chat-ai`
- The user was instructed to update local remote URL using:

```bash
git remote set-url origin https://github.com/Mtgazer/network-chat-ai.git
```

and verify with `git remote -v`. It was not yet confirmed in chat whether this remote update was executed.

`.gitignore` was created at the project root and includes Python caches/environments, `.env` files, Next.js `node_modules`, `.next`, build outputs, logs, OS/editor files. Check its actual current contents before relying on every entry.

The user successfully made an initial commit and pushed the repository. GitHub screenshot showed two commits and root entries `backend`, `nextjs-dashboard`, and `.gitignore`. No README was present at that point.

Dataset files appeared to have been included in the initial commit based on the repository workflow, but confirm actual Git status/tracking if needed. The dataset is ~10.5 MB total, not huge, but licensing/re-distribution terms should be checked before publishing dataset contents publicly.

## 7. Current Status and Next Steps

### Confirmed working
- Dataset download and JSON generation.
- Dataset cleaning and duplicate-pair removal.
- TF-IDF search script.
- FastAPI `/api/chat` returning a real answer, HTTP 200.
- Next.js chat UI connected to backend locally.
- Basic dark chat UI and CSS edge fix.
- GitHub repository created and pushed.
- TypeScript `baseUrl` warning addressed by removing the line; commit pushed.

### Known issues / unfinished work
1. Need add a professional `README.md` with setup/run instructions.
2. Need confirm `git remote -v` points to `https://github.com/Mtgazer/network-chat-ai.git`.
3. Need improve search quality and add a confidence threshold.
4. Need multilingual semantic search for Arabic and English, likely with a multilingual embedding model; do not claim this is implemented.
5. Need possibly show all `sources` or provide source references in the UI.
6. Chat messages are not persisted.
7. Need check dataset licensing before relying on public redistribution.
8. Need consider deployment later; local API URL and CORS must be changed for production.

## 8. How to Continue This Project in a Future Conversation

When the user attaches this file and asks to continue:
1. Treat this document as context, but verify state if it could have changed.
2. Start with the current state and next logical step; do not repeat all previous steps.
3. Explain one or two steps at a time in Egyptian Arabic, with beginner-friendly explanations.
4. Keep frontend and backend directories separate.
5. Ask for command output when confirmation is needed instead of assuming a command succeeded.
6. Do not introduce Supabase unless the user asks; initial version intentionally uses local JSON data.
7. Before changing files, explain what will change and why.
8. Keep project name/repo name as `network-chat-ai` / `Network Chat AI`.
