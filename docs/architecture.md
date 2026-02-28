# Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        TEACHLAB PLATFORM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   TEACHER INTERFACE (React)                                     │
│   ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│   │  Mic Input  │    │  Classroom   │    │  Post-Session    │   │
│   │  + Text Box │    │  Live View   │    │  Dashboard       │   │
│   │  + Chaos Btn│    │  + Whisper   │    │  + Autopsy       │   │
│   └──────┬──────┘    └──────┬───────┘    └──────────────────┘   │
│          │                  │                                   │
├──────────▼──────────────────▼───────────────────────────────────┤
│                     BACKEND (FastAPI)                           │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                  SESSION ORCHESTRATOR                   │   │
│   │   - Receives teacher transcript or chaos event          │   │
│   │   - Decides which student(s) respond (0-5 per turn)     │   │
│   │   - Manages classroom state & timing                    │   │
│   │   - Tracks emotional/engagement state per student       │   │
│   │   - Generates live coaching hints (rule-based)          │   │
│   └─────────────────────────┬───────────────────────────────┘   │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼               │
│    ┌──────────┐       ┌──────────┐       ┌──────────┐           │
│    │ Student  │       │ Student  │       │ Student  │  ...x5    │
│    │  Agent   │       │  Agent   │       │  Agent   │           │
│    │  (Maya)  │       │ (Carlos) │       │  (Jake)  │           │
│    └──────────┘       └──────────┘       └──────────┘           │
│         │  Grade-level adaptation injected into every prompt    │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │               FEEDBACK ENGINE                           │   │
│   │   - feedback_agent.py: GPT-4o coaching text             │   │
│   │   - autopsy_agent.py: Teaching autopsy analysis         │   │
│   │   - orchestrator.py: Session summary + key moments      │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │               CHAOS SYSTEM                              │   │
│   │   - POST /session/{id}/chaos endpoint                   │   │
│   │   - 8 pre-built disruption events in chaos_events.py    │   │
│   │   - Injected as teacher context into orchestrator       │   │
│   │   - Students react authentically via existing pipeline  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                      AZURE SERVICES                             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Azure STT   │  │  Azure TTS   │  │  Azure OpenAI (GPT-4o)│  │
│  │ (Teacher     │  │ (Student     │  │  Orchestrator +       │  │
│  │  voice in)   │  │  voices out) │  │  All Agents           │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Folder Structure

```
teachlab/
├── frontend/
│   ├── public/
│   │   └── avatars/                       # Per-student per-emotion avatar images (.webp)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ClassroomView/
│   │   │   │   ├── StudentAvatar.tsx       # Avatar + emotion state + speaking animation
│   │   │   │   ├── EngagementBar.tsx       # Live engagement/comprehension bars
│   │   │   │   ├── ClassroomLayout.tsx     # 5-seat classroom grid + speech bubbles
│   │   │   │   ├── TemperatureGauge.tsx    # Classroom temperature arc gauge
│   │   │   │   ├── WhisperCoach.tsx        # Live coaching hint display
│   │   │   │   └── ChaosButton.tsx         # Chaos injection button
│   │   │   ├── TeacherControls/
│   │   │   │   ├── MicButton.tsx           # Record + send voice via Azure STT
│   │   │   │   └── SessionSetup.tsx        # Subject, topic, grade level form
│   │   │   └── Dashboard/
│   │   │       ├── SessionReport.tsx       # Post-session full report
│   │   │       ├── EngagementTimeline.tsx  # Per-student engagement chart (Recharts)
│   │   │       ├── FeedbackCards.tsx       # Engagement/Comprehension/Participation/Inclusivity
│   │   │       └── TeachingAutopsy.tsx     # GPT-powered teaching autopsy
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts             # WS connection + message handler
│   │   │   └── useAudioRecorder.ts         # Mic recording hook
│   │   ├── store/
│   │   │   └── sessionStore.ts             # Zustand global state
│   │   └── App.tsx
│   └── package.json
│
├── backend/
│   ├── agents/
│   │   ├── orchestrator.py                 # Decides who responds + coaching hints + summary
│   │   ├── student_agent.py                # Student response generator + grade adaptation
│   │   ├── feedback_agent.py               # GPT-4o post-session coaching text
│   │   └── autopsy_agent.py                # Teaching autopsy analysis
│   ├── personas/
│   │   └── personas.py                     # All 5 persona definitions
│   ├── services/
│   │   ├── azure_openai.py                 # GPT-4o wrapper
│   │   └── azure_speech.py                 # STT + TTS
│   ├── chaos_events.py                     # 8 classroom disruption events
│   ├── models.py                           # Pydantic state models
│   └── main.py                             # FastAPI app + all endpoints + WebSocket
│
└── docs/
```

## WebSocket Message Contract

### Frontend → Backend

```json
{ "type": "teacher_input", "session_id": "abc-123", "text": "Today we learn fractions." }
{ "type": "session_end", "session_id": "abc-123" }
```

### Backend → Frontend

```json
{ "type": "student_response", "student_id": "maya", "student_name": "Maya", "text": "...", "emotional_state": "eager", "engagement": 0.95, "comprehension": 0.9, "audio_base64": null }
{ "type": "state_update", "turn": 3, "students": { "maya": { "engagement": 0.95, "comprehension": 0.9, "emotional_state": "eager" } }, "coaching_hint": "Maya looks confused — try simplifying" }
{ "type": "session_end", "session_id": "abc-123" }
{ "type": "error", "message": "something went wrong" }
```

## REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /session | Create session, returns session_id + student list |
| GET | /session/{id} | Get current session state |
| POST | /session/{id}/end | End session, returns timeline + GPT feedback |
| POST | /session/{id}/chaos | Inject a random chaos event |
| POST | /stt | Speech-to-text, accepts audio_base64 |
| WS | /ws/{id} | WebSocket for real-time classroom interaction |
