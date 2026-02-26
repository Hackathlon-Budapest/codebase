"""
Feedback agent — post-session coaching analysis for the teacher.

This is a skeleton. The GPT-4o call will be wired up in Hours 14-18 once
the session flow is stable and azure_openai.py is finalised by Dev 2.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import SessionState
from agents.orchestrator import get_session_summary


FEEDBACK_SYSTEM_PROMPT = """You are an expert teacher coach analysing a TeachLab classroom simulation session.
You will receive a structured summary of a simulated lesson, including each AI student's average
engagement, comprehension, and turns spoken, as well as any key moments where engagement dropped sharply.

Your task is to produce actionable, empathetic coaching feedback for the teacher. Structure your response as:

1. **Overall Assessment** — 2-3 sentences on how the class went overall.
2. **Student-by-Student Highlights** — For each student, one sentence noting a strength or concern.
3. **Key Moments to Revisit** — For each engagement-drop event, explain what may have caused it and
   suggest a teaching strategy to address it next time.
4. **Top 3 Actionable Suggestions** — Concrete, specific things the teacher can try in the next lesson.

Tone: supportive, constructive, and specific. Avoid generic advice.
"""


async def generate_feedback(session: SessionState) -> dict:
    """
    Generate post-session coaching feedback for the teacher.

    Returns a dict with at minimum:
      {
        "summary": <structured session summary dict>,
        "feedback": <str — GPT-4o coaching text, or placeholder>,
      }
    """
    summary = get_session_summary(session)

    # TODO: wire up GPT-4o call in Hours 14-18
    # messages = [
    #     {"role": "system", "content": FEEDBACK_SYSTEM_PROMPT},
    #     {"role": "user", "content": json.dumps(summary, indent=2)},
    # ]
    # from services.azure_openai import chat_completion
    # result = await chat_completion(messages, json_mode=False)
    # feedback_text = result.get("content", "")

    feedback_text = "[Feedback generation not yet implemented — GPT-4o call pending Dev 2 completion]"

    return {
        "summary": summary,
        "feedback": feedback_text,
    }
