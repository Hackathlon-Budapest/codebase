import uuid
import json
import base64
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from models import (
    SessionState, SessionConfig, StudentState,
    StudentResponse, StateUpdate,
    SessionEndMessage, ErrorMessage, EmotionalState
)
from agents.orchestrator import decide_responders, update_student_states
from agents.student_agent import generate_response
from services.azure_speech import text_to_speech, speech_to_text

load_dotenv()

app = FastAPI(title="TeachLab API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions: dict[str, SessionState] = {}

DEFAULT_STUDENTS = [
    StudentState(id="maya", name="Maya", persona="overachiever", voice_id="en-US-AriaNeural", engagement=0.95, comprehension=0.9, emotional_state=EmotionalState.eager),
    StudentState(id="carlos", name="Carlos", persona="esl_student", voice_id="es-MX-JorgeNeural", engagement=0.65, comprehension=0.55, emotional_state=EmotionalState.confused),
    StudentState(id="jake", name="Jake", persona="class_clown", voice_id="en-US-GuyNeural", engagement=0.5, comprehension=0.6, emotional_state=EmotionalState.distracted),
    StudentState(id="priya", name="Priya", persona="anxious_student", voice_id="en-IN-NeerjaNeural", engagement=0.7, comprehension=0.8, emotional_state=EmotionalState.anxious),
    StudentState(id="marcus", name="Marcus", persona="checked_out", voice_id="en-US-DavisNeural", engagement=0.2, comprehension=0.4, emotional_state=EmotionalState.bored),
]

class STTRequest(BaseModel):
    audio_base64: str


@app.get("/health")
async def health():
    return {"status": "ok", "sessions_active": len(sessions)}


@app.post("/stt")
async def stt_endpoint(body: STTRequest):
    try:
        audio_bytes = base64.b64decode(body.audio_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 audio")
    text = await speech_to_text(audio_bytes)
    return {"text": text}

@app.post("/session")
async def create_session(config: SessionConfig):
    session_id = str(uuid.uuid4())
    students = {s.id: s.model_copy(deep=True) for s in DEFAULT_STUDENTS}
    session = SessionState(session_id=session_id, config=config, students=students)
    sessions[session_id] = session
    return {
        "session_id": session_id,
        "students": [{"id": s.id, "name": s.name, "persona": s.persona, "voice_id": s.voice_id} for s in students.values()],
    }

@app.get("/session/{session_id}")
async def get_session(session_id: str):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.post("/session/{session_id}/end")
async def end_session(session_id: str):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.active = False
    return {"session_id": session_id, "timeline": session.timeline, "feedback": None}

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = sessions.get(session_id)
    if not session:
        await websocket.send_text(ErrorMessage(message=f"Session {session_id} not found").model_dump_json())
        await websocket.close()
        return
    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            if data.get("type") == "teacher_input":
                teacher_text = data.get("text", "")
                session.turn_count += 1
                session.timeline.append({"turn": session.turn_count, "speaker": "teacher", "text": teacher_text})

                # 1. Orchestrator decides which students respond this turn
                responders = await decide_responders(teacher_text, session)

                # 2. Generate each selected student's response (in parallel)
                lesson_context = {
                    "subject": session.config.subject,
                    "topic": session.config.topic,
                    "grade_level": session.config.grade_level,
                }

                async def _respond(responder: dict) -> dict | None:
                    sid = responder["student_id"]
                    student = session.students.get(sid)
                    if not student:
                        return None
                    student_dict = {
                        "name": student.name,
                        "comprehension": round(student.comprehension * 100),
                        "engagement": round(student.engagement * 100),
                        "emotional_state": student.emotional_state.value,
                        "response_history": [],
                    }
                    resp = await generate_response(student_dict, teacher_text, session.timeline, lesson_context)
                    audio = await text_to_speech(resp.text, student.voice_id)
                    return {
                        "student_id": sid,
                        "student_name": student.name,
                        "voice_id": student.voice_id,
                        "text": resp.text,
                        "emotional_state": resp.emotional_state,
                        "comprehension_delta": resp.comprehension_delta,
                        "engagement_delta": resp.engagement_delta,
                        "audio_base64": audio,
                    }

                results = await asyncio.gather(*[_respond(r) for r in responders])
                responses = [r for r in results if r]

                # 3. Push each student response to the frontend
                for resp in responses:
                    student = session.students[resp["student_id"]]
                    msg = StudentResponse(
                        student_id=resp["student_id"],
                        student_name=resp["student_name"],
                        text=resp["text"],
                        emotional_state=EmotionalState(resp["emotional_state"]),
                        engagement=student.engagement,
                        comprehension=student.comprehension,
                        audio_base64=resp["audio_base64"],
                    )
                    await websocket.send_text(msg.model_dump_json())

                # 4. Update session state with deltas from this turn
                update_student_states(session, responses)

                # 5. Push updated state snapshot
                state_snapshot = {
                    sid: {
                        "engagement": s.engagement,
                        "comprehension": s.comprehension,
                        "emotional_state": s.emotional_state,
                    }
                    for sid, s in session.students.items()
                }
                await websocket.send_text(StateUpdate(students=state_snapshot).model_dump_json())
            elif data.get("type") == "session_end":
                await websocket.send_text(SessionEndMessage(session_id=session_id).model_dump_json())
                break
    except WebSocketDisconnect:
        print(f"Client disconnected from session {session_id}")
    except Exception as e:
        await websocket.send_text(ErrorMessage(message=str(e)).model_dump_json())


@app.on_event("startup")
async def startup_message():
    print("\n\n  TeachLab API is running!")
    print("  Health check: http://127.0.0.1:8000/health")
    print("  API docs:     http://127.0.0.1:8000/docs\n")
