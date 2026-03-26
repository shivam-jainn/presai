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
# 1. Start infrastructure (Qdrant + LiveKit)
make infra-up

# 2. Backend setup & run (with automatic health checks)
cd backend
cp .env.example .env
# Add GROQ_API_KEY (get free key at https://console.groq.com/keys)
cd ..
make backend-api

# The startup script will automatically:
# - Load your .env configuration
# - Check all service connections
# - Show you a detailed health report
# - Start the server if everything is healthy

# 3. Frontend (new terminal)
make frontend

#4. Start the worker
make worker
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

### Health Check System

PresAI has a built-in health check system that runs automatically on startup:

```bash
# Start backend with health checks
make backend-api

# Or run directly
cd backend
python startup.py
```

**What it checks:**
- ✅ Qdrant vector database connection
- ✅ Ollama (if using local embeddings)
- ✅ Groq API (if configured)
- ✅ Deepgram API (if configured)
- ✅ LiveKit server connectivity
- ✅ File storage path accessibility

**Web endpoints:**
- **Basic**: http://localhost:8000/health
- **Detailed**: http://localhost:8000/health/detailed

**Test script:**
```bash
cd backend
uv run python test_health.py
```

### Common Issues

#### Qdrant Connection Failed
```bash
# Check if Qdrant is running
docker ps | grep vectordb

# Restart if needed
make infra-down && make infra-up
```

#### Ollama Not Responding
```bash
# Start Ollama
ollama serve

# Pull required model
ollama pull nomic-embed-text

# Test connection
curl http://localhost:11434/api/tags
```

#### Groq/Deepgram API Errors
- Verify API keys in `.env` are correct
- Check you haven't exceeded free tier limits
- Test keys with the `/health/detailed` endpoint

## Links

- [Quick Start Guide](QUICKSTART.md)
- [Groq API Key](https://console.groq.com/keys)
- [Ollama](https://ollama.ai/)