import uuid
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from models import (
    SessionState, SessionConfig, StudentState,
    StudentResponse, StateUpdate,
    SessionEndMessage, ErrorMessage, EmotionalState
)

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

@app.get("/health")
async def health():
    return {"status": "ok", "sessions_active": len(sessions)}

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
                echo_response = StudentResponse(
                    student_id="maya", student_name="Maya",
                    text=f"[ECHO] Teacher said: {teacher_text}",
                    emotional_state=EmotionalState.eager, engagement=0.95, comprehension=0.9,
                )
                await websocket.send_text(echo_response.model_dump_json())
                state_snapshot = {sid: {"engagement": s.engagement, "comprehension": s.comprehension, "emotional_state": s.emotional_state} for sid, s in session.students.items()}
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
