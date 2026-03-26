# PresAI - Voice-Controlled Presentation Assistant

![Voice Control](https://img.shields.io/badge/Voice_Control-Navigation-blue)
![AI Powered](https://img.shields.io/badge/AI-Powered-green)
![Real-time](https://img.shields.io/badge/Real--time-Processing-orange)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688)
![React](https://img.shields.io/badge/React-Frontend-61dafb)
![LiveKit](https://img.shields.io/badge/LiveKit-Audio-red)
![License](https://img.shields.io/badge/License-MIT-yellow)

Navigate slides using voice commands. Built with FastAPI + React + LiveKit.

## Quick Start

```bash
# 1. Start infrastructure
make infra-up

# 2. Backend
cd backend
cp .env.example .env
# Add GROQ_API_KEY (get free key at https://console.groq.com/keys)
uv run python main.py

# 3. Frontend (new terminal)
cd frontend
npm install && npm run dev
```

Open **http://localhost:5173**

## Requirements

- Python 3.10+ (with UV)
- Node.js 18+
- Docker Desktop

## Usage

1. Upload a `.pptx` file
2. Click the microphone
3. Ask questions like "Show me the revenue slide"

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Free AI API key | Required |
| `VOICE_MODE` | `local` or `agentkit_live` | `local` |
| `EMBEDDINGS_PROVIDER` | `ollama`, `groq`, `openai` | `ollama` |
| `LLM_PROVIDER` | `groq`, `ollama`, `openai` | `groq` |

## API

- Health: `GET http://localhost:8000/health`
- Upload: `POST /api/v1/ingest`
- Voice: `POST /api/v1/voice/query`
- Docs: `http://localhost:8000/docs`

## Troubleshooting

```bash
# Ports in use
lsof -ti:8000 | xargs kill -9

# Restart infra
make infra-down && make infra-up
```

## Links

- [Quick Start Guide](QUICKSTART.md)
- [Groq API Key](https://console.groq.com/keys)
- [Ollama](https://ollama.ai/)