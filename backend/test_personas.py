"""
5-Persona Test: All students respond to a teacher input about photosynthesis.
Run from the backend directory with the venv activated.
"""

import asyncio
import sys
import os

# Ensure the backend directory is on the path
sys.path.insert(0, os.path.dirname(__file__))

from personas.personas import get_all_personas, get_initial_student_state
from agents.student_agent import generate_response, StudentState


TEACHER_INPUT = (
    "Okay class, today we're going to talk about photosynthesis. "
    "Plants use sunlight, water, and carbon dioxide to produce glucose and oxygen. "
    "The equation is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2. "
    "Think of the plant as a little factory — the leaves are the solar panels!"
)

HISTORY: list[dict] = []  # Fresh start, no prior conversation


def print_separator(char="─", width=60):
    print(char * width)


async def run_test():
    personas = get_all_personas()

    print()
    print_separator("═")
    print("  5-PERSONA TEST — Teacher input about Photosynthesis")
    print_separator("═")
    print(f"\nTEACHER: {TEACHER_INPUT}\n")
    print_separator()

    all_passed = True

    for persona in personas:
        state_dict = get_initial_student_state(persona.name)
        student_state = StudentState(
            name=state_dict["name"],
            comprehension=state_dict["comprehension"],
            engagement=state_dict["engagement"],
            emotional_state=state_dict["emotional_state"],
            response_history=[],
        )

        print(f"\n[{persona.display_name.upper()} — {persona.archetype}]")
        print(f"  Initial comprehension: {student_state.comprehension}/100  "
              f"| Engagement: {student_state.engagement}/100  "
              f"| Emotion: {student_state.emotional_state}")

        try:
            response = await generate_response(student_state, TEACHER_INPUT, HISTORY)

            new_comp = max(0, min(100, student_state.comprehension + response.comprehension_delta))
            new_eng = max(0, min(100, student_state.engagement + response.engagement_delta))

            text = response.text.strip() if response.text else "(stays silent)"
            print(f"  Response: \"{text}\"")
            print(f"  → Emotion: {response.emotional_state}  "
                  f"| Comprehension: {student_state.comprehension} → {new_comp} "
                  f"({'+' if response.comprehension_delta >= 0 else ''}{response.comprehension_delta})  "
                  f"| Engagement: {student_state.engagement} → {new_eng} "
                  f"({'+' if response.engagement_delta >= 0 else ''}{response.engagement_delta})")
            print_separator()

        except Exception as e:
            print(f"  ERROR: {e}")
            all_passed = False
            print_separator()

    print()
    if all_passed:
        print("✓ All 5 personas responded successfully.")
    else:
        print("✗ One or more personas failed — see errors above.")
    print()


if __name__ == "__main__":
    asyncio.run(run_test())
