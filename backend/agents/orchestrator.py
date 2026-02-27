"""
Orchestrator agent — routes teacher input to 0-2 student responders and
updates session state after responses arrive.

Interface contract with Dev 2:
  Expected from services.azure_openai:
    async def chat_completion(messages: list[dict], json_mode: bool = False) -> dict

  Expected from agents.student_agent:
    async def generate_response(
        student_state: StudentState,
        teacher_input: str,
        history: list[dict]
    ) -> dict  # {text, emotional_state, comprehension_delta, engagement_delta}
"""

import json
import random
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import SessionState, EmotionalState

try:
    from services.azure_openai import chat_completion_json
except ImportError:
    chat_completion_json = None  # Dev 2's module not yet ready

try:
    from agents.student_agent import generate_response
except ImportError:
    generate_response = None  # Dev 2's module not yet ready


# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

ORCHESTRATOR_SYSTEM_PROMPT = """You are a classroom orchestrator for TeachLab, an AI flight simulator for teachers.
Your job is to decide which students react to the teacher's input each turn.

The classroom has 5 student personas with the following base response probabilities:
- maya       (overachiever, eager)         base_prob=0.85
- carlos     (ESL student, often confused) base_prob=0.60
- jake       (class clown, distracted)     base_prob=0.55
- priya      (anxious student)             base_prob=0.30
- marcus     (checked out)                 base_prob=0.70

Rules:
1. Select 0, 1, or 2 students to respond. Silence (0 responders) is realistic and valid.
2. Use each student's current engagement, comprehension, and emotional_state to adjust
   their probability of responding beyond the base probability.
3. Avoid selecting the same student 3 turns in a row (consecutive_turns_speaking >= 2).
   Only override this if the teacher directly addressed that student by name.
4. Students who are confused or anxious may respond with questions.
5. Students who are bored or distracted are less likely to respond unprompted.

Return ONLY valid JSON in this exact format:
{
  "responders": [
    {"student_id": "<id>", "reason": "<brief reason for selection>"}
  ]
}

The responders array may be empty. Do not include any text outside the JSON object.
"""


# ---------------------------------------------------------------------------
# decide_responders
# ---------------------------------------------------------------------------

async def decide_responders(teacher_input: str, session: SessionState) -> list[dict]:
    """
    Given the teacher's input and all student states, decide which 0-2 students
    respond this turn.

    Returns a list of dicts: [{"student_id": str, "reason": str}]
    """
    # Build a compact JSON summary of all students for the prompt
    students_summary = {
        sid: {
            "engagement": round(s.engagement, 3),
            "comprehension": round(s.comprehension, 3),
            "emotional_state": s.emotional_state.value,
            "consecutive_turns_speaking": s.consecutive_turns_speaking,
        }
        for sid, s in session.students.items()
    }

    user_message = (
        f"Teacher said: \"{teacher_input}\"\n\n"
        f"Current student states:\n{json.dumps(students_summary, indent=2)}\n\n"
        f"Select 0-2 students to respond this turn. Remember: avoid students with "
        f"consecutive_turns_speaking >= 2 unless the teacher directly addressed them."
    )

    messages = [
        {"role": "system", "content": ORCHESTRATOR_SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    # --- Call GPT-4o orchestrator ---
    if chat_completion_json is not None:
        try:
            result = await chat_completion_json(messages)
            raw_responders = result.get("responders", [])
        except Exception:
            raw_responders = _fallback_responders(session)
    else:
        # Dev 2's service not yet available — use local heuristic fallback
        raw_responders = _fallback_responders(session)

    # Validate and cap at 2 responders
    valid_ids = set(session.students.keys())
    responders = [
        r for r in raw_responders
        if isinstance(r, dict) and r.get("student_id") in valid_ids
    ][:2]

    return responders


def _fallback_responders(session: SessionState) -> list[dict]:
    """
    Heuristic fallback when the Azure OpenAI service is unavailable.
    Selects 0-1 students based on engagement and recency.
    """
    base_probs = {
        "maya": 0.85,
        "carlos": 0.60,
        "jake": 0.55,
        "priya": 0.30,
        "marcus": 0.70,
    }

    candidates = []
    for sid, student in session.students.items():
        # Apply recency penalty
        if student.consecutive_turns_speaking >= 2:
            continue
        prob = base_probs.get(sid, 0.5) * student.engagement
        if random.random() < prob:
            candidates.append({"student_id": sid, "reason": "heuristic fallback"})

    # Return at most 1 responder in fallback mode to be conservative
    random.shuffle(candidates)
    return candidates[:1]


# ---------------------------------------------------------------------------
# update_student_states
# ---------------------------------------------------------------------------

def update_student_states(session: SessionState, responses: list[dict]) -> None:
    """
    Update all student states after a turn.

    `responses` is a list of dicts produced by Dev 2's generate_response():
      {
        "student_id": str,
        "text": str,
        "emotional_state": str,
        "comprehension_delta": float,
        "engagement_delta": float,
      }

    Side effects:
    - Mutates session.students in place.
    - Appends events to session.timeline.
    """
    responding_ids = {r["student_id"] for r in responses}

    # --- Apply updates for responding students ---
    for response in responses:
        sid = response.get("student_id")
        if sid not in session.students:
            continue
        student = session.students[sid]

        # student_agent returns deltas on a 0-100 scale; session state uses 0.0-1.0
        comp_delta = float(response.get("comprehension_delta", 0.0)) / 100.0
        eng_delta = float(response.get("engagement_delta", 0.0)) / 100.0

        student.comprehension = _clamp(student.comprehension + comp_delta)
        student.engagement = _clamp(student.engagement + eng_delta)

        new_emotion = response.get("emotional_state")
        if new_emotion and new_emotion in EmotionalState._value2member_map_:
            student.emotional_state = EmotionalState(new_emotion)

        student.consecutive_turns_speaking += 1

        # Append to timeline
        session.timeline.append({
            "turn": session.turn_count,
            "speaker": sid,
            "text": response.get("text", ""),
            "emotional_state": student.emotional_state.value,
            "engagement": round(student.engagement, 4),
            "comprehension": round(student.comprehension, 4),
        })

    # --- Apply passive drift for non-responding students ---
    for sid, student in session.students.items():
        if sid in responding_ids:
            continue

        # Small passive engagement drift based on current state
        if student.emotional_state in (EmotionalState.bored, EmotionalState.distracted):
            drift = -0.02
        elif student.emotional_state == EmotionalState.engaged:
            drift = +0.01
        else:
            drift = 0.0

        student.engagement = _clamp(student.engagement + drift)
        student.consecutive_turns_speaking = 0


def _clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, value))


# ---------------------------------------------------------------------------
# get_session_summary
# ---------------------------------------------------------------------------

def get_session_summary(session: SessionState) -> dict:
    """
    Compute a post-session summary across all students and timeline events.

    Returns:
    {
        "total_turns": int,
        "class_average_engagement": float,
        "class_average_comprehension": float,
        "students_summary": {
            "<student_id>": {
                "name": str,
                "average_engagement": float,
                "average_comprehension": float,
                "turns_spoken": int,
            }
        },
        "key_moments": [
            {
                "turn": int,
                "student_id": str,
                "engagement_drop": float,
                "engagement_after": float,
            }
        ]
    }
    """
    # Collect per-student timeline entries
    student_turns: dict[str, list[dict]] = {sid: [] for sid in session.students}
    for event in session.timeline:
        sid = event.get("speaker")
        if sid and sid in student_turns:
            student_turns[sid].append(event)

    students_summary: dict[str, dict] = {}
    all_engagements: list[float] = []
    all_comprehensions: list[float] = []

    for sid, student in session.students.items():
        turns = student_turns[sid]
        if turns:
            avg_eng = sum(t["engagement"] for t in turns) / len(turns)
            avg_comp = sum(t["comprehension"] for t in turns) / len(turns)
        else:
            # No turns spoken — use current state as best estimate
            avg_eng = student.engagement
            avg_comp = student.comprehension

        students_summary[sid] = {
            "name": student.name,
            "average_engagement": round(avg_eng, 4),
            "average_comprehension": round(avg_comp, 4),
            "turns_spoken": len(turns),
        }
        all_engagements.append(avg_eng)
        all_comprehensions.append(avg_comp)

    # Key moments: turns where any student's engagement dropped > 0.15 in one step
    key_moments: list[dict] = []
    # Build per-student engagement history in turn order
    for sid in session.students:
        turns = sorted(student_turns[sid], key=lambda t: t.get("turn", 0))
        for i in range(1, len(turns)):
            prev_eng = turns[i - 1]["engagement"]
            curr_eng = turns[i]["engagement"]
            drop = prev_eng - curr_eng
            if drop > 0.15:
                key_moments.append({
                    "turn": turns[i]["turn"],
                    "student_id": sid,
                    "engagement_drop": round(drop, 4),
                    "engagement_after": round(curr_eng, 4),
                })

    key_moments.sort(key=lambda m: m["turn"])

    class_avg_eng = round(sum(all_engagements) / len(all_engagements), 4) if all_engagements else 0.0
    class_avg_comp = round(sum(all_comprehensions) / len(all_comprehensions), 4) if all_comprehensions else 0.0

    return {
        "total_turns": session.turn_count,
        "class_average_engagement": class_avg_eng,
        "class_average_comprehension": class_avg_comp,
        "students_summary": students_summary,
        "key_moments": key_moments,
    }
