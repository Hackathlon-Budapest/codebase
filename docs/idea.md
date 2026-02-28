# TeachLab — The AI Teaching Flight Simulator

## Overview

**Problem:** New teachers fail in their first year because they've never faced a real, chaotic classroom. Teacher training programs have no safe space to practice — student teachers get one shot at real kids and sink or swim.

**Target users:** Student teachers, teaching certification programs, school districts onboarding new educators.

## Core Concept

You are the teacher. The AI plays the class — 5 student avatars with distinct personas (the overachiever, the ESL student, the anxious kid, the distracted student, the skeptical critical thinker). You teach a lesson, and they react realistically and dynamically based on your teaching style, the grade level you selected, and the subject matter.

After the session, you get a full debrief: engagement timeline per student, performance overview scores, AI coaching feedback, student summaries, and a teaching autopsy highlighting what worked and what didn't. It's literally a flight simulator for teachers.

## What Makes It Innovative

- No AI teaching tool today simulates a *classroom* — just individual tutoring bots
- 5 simultaneous personas with dynamic emotional state tracking (7 states each)
- Grade-level adaptation — a Grade 4 class sounds completely different from Grade 12
- Real-time audio: teacher speaks via mic, students react with their own distinct voices
- Chaos Injection — press a button mid-session to trigger a classroom disruption event (Jake's phone goes off, Marcus walks out, Priya looks overwhelmed) and watch the class react authentically
- Whisper Coach provides live teaching tips during the session
- Classroom Temperature gauge gives an at-a-glance read of class energy
- Post-session analytics that feel like actual coaching feedback including a Teaching Autopsy

## Demo Moment

A judge watches you speak to a mic and suddenly five AI students react — one looks confused, one interrupts with a question, one is disengaged and needs prompting. You press the red "Inject Chaos" button and Jake's phone goes off mid-lesson — the class erupts. At the end, a full dashboard shows your teaching performance with charts, scores, and GPT coaching feedback. This is cinematic. It's immediately understandable and emotionally resonant.

## Key Technical Components

- Multi-agent orchestrator (Azure OpenAI, GPT-4o)
- 5 persona agents with emotional state tracking and grade-level adaptation
- Chaos injection system with 8 pre-built classroom disruption events
- Azure Speech-to-Text (teacher voice input)
- Azure Text-to-Speech (student voices — different per avatar)
- Real-time classroom UI (React) showing student avatars, engagement bars, emotion states, speech bubbles
- Whisper Coach and Classroom Temperature gauge (live teaching aids)
- Post-session feedback dashboard with engagement timeline, performance overview, student summaries, AI coaching text, and teaching autopsy
