"""
Orchestrator — Classroom Response Decision Engine

Decides which students (0-2) respond to a given teacher input each turn.
Uses weighted probability with recency penalties to simulate realistic
classroom participation patterns.

Pure Python — no LLM or Azure calls required.
"""

import random
from typing import Any


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Base response probability per persona (matches persona response_probability
# values defined in personas/personas.py)
BASE_WEIGHTS: dict[str, float] = {
    "maya":   0.85,  # Eager overachiever — almost always wants to respond
    "carlos": 0.55,  # ESL student — moderate, participates when confident
    "jake":   0.40,  # Distracted — low, needs to be called on
    "priya":  0.30,  # Anxious/quiet — rarely volunteers
    "marcus": 0.60,  # Skeptical — speaks up when he has a challenge or question
}

# If a student spoke within this many turns, apply the recency penalty
RECENCY_WINDOW: int = 2
RECENCY_MULTIPLIER: float = 0.1  # Weight is scaled down to 10% of base

MAX_RESPONDERS: int = 2  # A classroom rarely has more than 2 students speak at once


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _effective_weight(
    student_id: str,
    state: dict[str, Any],
    turn_number: int,
) -> tuple[float, bool]:
    """
    Compute the effective response weight for a student this turn.

    Returns:
        (weight, penalty_applied)
    """
    base = BASE_WEIGHTS.get(student_id, 0.5)
    last_spoke = state.get("last_spoke_turn", -999)

    penalty_applied = (
        last_spoke >= 0
        and (turn_number - last_spoke) <= RECENCY_WINDOW
    )

    weight = base * RECENCY_MULTIPLIER if penalty_applied else base
    return weight, penalty_applied


def _build_reason(
    student_id: str,
    weight: float,
    penalty_applied: bool,
    last_spoke_turn: int,
    turn_number: int,
) -> str:
    """Return a short human-readable explanation for why this student was selected."""
    parts = []

    if penalty_applied:
        gap = turn_number - last_spoke_turn
        parts.append(
            f"recency penalty applied (spoke {gap} turn{'s' if gap != 1 else ''} ago, "
            f"weight reduced to {weight:.2f})"
        )
    else:
        base = BASE_WEIGHTS.get(student_id, 0.5)
        if base >= 0.75:
            parts.append(f"high participation tendency (base weight {base})")
        elif base >= 0.50:
            parts.append(f"moderate participation tendency (base weight {base})")
        else:
            parts.append(f"low participation tendency (base weight {base}), selected this turn")

    return "; ".join(parts)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def decide_responders(
    teacher_input: str,
    all_student_states: list[dict[str, Any]],
    turn_number: int,
) -> list[dict[str, str]]:
    """
    Decide which students (0-2) respond to the teacher's input this turn.

    Selection logic:
      1. Compute effective weight per student (base weight × recency penalty if applicable).
      2. Each student independently rolls against their weight — they "want to respond"
         if roll < weight.
      3. If more than MAX_RESPONDERS want to respond, keep the highest-weight ones.
      4. Never forces a response — if all rolls fail, returns an empty list.

    Args:
        teacher_input:      What the teacher just said (available for future
                            context-aware weight modifiers).
        all_student_states: List of student state dicts. Each dict must have a
                            "name" or "id" key matching a key in BASE_WEIGHTS.
                            Optionally includes "last_spoke_turn": int.
        turn_number:        Current 1-indexed turn number.

    Returns:
        List of dicts, each: {"student_id": str, "reason": str}
        May be empty — 0, 1, or 2 entries.
    """
    candidates: list[dict[str, Any]] = []

    for state in all_student_states:
        # Accept either "name" or "id" as the student identifier
        student_id = state.get("name", state.get("id", ""))
        if isinstance(student_id, str):
            student_id = student_id.lower()

        if student_id not in BASE_WEIGHTS:
            continue

        weight, penalty_applied = _effective_weight(student_id, state, turn_number)
        last_spoke = state.get("last_spoke_turn", -999)

        roll = random.random()
        if roll < weight:
            candidates.append({
                "student_id": student_id,
                "weight": weight,
                "penalty_applied": penalty_applied,
                "last_spoke_turn": last_spoke,
                "roll": roll,
            })

    # If more than MAX_RESPONDERS passed their roll, keep the highest-weight ones
    if len(candidates) > MAX_RESPONDERS:
        candidates.sort(key=lambda c: c["weight"], reverse=True)
        candidates = candidates[:MAX_RESPONDERS]

    return [
        {
            "student_id": c["student_id"],
            "reason": _build_reason(
                c["student_id"],
                c["weight"],
                c["penalty_applied"],
                c["last_spoke_turn"],
                turn_number,
            ),
        }
        for c in candidates
    ]


# ---------------------------------------------------------------------------
# Standalone test — run: python orchestrator.py
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys
    sys.path.insert(0, __file__.replace("/agents/orchestrator.py", ""))

    TEACHER_TURNS = [
        "Good morning everyone! Today we're covering photosynthesis.",
        "Can anyone tell me what plants need to make their own food?",
        "That's right! Now, the equation is 6CO2 + 6H2O + light → glucose + oxygen.",
        "Why do you think leaves are green? Think about what that tells us.",
        "Excellent. Last question — what would happen to a plant kept in the dark?",
    ]

    # Simulate a classroom session: track who spoke each turn
    student_states: list[dict[str, Any]] = [
        {"name": "maya",   "last_spoke_turn": -999},
        {"name": "carlos", "last_spoke_turn": -999},
        {"name": "jake",   "last_spoke_turn": -999},
        {"name": "priya",  "last_spoke_turn": -999},
        {"name": "marcus", "last_spoke_turn": -999},
    ]

    print("\n" + "═" * 62)
    print("  ORCHESTRATOR TEST — 5 turns, photosynthesis lesson")
    print("═" * 62)

    random.seed(42)  # Fixed seed for reproducible output

    for turn_num, teacher_text in enumerate(TEACHER_TURNS, start=1):
        responders = decide_responders(teacher_text, student_states, turn_num)

        print(f"\nTurn {turn_num}: \"{teacher_text}\"")

        if responders:
            for r in responders:
                print(f"  → {r['student_id'].capitalize():8s}  [{r['reason']}]")
            # Update last_spoke_turn for students who responded
            responded_ids = {r["student_id"] for r in responders}
            for state in student_states:
                if state["name"] in responded_ids:
                    state["last_spoke_turn"] = turn_num
        else:
            print("  → (nobody volunteers this turn)")

    print("\n" + "─" * 62)
    print("  Final last_spoke_turn per student:")
    for state in student_states:
        lsp = state["last_spoke_turn"]
        spoke_str = f"turn {lsp}" if lsp >= 0 else "never"
        print(f"    {state['name'].capitalize():8s}  last spoke: {spoke_str}")
    print()
