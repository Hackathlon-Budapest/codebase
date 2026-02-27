# Orchestration

## Orchestrator Logic

This is the brain — it must feel like a real classroom, not a round-robin chatbot.

```
Teacher speaks
     │
     ▼
STT → transcript chunk
     │
     ▼
Orchestrator Agent (GPT-4o) receives:
  - Teacher's words
  - Current state of all 5 students (engagement, emotion, comprehension)
  - Conversation history
  - Decides:
      → WHO responds (0, 1, or 2 students this turn)
      → WHY (based on persona + what was said)
      → Emotional state update for all students
     │
     ▼
Selected student agent(s) generate response
  - Each gets their own system prompt (persona)
  - Plus current comprehension/engagement context
  - Plus what teacher said
     │
     ▼
Responses → TTS (each student has unique voice)
     │
     ▼
State update → WebSocket push to frontend
     │
     ▼
Frontend: avatar animates, emotion indicator updates,
          engagement bars shift in real-time
```

## Data & State Model

```python
# Core session state — lives in memory
SessionState = {
  "session_id": str,
  "topic": str,               # e.g. "The Water Cycle"
  "grade_level": str,         # e.g. "Grade 8"
  "teacher_transcript": [],   # list of teacher utterances
  "conversation_log": [],     # full chronological log

  "students": {
    "maya":   StudentState,
    "carlos": StudentState,
    "jake":   StudentState,
    "priya":  StudentState,
    "marcus": StudentState,
  },

  "timeline": [],             # [{timestamp, speaker, text, emotion, engagement}]
}

StudentState = {
  "name": str,
  "persona": str,             # full persona prompt
  "comprehension": int,       # 0-100, updated each turn
  "engagement": int,          # 0-100, updated each turn
  "emotional_state": str,     # "curious" | "confused" | "bored" | "frustrated" | "engaged"
  "voice_id": str,            # Azure TTS voice name
  "response_history": [],
}
```
