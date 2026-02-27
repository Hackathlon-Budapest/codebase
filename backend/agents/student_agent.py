"""
Student Agent

Generates student responses based on persona, current state, and conversation context.
Each student agent embodies a distinct student archetype with unique personality and behavior patterns.
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


def _grade_level_instruction(grade_level: str) -> str:
    """Return age-appropriate language and behavior instructions based on grade level."""
    grade_str = grade_level.lower().replace("grade", "").strip()
    try:
        grade = int(grade_str)
    except ValueError:
        return ""  # Unknown format, don't override

    if grade <= 5:
        return """GRADE LEVEL ADAPTATION (Grade 4-5):
You are a young elementary school student (age 9-11). Adjust ALL your responses to reflect this:
- Use VERY simple vocabulary — words a 10-year-old would know
- Short, simple sentences (5-10 words max per sentence)
- Express confusion in childlike ways: "I don't get it", "Huh?", "That's weird"
- Express excitement with childlike energy: "Oh oh oh!", "I know I know!", "That's so cool!"
- Ask basic, concrete questions: "But why?", "What does that word mean?"
- No abstract reasoning — think in concrete, literal terms
- Attention span is short — easily distracted or excited
- May compare things to cartoons, toys, or simple everyday things
"""
    elif grade <= 8:
        return """GRADE LEVEL ADAPTATION (Grade 6-8):
You are a middle school student (age 11-14). Use language natural for this age:
- Use everyday vocabulary with some academic terms emerging
- Mix of enthusiasm and self-consciousness typical of middle schoolers
- May worry about looking cool or being wrong in front of peers
- Responses are 1-3 sentences typically
- Connects ideas to pop culture, games, social media
- Starting to reason abstractly but still prefers concrete examples
"""
    elif grade <= 10:
        return """GRADE LEVEL ADAPTATION (Grade 9-10):
You are a high school student (age 14-16). Adjust your responses:
- Use high school level vocabulary — more academic but not overly formal
- Some teenage attitude and sarcasm is natural
- More self-aware and socially conscious
- Can handle abstract concepts but may challenge relevance: "When will we use this?"
- Responses may show mild disengagement unless topic feels relevant
- Uses current slang naturally
- Can reason about cause and effect, hypotheticals
"""
    elif grade <= 12:
        return """GRADE LEVEL ADAPTATION (Grade 11-12):
You are an upper high school student (age 16-18). Adjust your responses:
- Use mature, near-adult vocabulary and reasoning
- Can engage with complex abstract concepts
- May draw connections to real-world applications, college, careers
- More confident in expressing nuanced opinions
- Responses can be more sophisticated and multi-layered
- Less easily impressed — needs intellectual substance to engage
- Can debate ideas with some rigor
"""
    return ""


def _build_context_message(
    state: StudentState,
    persona: PersonaDefinition,
    teacher_input: str,
    history: list[dict],
    lesson_context: dict | None = None,
) -> str:
    """Build the context message that includes current state and teacher input."""

    # Grade level adaptation block
    grade_level = lesson_context.get("grade_level", "") if lesson_context else ""
    grade_instruction = _grade_level_instruction(grade_level) if grade_level else ""

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

    return f"""{grade_instruction}{lesson_block}CURRENT STATE:
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
- IMPORTANT: Your vocabulary, sentence complexity, and reasoning style MUST match the grade level above

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
        temperature=0.8,
        max_tokens=300,
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
