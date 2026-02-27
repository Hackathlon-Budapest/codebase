# Dev 2 — Progress Log

---

## Push 1 — Agent foundations
`2026-02-27`

**Built:**
- `services/azure_openai.py` — async `chat_completion()` and `chat_completion_json()` wrappers; auto-selects Azure OpenAI or standard OpenAI based on env vars
- `personas/personas.py` — all 5 persona definitions (Maya, Carlos, Jake, Priya, Marcus) with system prompts, speech patterns, emotional triggers, response length ranges, and initial state values
- `agents/student_agent.py` — `generate_response(student_state, teacher_input, history)` returns `{text, emotional_state, comprehension_delta, engagement_delta}` as a dataclass; deltas are on 0–100 scale (orchestrator divides by 100 when applying to session state)
- `test_personas.py` — standalone test: all 5 personas respond to the same teacher input, prints response + state deltas

**Affects other devs:**
- `generate_response` signature: `(student_state, teacher_input, history, lesson_context=None)` — backwards compatible

**Blocked on:** Azure keys from Dev 3 (OpenAI fallback works for local testing with `OPENAI_API_KEY`)

---

## Push 2 — Lesson context enrichment
`2026-02-27`

**Built:**
- `generate_response` now accepts optional `lesson_context: dict | None` with keys `{subject, topic, grade_level}`
- When provided, a `LESSON CONTEXT` block is prepended to the LLM prompt so students know what subject and topic they are studying
- `generate_responses_batch` updated with the same optional param
- `main.py` builds lesson context from `session.config` on every turn and passes it into `generate_response`

**Affects other devs:**
- `generate_response` and `generate_responses_batch` have a new optional kwarg — no breaking change, defaults to `None`

**Note:** Sentiment integration was scoped and then dropped — `azure_sentiment.py` removed from the stack by Dev 3 (azure-setup PR). Emotional state comes from the LLM's self-reported value only.

**Next:** Sequential audio delivery

---

## Push 3 — STT integration + sequential audio queue SPRINT 1
`2026-02-27`

**Built:**
- `services/azure_speech.py` — restructured `speech_to_text()`:
  - Tries Azure STT first if `AZURE_SPEECH_KEY` is set (PCM/WAV bytes)
  - Falls back to **local faster-whisper** (`"tiny"` model, CPU/int8) which handles WebM/Opus natively — this is what the browser's MediaRecorder outputs
  - Model is lazy-loaded on first STT call and cached at module level; first-time download ~30s, subsequent calls fast
- `main.py` — added `POST /stt` endpoint:
  - Accepts `{ audio_base64: str }`, decodes, calls `speech_to_text()`, returns `{ text: str }`
  - Added `import base64`, `from pydantic import BaseModel`, `STTRequest` model inline
  - Imported `speech_to_text` from `azure_speech`
- `components/TeacherControls/MicButton.tsx` — replaced `'[audio]'` placeholder:
  - Calls `POST /stt` after recording stops, sends transcribed text via `sendTeacherInput()`
  - Added `isTranscribing` local state; button shows `…` and is disabled during STT call
  - Shows error message if transcription returns empty string
  - Reads `VITE_API_URL` env var with `http://localhost:8000` fallback
- `hooks/useWebSocket.ts` — sequential audio queue:
  - Replaced immediate `audio.play()` with a ref-based queue (`audioQueueRef`, `isPlayingRef`, `playNextRef`)
  - Each `student_response` audio is enqueued; next clip plays only after current one ends (or errors)
  - Prevents overlapping student voices when multiple students respond in the same turn
- `src/vite-env.d.ts` — created (was missing); adds `/// <reference types="vite/client" />` for `import.meta.env` types

**Affects other devs:**
- `POST /stt` is now available at `http://localhost:8000/stt` — no auth, CORS open
- TTS audio is now played sequentially; frontend handles queueing, no backend change needed
- `VITE_API_URL` env var can be set in `.env` to point frontend at a non-localhost backend

**Note on faster-whisper:**
- Model files cached in `~/.cache/huggingface/hub/` after first download
- Run backend once before demo to warm up the model: first `/stt` call triggers download
- Azure STT still takes priority if `AZURE_SPEECH_KEY` is set, but WebM format will likely fail silently and fall through to whisper anyway

---

## Push 4 — EmotionalState alignment (flagged by Dev 3)
`2026-02-27`

**Built:**
- `personas/personas.py:10` — updated `EmotionalState` Literal to match `backend/models.py` enum: removed `curious`, added `eager`, `anxious`, `distracted`
- `personas/personas.py:462` — changed hardcoded initial `"curious"` state to `"engaged"` (valid default)
- `agents/student_agent.py:87` — updated LLM prompt to instruct GPT to return `eager|confused|bored|frustrated|engaged|anxious|distracted`
- `agents/student_agent.py:152` — updated `valid_emotions` validation set to the same 7 states

**Why it matters:**
GPT was previously told to return only 5 states (`curious` was one of them) so it never returned `eager`, `anxious`, or `distracted`. Dev 3 extended the frontend `EmotionalState` type to all 7 values but they could never appear in a live session — student emotion badges were effectively stuck. Now GPT's output aligns with both `models.py` and the frontend type.
