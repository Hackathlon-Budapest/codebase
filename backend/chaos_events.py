"""
Chaos injection events for TeachLab.
Each event is a classroom disruption that gets injected as context
into the orchestrator, forcing students to react authentically.
"""

import random

CHAOS_EVENTS = [
    {
        "id": "jake_drawing",
        "description": "Jake just started drawing instead of listening.",
        "teacher_prompt": "[CLASSROOM EVENT] Jake has stopped paying attention and is now doodling in his notebook. The class notices. React naturally to this disruption — some students may comment, whisper, or get distracted themselves.",
        "label": "Jake starts drawing",
    },
    {
        "id": "marcus_interrupts",
        "description": "Marcus interrupts mid-sentence: 'But why does that even matter?'",
        "teacher_prompt": "[CLASSROOM EVENT] Marcus suddenly interrupts with 'But why does that even matter?' challenging the relevance of the lesson. The class reacts. Students may agree, disagree, or get uncomfortable.",
        "label": "Marcus challenges the lesson",
    },
    {
        "id": "carlos_raises_hand",
        "description": "Carlos quietly raises his hand but looks too nervous to speak.",
        "teacher_prompt": "[CLASSROOM EVENT] Carlos has quietly raised his hand but looks nervous and unsure. He wants to say something but is hesitating. Other students notice. React to this moment — encourage him or wait.",
        "label": "Carlos raises hand nervously",
    },
    {
        "id": "priya_crying",
        "description": "Priya looks like she's about to cry — she seems overwhelmed.",
        "teacher_prompt": "[CLASSROOM EVENT] Priya looks visibly overwhelmed and on the verge of tears. The class goes quiet. Students react with concern, awkwardness, or try to help. This is an emotional moment.",
        "label": "Priya looks overwhelmed",
    },
    {
        "id": "maya_wrong",
        "description": "Maya confidently gives a completely wrong answer.",
        "teacher_prompt": "[CLASSROOM EVENT] Maya just confidently answered a question but got it completely wrong. The class is surprised — Maya is usually right. Students react: some are shocked, some try not to laugh, Marcus may challenge her.",
        "label": "Maya gets an answer wrong",
    },
    {
        "id": "jake_phone",
        "description": "Jake's phone goes off loudly in class.",
        "teacher_prompt": "[CLASSROOM EVENT] Jake's phone just blasted music in the middle of class. Everyone turns to look. Jake is embarrassed. The class erupts briefly. Students react authentically.",
        "label": "Jake's phone goes off",
    },
    {
        "id": "marcus_walks_out",
        "description": "Marcus gets up and starts walking toward the door.",
        "teacher_prompt": "[CLASSROOM EVENT] Marcus has stood up and is slowly walking toward the door, seemingly done with the class. The room goes tense. Students react — some are shocked, some whisper, Priya looks anxious.",
        "label": "Marcus walks out",
    },
    {
        "id": "fire_drill",
        "description": "A fire drill alarm goes off.",
        "teacher_prompt": "[CLASSROOM EVENT] The fire alarm just went off. Everyone needs to stop. Students react with excitement, confusion, or relief. Jake is thrilled. Maya is annoyed the lesson is interrupted.",
        "label": "Fire drill alarm",
    },
]


def get_random_chaos_event() -> dict:
    """Return a random chaos event."""
    return random.choice(CHAOS_EVENTS)


def get_chaos_event_by_id(event_id: str) -> dict | None:
    """Return a specific chaos event by ID."""
    return next((e for e in CHAOS_EVENTS if e["id"] == event_id), None)
