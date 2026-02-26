# Roadmap

## 30-Hour Build Plan

### Team Role Split

| Dev   | Role                 | Owns                                                 |
|-------|----------------------|------------------------------------------------------|
| Dev 1 | Backend Lead         | Orchestrator, agent logic, session state             |
| Dev 2 | Azure Integration    | STT/TTS pipeline, sentiment, OpenAI service wrappers |
| Dev 3 | Frontend Lead        | Classroom UI, avatars, WebSocket, real-time updates  |
| Dev 4 | Frontend + Dashboard | Session setup, post-session dashboard, UX polish     |

### Hour-by-Hour Plan

```
HOURS 0-4: FOUNDATIONS (all parallel)
  Dev 1: FastAPI skeleton + WebSocket server + session state model
  Dev 2: Azure OpenAI working call + STT basic test + TTS basic test
  Dev 3: React app + classroom layout with 5 static avatars + WS client
  Dev 4: Session setup UI + Zustand store + routing

HOURS 4-8: CORE PIPELINE
  Dev 1: Orchestrator logic v1 (decides who speaks) + student agent v1
  Dev 2: Full STT→text pipeline working + TTS audio playback in browser
  Dev 3: Avatar emotion states (visual indicators) + engagement bars
  Dev 4: Connect setup form to backend session init

HOURS 8-14: INTEGRATION SPRINT
  Dev 1+2: Connect orchestrator to student agents + sentiment scoring
  Dev 3+4: Wire WebSocket events to UI (avatar reacts, engagement updates live)
  MILESTONE: First full loop — teacher speaks → students react → UI updates

HOURS 14-18: POLISH & DEMO PATH
  Dev 1: Feedback agent (post-session analysis)
  Dev 2: Voice differentiation per student + audio queue management
  Dev 3: Animation polish + classroom "feel"
  Dev 4: Dashboard with charts (engagement timeline, scores)

HOURS 18-22: HARDENING
  All: Integration testing, edge case handling
  Fix: Audio conflicts, WS disconnects, slow response handling
  Add: Loading states, error handling, demo-safe fallbacks

HOURS 22-26: DEMO MODE
  All: Run full demo 5x, fix anything that breaks
  Dev 4: Presentation slides
  Dev 1: Seed a "perfect demo scenario" — canned topic that showcases all 5 personas well

HOURS 26-30: BUFFER + REHEARSAL
  Final polish, demo script rehearsal, submission prep
```

## MVP vs. Full Feature Scope

### Must Have (demo fails without these)

- Teacher voice → student text responses → visible in UI
- 5 distinct personas with different reactions
- Live engagement state visible per student
- Post-session feedback report

### Should Have (strong differentiator)

- TTS for student voices (different per avatar)
- Emotion indicators on avatars
- Engagement timeline chart

### Cut If Needed

- Azure Sentiment API (can fake sentiment from GPT-4o output instead)
- Webcam/video elements
- Persistent session history / database
