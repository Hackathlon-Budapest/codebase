# TeachLab — Backend Setup Guide

## Prerequisites

Make sure you have the following installed:
- Python 3.10 or higher
- Git

Check your Python version:
```bash
python --version
```

---

## Step 1 — Clone the repo
```bash
cd ~/Documents
git clone https://github.com/Hackathlon-Budapest/main.git
cd main
```

---

## Step 2 — Create and activate a virtual environment
```bash
cd backend
python -m venv venv
source venv/bin/activate
```

You should see `(venv)` at the start of your terminal prompt. You need to run this activation command every time you open a new terminal.

---

## Step 3 — Install dependencies
```bash
pip install fastapi uvicorn websockets python-dotenv pydantic openai httpx
```

---

## Step 4 — Set up environment variables
```bash
cp .env.example .env
```

Then open `.env` in your editor and fill in the real values. Get these from Gergo on WhatsApp/Slack — do not commit this file.

---

## Step 5 — Run the server
```bash
uvicorn main:app --reload --port 8000
```

---

## Step 6 — Verify it works

Open your browser at http://localhost:8000/health — you should see:
```json
{"status": "ok", "sessions_active": 0}
```

---

## Pulling latest changes
```bash
git pull origin main
```

## Pushing your changes
```bash
git add .
git commit -m "feat: describe what you did"
git push origin main
```

---

## File ownership

| File | Owner |
|------|-------|
| main.py | Dev 1 (Gergo) |
| models.py | Dev 1 — shared contract, discuss before changing |
| personas.py | Dev 2 |
| agents.py | Dev 2 |
| orchestrator.py | Dev 3 |
| analytics.py | Dev 3 |
| azure_speech.py | Dev 4 |
| azure_sentiment.py | Dev 4 |

---

## WebSocket message contract

### Frontend to Backend
```json
{ "type": "teacher_input", "session_id": "abc-123", "text": "Today we learn fractions." }
{ "type": "session_end", "session_id": "abc-123" }
```

### Backend to Frontend
```json
{ "type": "student_response", "student_id": "maya", "student_name": "Maya", "text": "...", "emotional_state": "eager", "engagement": 0.95, "comprehension": 0.9, "audio_base64": null }
{ "type": "state_update", "students": { "maya": { "engagement": 0.95, "comprehension": 0.9, "emotional_state": "eager" } } }
{ "type": "session_end", "session_id": "abc-123" }
{ "type": "error", "message": "something went wrong" }
```

---

## Common errors

**zsh: command not found: uvicorn** — run `source venv/bin/activate` first

**ERROR: Could not open requirements file** — run `cd backend` first

**openai.OpenAIError: api_key not set** — fill in your `.env` file with real keys

**Address already in use** — use a different port: `uvicorn main:app --reload --port 8001`
