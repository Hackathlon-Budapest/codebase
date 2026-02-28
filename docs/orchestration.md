# Orchestration

## Teacher Input Flow

```
Teacher speaks or types
     │
     ▼
STT (Azure) → transcript  OR  direct text input
     │
     ▼
WebSocket message { type: "teacher_input", text: "..." }
     │
     ▼
Orchestrator Agent (GPT-4o) receives:
  - Teacher's words
  - Current state of all 5 students (engagement, comprehension, emotion, consecutive_turns)
  - Session grade level and subject
  - Decides:
      → WHO responds this turn (0-2 students normally, up to 5 for group questions)
      → WHY (based on persona + engagement + content)
     │
     ▼
Selected student agent(s) generate responses IN PARALLEL
  - Each gets their persona system prompt
  - Plus grade-level adaptation instructions
  - Plus current comprehension/engagement context
  - Plus recent conversation history for debate context
     │
     ▼
TTS pipeline (Azure) — pipelined so next student's LLM runs
while previous student's TTS is generating
     │
     ▼
WebSocket pushes per student:
  { type: "student_response", text, emotional_state, engagement, comprehension, audio_base64 }
     │
     ▼
State update applied (engagement/comprehension deltas + passive drift for non-responders)
     │
     ▼
WebSocket pushes:
  { type: "state_update", turn, students, coaching_hint }
```

## Chaos Injection Flow

```
Teacher presses "Inject Chaos" button
     │
     ▼
POST /session/{id}/chaos
     │
     ▼
chaos_events.py selects random disruption event
  (e.g. "Jake's phone goes off", "Marcus walks out", "Priya looks overwhelmed")
     │
     ▼
Event injected as teacher context into orchestrator
  Orchestrator decides who reacts
  Student agents generate authentic reactions
     │
     ▼
Responses returned via HTTP (conversation log updates)
State updated in session
```

## Orchestrator Decision Rules

- Normally selects 0-2 students per turn
- Selects up to 5 when teacher uses group address keywords ("everyone", "whole class", "go around")
- Avoids selecting same student 3 turns in a row unless directly named
- If teacher asks a direct question and no one was selected, picks most engaged available student as fallback
- Students with bored/distracted state are less likely to be selected
- Students with confused/anxious state may respond with questions

## Passive State Drift

Every turn, non-responding students drift passively:

| Emotional State    | Engagement Drift | Comprehension Drift |
|--------------------|-----------------|---------------------|
| bored/distracted   | -3%             | -1%                 |
| anxious/frustrated | -2%             | 0%                  |
| confused           | -1%             | -2%                 |
| engaged            | +1%             | 0%                  |
| eager              | -1%             | 0%                  |

## Whisper Coach (Rule-Based, No LLM)

Live coaching hints generated each turn by priority:

1. Any student is confused: "Carlos looks confused — try simplifying your language"
2. Low engagement + bored/distracted: "Jake is disengaging — try calling on them directly"
3. Student hasn't spoken in last 5 teacher turns: "Priya hasn't spoken in a while — consider calling on them"
4. Student just re-engaged after being bored: "Marcus just re-engaged — keep the energy up"
5. All students highly engaged: "Class is engaged — great pacing, keep it up"
6. Default: "Keep checking in with individual students"

## Data Model

```python
SessionConfig:
  subject: str       # e.g. "History"
  topic: str         # e.g. "Ancient Rome"
  grade_level: str   # e.g. "Grade 8"

StudentState:
  id: str
  name: str
  persona: str
  voice_id: str
  engagement: float          # 0.0-1.0 internally, displayed as 0-100%
  comprehension: float       # 0.0-1.0 internally, displayed as 0-100%
  emotional_state: EmotionalState
  consecutive_turns_speaking: int
  history: list[dict]

SessionState:
  session_id: str
  config: SessionConfig
  students: dict[str, StudentState]
  timeline: list[dict]       # full chronological event log
  turn_count: int
  active: bool
  chaos_active: bool
  chaos_event: dict | None
```
