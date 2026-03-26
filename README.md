# PresAI - Voice-Controlled Presentation Assistant

![Voice Control](https://img.shields.io/badge/Voice_Control-Navigation-blue)
![AI Powered](https://img.shields.io/badge/AI-Powered-green)
![Real-time](https://img.shields.io/badge/Real--time-Processing-orange)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688)
![React](https://img.shields.io/badge/React-Frontend-61dafb)
![LiveKit](https://img.shields.io/badge/LiveKit-Audio-red)
![License](https://img.shields.io/badge/License-MIT-yellow)

A smart presentation tool that lets you navigate slides using voice commands. Just ask "Show me the revenue slide" and PresAI finds it for you.

## What You'll Need

- **Computer**: Mac or Windows
- **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop)
- **Ollama** (for AI embeddings): [Download here](https://ollama.ai)
- **Python 3.10+** (usually comes with your computer)
- **Node.js 18+**: [Download here](https://nodejs.org)

---

## Quick Setup (5 minutes)

### Step 1: Start Infrastructure

```bash
make infra-up
```

> This starts Qdrant (database) and LiveKit (voice server) in Docker.

### Step 2: Setup Backend

```bash
cd backend
cp .env.example .env
```

Now open `.env` in a text editor and add your API keys:

| Service | Where to Get Free Key | Key Variable |
|---------|----------------------|--------------|
| **Groq** (AI for answers) | [groq.com](https://console.groq.com/keys) | `LLM_API_KEY` |
| **Deepgram** (voice recognition) | [deepgram.com](https://console.deepgram.com) | `STT_API_KEY` and `TTS_API_KEY` |

Then run:

```bash
cd ..
make backend-api
```

### Step 3: Start Frontend

Open a **new terminal** window:

```bash
make frontend
```

### Step 4: Start Voice Worker

Open **another new terminal** window:

```bash
make worker
```

---

## How to Use

1. Open **http://localhost:5173** in your browser
2. Upload a PowerPoint file (`.pptx`)
3. Click the microphone button
4. Ask questions like:
   - "Show me slide 5"
   - "Go to the revenue slide"
   - "What's on the last slide?"

---

## Troubleshooting

### "Qdrant connection failed"
```bash
# Make sure Docker is running, then:
make infra-down
make infra-up
```

### "Ollama not responding"
```bash
# In a new terminal:
ollama serve
ollama pull nomic-embed-text
```

### "API key error"
- Double-check your keys in `.env`
- Make sure there are no extra spaces or quotes around the key

### Need help?
Run this to see all service connections:
```bash
cd backend
python test_health.py
```

---

## Configuration Options

Want to customize? Edit `.env`:

```
# AI Provider (groq is free)
LLM_PROVIDER=groq

# Voice Recognition (deepgram recommended)
STT_PROVIDER=deepgram

# Embeddings (ollama is local & free)
EMBEDDINGS_PROVIDER=local
```

---

## API Docs

- **Health Check**: http://localhost:8000/health
- **Full API Docs**: http://localhost:8000/docs

---

## License

MIT