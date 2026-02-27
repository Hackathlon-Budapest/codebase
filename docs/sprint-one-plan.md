# Sprint One Plan

This document outlines responsibilities, tasks, and execution order for
the current sprint across Backend, Azure Integration, and Frontend
teams.

------------------------------------------------------------------------

# Dev 1 --- Backend Lead

**Files:** - `backend/main.py` - `backend/models.py` -
`backend/agents/orchestrator.py` - `backend/agents/feedback_agent.py`

## 1. Wire Feedback into End Session (Critical)

-   `main.py:66` --- `POST /session/{id}/end` currently returns
    `"feedback": null`
-   Call `generate_feedback(session)` from `feedback_agent.py`
-   Return the full result in the response
-   This is the only data source for the dashboard's GPT coaching text

## 2. Add Subject to SessionConfig (Critical)

-   Check `backend/models.py` → confirm `SessionConfig` already has a
    `subject` field
-   If missing, add it alongside `topic` and `grade_level`
-   Verify `main.py` builds `lesson_context` correctly (lines 89--94)
-   Confirm `subject` is present in `session.config`

## 3. Engagement History in StateUpdate Message (Important)

-   Extend the `StateUpdate` model in `models.py` to include
    `turn: number`
-   Attach `session.turn_count` to the state snapshot in `main.py`
-   Ensure frontend can log it as a time-series data point

## 4. Demo Hardening (Important)

-   Add timeout/error fallback if GPT-4o takes too long in the WebSocket
    loop
-   Verify full pipeline works end-to-end:
    -   Start session
    -   Teacher types
    -   Students respond
    -   Engagement updates
    -   End session
    -   Feedback returns

## 5. Verify get_session_summary (Quick Check)

-   Inspect `orchestrator.py:238`
-   Confirm it returns meaningful data:
    -   Student averages
    -   Engagement drops
    -   Turn counts

------------------------------------------------------------------------

# Dev 2 --- Azure Integration

**Files:** - `backend/services/azure_speech.py` -
`backend/services/azure_openai.py` -
`frontend/src/hooks/useAudioRecorder.ts` -
`frontend/src/components/TeacherControls/MicButton.tsx`

## 1. STT Integration in MicButton (Critical)

-   Replace `'[audio]'` placeholder before demo

### Option A (Preferred)

-   Add backend endpoint `POST /stt`
-   Accept `audio_base64`
-   Return transcribed text
-   Call `sendTeacherInput(transcribedText)`

### Option B (Fallback)

-   Add text input next to mic button
-   Remove Azure STT dependency for demo

## 2. Sequential Audio Queue (Important)

-   Prevent overlapping voices
-   Maintain Promise-based audio queue

## 3. Verify Azure TTS Returns Real Audio (Important)

-   Test with real Azure credentials
-   Confirm `text_to_speech()` returns base64-encoded MP3
-   Document fallback behavior if unavailable

## 4. STT Backend Endpoint (If Option A)

-   Add `POST /stt` to `main.py`
-   Input: `{ audio_base64: str }`
-   Return: `{ text: str }`

------------------------------------------------------------------------

# Dev 3 --- Frontend Lead

**Files:** - `frontend/src/components/ClassroomView/` -
`frontend/src/hooks/useWebSocket.ts` -
`frontend/src/store/sessionStore.ts`

## 1. Fix EmotionalState Mismatch (Critical)

-   Backend returns 7 states
-   Extend frontend `EmotionalState` type
-   Add emoji + color mappings for:
    -   eager 🙋
    -   anxious 😰
    -   distracted 😵

## 2. Track Engagement History in Zustand (Important)

Add:

    engagementHistory: EngagementSnapshot[]

Where:

    type EngagementSnapshot = {
      turn: number
      maya: number
      carlos: number
      jake: number
      priya: number
      marcus: number
    }

-   Push snapshot in `applyStateUpdate()`
-   Update `EngagementTimeline.tsx` to use it

## 3. Speaking Animation (Polish)

-   Pulse avatar border 2--3 seconds on response

## 4. Classroom Layout Bug Fix

-   Ensure `lastMessage` passed to each `StudentAvatar`
-   Filter `conversation_log` by student name

------------------------------------------------------------------------

# Dev 4 --- Frontend + Dashboard

**Files:** -
`frontend/src/components/TeacherControls/SessionSetup.tsx` -
`frontend/src/components/Dashboard/SessionReport.tsx` -
`frontend/src/components/Dashboard/FeedbackCards.tsx` -
`frontend/src/store/sessionStore.ts`

## 1. Fix SessionSetup API Call (P0)

Replace hardcoded session ID with real POST call to:

    http://localhost:8000/session

Send:

    { subject, topic, grade_level }

-   Store returned `session_id`
-   Add loading state

## 2. Add Subject Field (P0)

-   Add subject input to form
-   Add `subject` + `setSubject` to store

## 3. Connect End Session to Backend Feedback (Important)

-   Call `POST /session/{session_id}/end`
-   Store:
    -   `feedbackText`
    -   `feedbackSummary`
-   Show loading spinner

## 4. Display GPT Coaching Text (Important)

-   Render `feedbackText` below charts
-   Use `<pre>` or markdown renderer

## 5. Fix EngagementTimeline Data

-   Use `engagementHistory`
-   Show per-student curves

------------------------------------------------------------------------

# Priority Order

  Priority   Who     Task
  ---------- ------- -----------------------------------------
  P0         Dev 4   Fix SessionSetup → real API call
  P0         Dev 4   Add Subject field
  P0         Dev 2   Fix MicButton
  P0         Dev 3   Fix EmotionalState mismatch
  P1         Dev 1   Wire feedback into End Session
  P1         Dev 3   Track engagement history
  P1         Dev 4   Display GPT coaching text
  P1         Dev 2   Sequential audio queue
  P2         Dev 1   Engagement history in StateUpdate
  P2         Dev 3   Speaking animation + lastMessage wiring
  P2         Dev 2   Verify Azure TTS
  P2         Dev 1   Demo hardening

------------------------------------------------------------------------

# Verification / End-to-End Test

1.  `cd backend && uvicorn main:app --reload`
2.  `cd frontend && npm run dev`
3.  Start class with real Subject + Topic + Grade
4.  Confirm real UUID session_id
5.  Send teacher message → student responses appear
6.  Confirm sequential TTS playback
7.  Click End Session → dashboard loads fully
8.  Click Start New Session → store resets

------------------------------------------------------------------------

# Critical Success Signal

First full loop with: - Real session ID - Real student responses -
Classroom view working - Dashboard feedback rendering
