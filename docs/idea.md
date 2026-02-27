# TeachLab — The AI Teaching Flight Simulator

## Overview

**Problem:** New teachers fail in their first year because they've never faced a real, chaotic classroom. Teacher training programs have no safe space to practice — student teachers get one shot at real kids and sink or swim.

**Target users:** Student teachers, teaching certification programs, school districts onboarding new educators.

## Core Concept

You are the teacher. The AI plays the class — 5 student avatars with distinct personas (the overachiever, the ESL student, the anxious kid, the class clown, the checked-out student). You teach a lesson, and they react realistically and dynamically based on your teaching style.

After the session, you get a debrief: engagement heatmap by student, moments where you lost them, what worked, what didn't. It's literally a flight simulator for teachers.

## What Makes It Innovative

- No AI teaching tool today simulates a *classroom* — just individual tutoring bots
- 5 simultaneous personas with dynamic emotional state tracking
- Real-time audio: you speak, avatars react with their own voices
- Post-session analytics that feel like actual coaching feedback
- Immediately emotionally resonant — juries and audiences "get it" in 10 seconds

## Feasibility

Decisions to make this project achievable in short time:

- 5 student personas = 5 system prompts with personality + comprehension + emotional state
- One orchestrator agent decides who responds and when
- Azure OpenAI handles all agents (GPT-4o)
- Azure Speech-to-Text: teacher speaks, avatars react (huge demo value)
- Text-to-Speech: students "speak back" with different voices
- Post-session analytics = simple scoring pipeline on conversation logs
- No database needed for demo — in-memory session state

## Demo Moment

A judge watches you speak to a mic and suddenly five AI students react — one looks confused, one interrupts with a question, one is disengaged and needs prompting. At the end, a dashboard shows your teaching performance. This is cinematic. It's immediately understandable and emotionally resonant.

## Key Technical Components

- Multi-agent orchestrator (Azure OpenAI, GPT-4o)
- 5 persona agents with emotional state tracking
- Azure Speech-to-Text (teacher input)
- Azure TTS (student voices — different per avatar)
- Real-time classroom UI (React, showing student avatars + engagement signals)
- Post-session feedback dashboard
