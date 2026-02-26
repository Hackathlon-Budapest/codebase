# TeachLab

AI-powered teaching flight simulator — practice classroom instruction with 5 distinct AI student personas, get real-time reactions, and receive post-session performance feedback.

## Collaborators

| Name             | GitHub                                             |
|------------------|----------------------------------------------------|
| [Gergő Feiler]   | [@Gergo019](https://github.com/Gergo019)           |
| [Zsombor Köbli]  | [@kzsombor02](https://github.com/kzsombor02)       |
| [Mihály Kocsis]  | [@kocsismhly](https://github.com/kocsismhly)       |
| [Olivér Reményi] | [@Oliverremenyi](https://github.com/Oliverremenyi) |

## Project Structure

```
teachlab/
├── backend/    # FastAPI backend, orchestrator, student agents, Azure services
├── frontend/   # React + TypeScript classroom UI and dashboard
└── docs/       # Architecture, personas, roadmap, and tech stack docs
```

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```
