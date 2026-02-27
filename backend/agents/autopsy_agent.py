"""
Teaching Autopsy Agent

Analyses the full session timeline and produces a turn-by-turn annotated
breakdown showing exactly what each teacher utterance did to each student.
"""

import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import SessionState
from services.azure_openai import chat_completion_json


AUTOPSY_SYSTEM_PROMPT = """You are an expert teacher coach performing a post-session diagnostic autopsy.

You will receive a classroom simulation transcript. Each teacher turn is followed by student responses
that include comprehension_delta and engagement_delta values (positive = improved, negative = worsened).
Students who did not speak this turn still had their internal state affected — infer from context and persona.

The five student personas:
- Maya: eager overachiever, high baseline engagement/comprehension, gets bored with slow pace
- Carlos: ESL student, low baseline comprehension, shuts down with complex vocabulary
- Jake: distracted/ADHD, low engagement, needs energy and direct callouts
- Priya: anxious/quiet, moderate baseline, blooms with encouragement, shuts down under pressure
- Marcus: skeptical thinker, needs intellectual challenge, disengages from oversimplification

For EVERY teacher turn, annotate its impact on ALL FIVE students (even those who did not speak).
Base annotations on: the actual student responses and deltas if present, otherwise infer from persona.

Return a JSON object with this exact structure:
{
  "annotations": [
    {
      "turn": <int>,
      "teacher_text": "<exact teacher utterance>",
      "overall_impact": "positive" | "negative" | "neutral" | "mixed",
      "tip": "<one concrete coaching tip for THIS specific utterance, or null if the turn was effective>",
      "student_impacts": [
        {
          "student": "<student name>",
          "impact": "<10-18 word specific description of impact>",
          "sentiment": "positive" | "negative" | "neutral"
        }
      ]
    }
  ]
}

Rules:
- student_impacts must contain exactly 5 entries — one per student (Maya, Carlos, Jake, Priya, Marcus)
- Impact descriptions must be SPECIFIC: "complex vocabulary spiked confusion" not "was confusing"
- overall_impact: "positive" = most students improved, "negative" = most worsened,
  "mixed" = significantly varied reactions, "neutral" = minimal change overall
- tip: null if the turn went well; otherwise one short, actionable sentence
- Use real delta numbers when available to ground your analysis
"""


def _group_timeline_by_turn(timeline: list[dict]) -> list[dict]:
    """Group timeline entries by teacher turn, collecting student responses that follow."""
    turns: list[dict] = []
    current: dict | None = None

    for entry in timeline:
        if entry.get("speaker") == "teacher":
            if current is not None:
                turns.append(current)
            current = {
                "turn": entry.get("turn"),
                "teacher_text": entry.get("text", ""),
                "student_responses": [],
            }
        elif current is not None:
            current["student_responses"].append({
                "student": entry.get("speaker"),
                "text": entry.get("text", ""),
                "comprehension_delta": entry.get("comprehension_delta", 0),
                "engagement_delta": entry.get("engagement_delta", 0),
            })

    if current is not None:
        turns.append(current)

    return turns


async def generate_autopsy(session: SessionState) -> list[dict]:
    """
    Generate a turn-by-turn annotated autopsy of the session.

    Returns a list of annotation dicts (one per teacher turn):
      [
        {
          "turn": int,
          "teacher_text": str,
          "overall_impact": "positive" | "negative" | "neutral" | "mixed",
          "tip": str | None,
          "student_impacts": [
            {"student": str, "impact": str, "sentiment": "positive"|"negative"|"neutral"},
            ...  # 5 entries, one per student
          ]
        },
        ...
      ]
    """
    turns = _group_timeline_by_turn(session.timeline)

    if not turns:
        return []

    # Build the user payload — full grouped transcript
    transcript_payload = {
        "subject": session.config.subject,
        "topic": session.config.topic,
        "grade_level": session.config.grade_level,
        "turns": turns,
    }

    messages = [
        {"role": "system", "content": AUTOPSY_SYSTEM_PROMPT},
        {"role": "user", "content": json.dumps(transcript_payload, indent=2)},
    ]

    # Allow enough tokens for all turns: ~300 tokens per turn
    max_tokens = max(1500, len(turns) * 350)

    try:
        result = await chat_completion_json(
            messages=messages,
            temperature=0.3,   # low temperature for consistent diagnostic output
            max_tokens=min(max_tokens, 4000),
        )
        return result.get("annotations", [])
    except Exception as e:
        print(f"[autopsy_agent] Error generating autopsy: {e}")
        return []
