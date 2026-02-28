# Tech Stack

## Frontend

React + TypeScript
- Vite (fast build)
- TailwindCSS + @tailwindcss/typography (styling + markdown rendering)
- Framer Motion (avatar animations, speech bubbles, chaos toast)
- Recharts (engagement timeline chart)
- react-markdown (GPT coaching feedback rendering)
- Zustand (global session state management)
- WebSocket client (real-time updates)

## Backend

Python + FastAPI
- WebSocket server (real-time bidirectional communication)
- Azure OpenAI SDK (GPT-4o for all agents)
- Azure Speech SDK (STT + TTS)
- In-memory session state (no DB needed for demo)
- asyncio for parallel student response generation and pipelined TTS

## Azure Services

| Service               | Usage                                          |
|-----------------------|------------------------------------------------|
| Azure OpenAI (GPT-4o) | Orchestrator, all 5 student agents, feedback agent, autopsy agent |
| Azure Speech-to-Text  | Teacher voice input via mic                    |
| Azure Text-to-Speech  | Student voices — unique voice per persona      |

## Key Design Decisions

| Decision              | Choice                                   | Reason                                        |
|-----------------------|------------------------------------------|-----------------------------------------------|
| Backend framework     | FastAPI + WebSocket                      | Speed, async, clean WebSocket support         |
| Frontend              | React + Vite + Tailwind                  | Fastest developer experience                  |
| AI model              | GPT-4o via Azure OpenAI                  | Strong reasoning, Azure quota for hackathon   |
| Voice input           | Azure STT                                | Demo "wow factor" — teacher speaks naturally  |
| Voice output          | Azure TTS                                | Different voices per student persona          |
| State management      | In-memory (no DB)                        | 30 hours — no time for database setup         |
| Agent architecture    | Single orchestrator + 5 persona agents   | Clean, debuggable, feasible in sprint         |
| Grade adaptation      | Prompt injection per request             | No extra model needed — GPT-4o handles it     |
| Chaos system          | HTTP endpoint + orchestrator reuse       | Minimal new code, maximum authenticity        |
| TTS pipeline          | Pipelined (LLM N+1 runs during TTS N)   | Reduces perceived latency significantly       |
| Feedback rendering    | react-markdown + Tailwind typography     | Structured GPT output looks professional      |
