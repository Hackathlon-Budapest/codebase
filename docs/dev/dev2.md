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

---

## Push 5 — Text input fallback (demo safety)
`2026-02-27`

**Built:**
- `components/TeacherControls/MicButton.tsx` — added text input + Send button below the mic button
  - Teacher can type input directly and press Enter or click Send
  - Disabled while `isProcessing` or not connected (same guards as mic)
  - Clears after send
  - STT error messages now guide toward the text input ("use text input below")
  - Mic button still fully functional — this is an additive fallback, not a replacement

**Why:** faster-whisper model download (~30s on first call) can stall the demo. Text input ensures the teacher can always send input regardless of STT availability.

---

## Push 6 — Fix stuck Processing state on WS disconnect
`2026-02-27`

**Built:**
- `hooks/useWebSocket.ts` — added `setProcessing(false)` to `ws.onclose` handler; added `setProcessing` to `useEffect` deps

**Why:** if the backend drops the WS while processing a GPT response (timeout, crash, network blip), `isProcessing` was never reset and the mic + text input stayed permanently disabled. Now any WS close resets the processing state so the teacher can immediately retry.

---

## Push 7 — Fix 0 student responses + dashboard crash
`2026-02-27`

**Built:**
- `agents/orchestrator.py` — replaced `chat_completion` with `chat_completion_json`; simplified result parsing to `result.get("responders", [])`. Root cause: `chat_completion` returns a `str`, but the orchestrator was checking `isinstance(result, dict)` which was always `False` → `raw_responders = []` → no student ever responded.
- `components/Dashboard/SessionReport.tsx` — fixed feedback key from `data.feedback?.coaching_text` to `data.feedback?.feedback`. Root cause: `generate_feedback` returns `{"summary": ..., "feedback": "text"}` but the frontend was looking for `.coaching_text` (which doesn't exist), fell back to the entire dict, then `<pre>` crashed trying to render an object instead of a string.

---

## Push 8 — Fix empty student log entries
`2026-02-27`

**Built:**
- `main.py` — skip sending `student_response` WS message when `resp["text"]` is empty/whitespace. Root cause: student_agent prompt explicitly allows `text: ""` (student chooses to stay silent), but the backend was still broadcasting those empty responses. Frontend would add a log entry with the student's name but blank text. State updates (engagement/comprehension deltas) still apply for silent turns.

---

## Push 9 — Fix stuck Processing on silent turns + no-response indicator
`2026-02-27`

**Built:**
- `hooks/useWebSocket.ts` — added `setProcessing(false)` to `state_update` handler. Root cause: Push 8 stopped sending `student_response` for silent turns, but `setProcessing(false)` was only called on `student_response` — so if all responders were silent the UI stayed locked forever. `state_update` is always sent at end of every turn, making it the correct canonical "turn complete" signal.
- `hooks/useWebSocket.ts` — added `hadResponseThisTurnRef` boolean ref. Reset to `false` on teacher send; set to `true` on any `student_response`. On `state_update`, if still `false`, inserts `"— No one responded."` into the conversation log so the teacher knows the turn was processed (rather than retrying blindly).
- `agents/orchestrator.py` — added direct-question fallback: if GPT returns 0 responders and the teacher's input contains `?`, pick the most engaged student with `consecutive_turns_speaking < 2` as a guaranteed responder. Prevents silent turns on explicit questions.

**Why it matters:**
Before this fix, questions that got 0 GPT-selected responders would leave the teacher stuck on "Processing…" permanently (or after Push 8, unstuck but with no feedback). Teachers were double-sending questions because they couldn't tell if the turn had registered. Now: questions always get at least one response, and non-question silent turns show a clear indicator.

---

## Push 10 — Group addressing + student debates
`2026-02-27`

**Built:**
- `agents/orchestrator.py` — added `_is_group_address()` helper; detects keywords: `"everyone"`, `"everybody"`, `"all of you"`, `"each of you"`, `"go around"`, `"1 by 1"`, `"one by one"`, `"one at a time"`, `"the class"`, `"whole class"`, `"around the room"`. When triggered, all available students (consecutive_turns_speaking < 3) are returned as responders instead of capping at 2. Updated system prompt to reflect 0–5 responder range.
- `main.py` — replaced `asyncio.gather` (parallel) with a sequential loop over responders:
  - Each student's history (`live_history`) includes the current session timeline **plus** any same-turn responses already generated, so later students can see and react to earlier ones
  - Responses stream to the frontend as they're generated — no waiting for all to finish
  - Individual `asyncio.wait_for` timeouts per student (10s LLM, 8s TTS) so one slow call doesn't block the rest
  - WS send moved inside the loop (was a separate post-gather loop)
- `agents/student_agent.py` — added one instruction line to `_build_context_message`: students are told they may build on, agree with, or push back on classmate responses visible in RECENT CONVERSATION

**Why it matters:**
Previously the orchestrator hard-capped at 2 responders and all LLM calls ran in parallel, so students never saw each other's same-turn responses. Group instructions like "I'd like everyone to share 1 by 1" would get 2 responses max and no debate. Now all 5 students respond to group prompts and each one sees what the previous students said, producing natural classroom dynamics.
