from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class EmotionalState(str, Enum):
    eager = "eager"
    confused = "confused"
    distracted = "distracted"
    anxious = "anxious"
    bored = "bored"
    engaged = "engaged"
    frustrated = "frustrated"


class StudentState(BaseModel):
    id: str
    name: str
    persona: str
    voice_id: str
    engagement: float = Field(default=0.75, ge=0.0, le=1.0)
    comprehension: float = Field(default=0.75, ge=0.0, le=1.0)
    emotional_state: EmotionalState = EmotionalState.engaged
    consecutive_turns_speaking: int = 0
    history: list[dict] = []


class SessionConfig(BaseModel):
    subject: str
    topic: str
    grade_level: str


class SessionState(BaseModel):
    session_id: str
    config: SessionConfig
    students: dict[str, StudentState] = {}
    timeline: list[dict] = []
    turn_count: int = 0
    active: bool = True


class TeacherMessage(BaseModel):
    type: str = "teacher_input"
    session_id: str
    text: str


class StudentResponse(BaseModel):
    type: str = "student_response"
    student_id: str
    student_name: str
    text: str
    emotional_state: EmotionalState
    engagement: float
    comprehension: float
    audio_base64: Optional[str] = None


class StateUpdate(BaseModel):
    type: str = "state_update"
    students: dict[str, dict]


class SessionEndMessage(BaseModel):
    type: str = "session_end"
    session_id: str


class ErrorMessage(BaseModel):
    type: str = "error"
    message: str
