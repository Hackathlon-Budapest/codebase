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
│   │  + Controls │    │  Live View   │    │  Dashboard       │   │
│   └──────┬──────┘    └──────┬───────┘    └──────────────────┘   │
│          │                  │                                   │
├──────────▼──────────────────▼───────────────────────────────────┤
│                     BACKEND (FastAPI)                           │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                  SESSION ORCHESTRATOR                   │   │
│   │   - Receives teacher transcript                         │   │
│   │   - Decides which student(s) respond                    │   │
│   │   - Manages classroom state & timing                    │   │
│   │   - Tracks emotional/engagement state per student       │   │
│   └─────────────────────────┬───────────────────────────────┘   │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼               │
│    ┌──────────┐       ┌──────────┐       ┌──────────┐           │
│    │ Student  │       │ Student  │       │ Student  │  ...x5    │
│    │ Agent A  │       │ Agent B  │       │ Agent C  │           │
│    │ (Eager)  │       │ (ESL)    │       │(Distract)│           │
│    └──────────┘       └──────────┘       └──────────┘           │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │               FEEDBACK ENGINE                           │   │
│   │   - Analyzes full session transcript                    │   │
│   │   - Scores: clarity, engagement, pacing, inclusivity    │   │
│   │   - Generates moment-by-moment insights                 │   │
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
│                                                                 │
│              ┌──────────────────────────────┐                   │
│              │  Azure Language / Sentiment  │                   │
│              │  (Emotion tagging on student │                   │
│              │   responses for analytics)   │                   │
│              └──────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

## Folder Structure

```
teachlab/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ClassroomView/
│   │   │   │   ├── StudentAvatar.tsx      # Individual avatar + emotion state
│   │   │   │   ├── EngagementBar.tsx      # Live engagement indicator
│   │   │   │   └── ClassroomLayout.tsx    # 5-seat classroom grid
│   │   │   ├── TeacherControls/
│   │   │   │   ├── MicButton.tsx          # Record + send voice
│   │   │   │   └── SessionSetup.tsx       # Topic, grade level input
│   │   │   └── Dashboard/
│   │   │       ├── SessionReport.tsx      # Post-session analytics
│   │   │       ├── EngagementTimeline.tsx # Chart: engagement over time
│   │   │       └── FeedbackCards.tsx      # Scored feedback per dimension
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   └── useAudioRecorder.ts
│   │   ├── store/
│   │   │   └── sessionStore.ts            # Zustand state
│   │   └── App.tsx
│   └── package.json
│
├── backend/
│   ├── agents/
│   │   ├── orchestrator.py                # Core decision engine
│   │   ├── student_agent.py               # Student response generator
│   │   └── feedback_agent.py              # Post-session analysis
│   ├── personas/
│   │   └── personas.py                    # All 5 persona definitions
│   ├── services/
│   │   ├── azure_openai.py                # GPT-4o wrapper
│   │   ├── azure_speech.py                # STT + TTS
│   │   └── azure_sentiment.py             # Emotion tagging
│   ├── models/
│   │   └── session.py                     # Pydantic state models
│   ├── api/
│   │   ├── websocket.py                   # WS endpoint
│   │   └── routes.py                      # REST (session init, report)
│   ├── main.py
│   └── requirements.txt
│
└── README.md
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
{ "type": "state_update", "students": { "maya": { "engagement": 0.95, "comprehension": 0.9, "emotional_state": "eager" } } }
{ "type": "session_end", "session_id": "abc-123" }
{ "type": "error", "message": "something went wrong" }
```
