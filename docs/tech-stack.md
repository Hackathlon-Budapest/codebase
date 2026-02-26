# Tech Stack

## Frontend

React + TypeScript
- Vite (fast build)
- TailwindCSS (rapid styling)
- Framer Motion (avatar animations)
- Recharts (session analytics dashboard)
- WebSocket client (real-time updates)

## Backend

Python + FastAPI
- WebSocket server (real-time bidirectional)
- Azure OpenAI SDK (GPT-4o)
- Azure Speech SDK (STT + TTS)
- Azure AI Language SDK (sentiment)
- In-memory session state (no DB needed for demo)

## Azure Services

| Service               | Usage                                     |
|-----------------------|-------------------------------------------|
| Azure OpenAI (GPT-4o) | Orchestrator + all student agents         |
| Azure Speech-to-Text  | Teacher voice input                       |
| Azure Text-to-Speech  | Student voices (unique voice per persona) |
| Azure AI Language     | Sentiment/emotion tagging on responses    |

## Decision Summary

| Decision           | Choice                                 | Reason                              |
|--------------------|----------------------------------------|-------------------------------------|
| Backend framework  | FastAPI + WebSocket                    | Speed, async, easy WebSockets       |
| Frontend           | React + Vite + Tailwind                | Fastest developer experience        |
| AI model           | GPT-4o via Azure OpenAI                | Strong reasoning, Azure quota/bonus |
| Voice input        | Azure STT                              | Required for demo "wow factor"      |
| Voice output       | Azure TTS                              | Different voices per student        |
| State management   | In-memory (no DB)                      | 30 hours, no time for database      |
| Agent architecture | Single orchestrator + 5 persona agents | Clean, debuggable, feasible         |
