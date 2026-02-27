"""
Student Agent

Generates student responses based on persona, current state, and conversation context.
Each student agent embodies a distinct persona with unique personality and behavior patterns.
"""

import json
from dataclasses import dataclass
from typing import Literal

from personas.personas import get_persona, PersonaDefinition, EmotionalState
from services.azure_openai import chat_completion_json


@dataclass
class StudentResponse:
    """Response from a student agent."""
    text: str
    emotional_state: EmotionalState
    comprehension_delta: int  # -20 to +20
    engagement_delta: int  # -20 to +20


@dataclass
class StudentState:
    """Current state of a student (passed in from session)."""
    name: str
    comprehension: int  # 0-100
    engagement: int  # 0-100
    emotional_state: EmotionalState
    response_history: list[str]


def _build_context_message(
    state: StudentState,
    persona: PersonaDefinition,
    teacher_input: str,
    history: list[dict],
    lesson_context: dict | None = None,
) -> str:
    """Build the context message that includes current state and teacher input."""

    # Lesson context block
    if lesson_context:
        lesson_block = (
            f"LESSON CONTEXT:\n"
            f"- Subject: {lesson_context.get('subject', 'Unknown')}\n"
            f"- Topic: {lesson_context.get('topic', 'Unknown')}\n"
            f"- Grade level: {lesson_context.get('grade_level', 'Unknown')}\n\n"
        )
    else:
        lesson_block = ""

    # Recent history summary (last few exchanges)
    recent_history = ""
    if history:
        recent = history[-6:]  # Last 3 exchanges
        for entry in recent:
            speaker = entry.get("speaker", "unknown")
            text = entry.get("text", "")
            recent_history += f"  {speaker}: {text}\n"

    return f"""{lesson_block}CURRENT STATE:
- Comprehension level: {state.comprehension}/100
- Engagement level: {state.engagement}/100
- Current emotion: {state.emotional_state}

RECENT CONVERSATION:
{recent_history if recent_history else "  (Start of lesson)"}

TEACHER JUST SAID:
"{teacher_input}"

RESPONSE INSTRUCTIONS:
Respond naturally as {persona.display_name} would in this moment. Consider:
- Your current comprehension and engagement levels
- Your personality and typical speech patterns
- Whether you would even speak right now (you might stay quiet)
- How this interaction affects your emotional state
- If classmates have already spoken this turn (visible in RECENT CONVERSATION), you may
  naturally build on, agree with, or gently push back on what they said — realistic classroom dynamics

Your response length should be {persona.response_length[0]}-{persona.response_length[1]} words.

Provide your response as JSON with these fields:
{{
  "text": "What you say (or empty string if you stay silent)",
  "emotional_state": "eager|confused|bored|frustrated|engaged|anxious|distracted",
  "comprehension_delta": <integer -20 to +20, how this affected your understanding>,
  "engagement_delta": <integer -20 to +20, how this affected your engagement>
}}

Rules for deltas:
- Positive delta = the teacher's input helped/engaged you
- Negative delta = the teacher's input confused/disengaged you
- Zero = no significant change
- Be realistic based on your persona's triggers and behavior patterns"""


async def generate_response(
    student_state: dict | StudentState,
    teacher_input: str,
    history: list[dict],
    lesson_context: dict | None = None,
) -> StudentResponse:
    """
    Generate a student response to teacher input.

    Args:
        student_state: Current state of the student (dict or StudentState)
        teacher_input: What the teacher just said
        history: Conversation history [{speaker, text, ...}, ...]
        lesson_context: Optional dict with subject, topic, grade_level from SessionConfig

    Returns:
        StudentResponse with text, emotional_state, and state deltas
    """
    # Convert dict to StudentState if needed
    if isinstance(student_state, dict):
        state = StudentState(
            name=student_state["name"],
            comprehension=student_state.get("comprehension", 50),
            engagement=student_state.get("engagement", 50),
            emotional_state=student_state.get("emotional_state", "curious"),
            response_history=student_state.get("response_history", []),
        )
    else:
        state = student_state

    # Get persona definition
    persona = get_persona(state.name)

    # Build messages
    messages = [
        {"role": "system", "content": persona.system_prompt},
        {"role": "user", "content": _build_context_message(state, persona, teacher_input, history, lesson_context)},
    ]

    # Call LLM
    response_data = await chat_completion_json(
        messages=messages,
        temperature=0.8,  # Some creativity for natural responses
        max_tokens=100,
    )

    # Parse and validate response
    text = response_data.get("text", "")
    emotional_state = response_data.get("emotional_state", state.emotional_state)
    comprehension_delta = _clamp(int(response_data.get("comprehension_delta", 0)), -20, 20)
    engagement_delta = _clamp(int(response_data.get("engagement_delta", 0)), -20, 20)

    # Validate emotional state
    valid_emotions = {"eager", "confused", "bored", "frustrated", "engaged", "anxious", "distracted"}
    if emotional_state not in valid_emotions:
        emotional_state = state.emotional_state

    return StudentResponse(
        text=text,
        emotional_state=emotional_state,
        comprehension_delta=comprehension_delta,
        engagement_delta=engagement_delta,
    )


def _clamp(value: int, min_val: int, max_val: int) -> int:
    """Clamp a value to a range."""
    return max(min_val, min(max_val, value))


async def generate_responses_batch(
    student_states: list[dict],
    teacher_input: str,
    history: list[dict],
    selected_students: list[str],
    lesson_context: dict | None = None,
) -> dict[str, StudentResponse]:
    """
    Generate responses for multiple selected students.

    Args:
        student_states: List of all student state dicts
        teacher_input: What the teacher said
        history: Conversation history
        selected_students: Names of students who should respond
        lesson_context: Optional dict with subject, topic, grade_level from SessionConfig

    Returns:
        Dict mapping student name to their response
    """
    import asyncio

    # Filter to selected students
    states_to_process = [s for s in student_states if s["name"] in selected_students]

    # Generate responses in parallel
    tasks = [
        generate_response(state, teacher_input, history, lesson_context)
        for state in states_to_process
    ]

    responses = await asyncio.gather(*tasks)

    return {
        state["name"]: response
        for state, response in zip(states_to_process, responses)
    }
