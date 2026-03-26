# PresAI 🎤 - Voice-Controlled Presentation Assistant

PresAI is an intelligent presentation assistant that allows you to navigate through slides using **voice commands**. Built with modern web technologies, it provides real-time voice interaction for seamless presentation control with AI-powered slide recommendations.

![Features](https://img.shields.io/badge/Voice_Control-Navigation-blue)
![AI](https://img.shields.io/badge/AI-Powered-green)
![Real-time](https://img.shields.io/badge/Real--time-Processing-orange)

---

> ⚡ **New here?** Check out our [Quick Start Guide](QUICKSTART.md) to get running in 5 minutes!

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [Configuration](#-configuration-guide)
  - [Environment Variables](#environment-variables)
  - [AI Provider Options](#ai-provider-options)
- [Usage](#-usage-guide)
- [API Reference](#-api-reference)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)
- [FAQ](#-faq)

---

## ✨ Features

- 🎤 **Voice-Controlled Navigation**: Navigate slides hands-free using natural language queries
- 🔍 **Smart Slide Recommendations**: AI-powered content matching to find relevant slides
- ⚡ **Real-Time Processing**: Live transcription and instant slide navigation
- 📊 **PPT/PPTX Support**: Upload and process PowerPoint presentations
- 🌐 **Modern UI**: Clean, responsive React-based interface
- 🔊 **Professional Audio**: LiveKit integration for high-quality audio streaming
- 🧠 **Multiple AI Providers**: Support for Groq, Ollama (local), and OpenAI
- 🔒 **Privacy-First**: Run completely locally with Ollama embeddings
- 🚀 **Fast & Scalable**: Vector search with Qdrant for millisecond responses

---

## 🏗️ Architecture

### Backend Stack (FastAPI + Python)

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | FastAPI | High-performance REST API |
| **Vector Database** | Qdrant | Semantic search engine |
| **Embeddings** | Ollama/Groq/OpenAI | Content vectorization |
| **Speech-to-Text** | Faster-Whisper/Deepgram | Local/cloud transcription |
| **Live Streaming** | LiveKit | Real-time audio communication |
| **Event System** | SSE (Server-Sent Events) | Real-time updates |
| **LLM** | Groq/Ollama/OpenAI | AI reasoning & responses |

### Frontend Stack (React + Vite)

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | React 18 + TypeScript | Type-safe UI components |
| **Build Tool** | Vite | Fast development & HMR |
| **Styling** | Tailwind CSS | Modern responsive design |
| **State Management** | Zustand | Lightweight state management |
| **Audio** | LiveKit Client SDK | Real-time audio streaming |
| **Routing** | React Router | Client-side navigation |
| **Presentation** | pptx-preview | PowerPoint rendering |

---

## Project Structure

```
presai/
├── backend/                    # FastAPI backend
│   ├── config/                # Configuration modules
│   │   ├── base_config.py
│   │   ├── database.py
│   │   ├── embedding_config.py
│   │   ├── llm.py
│   │   ├── misc.py
│   │   └── voice.py
│   ├── routers/               # API route handlers
│   │   ├── events.py         # Event streaming endpoints
│   │   ├── ingestion_router.py # File ingestion endpoints
│   │   └── voice.py          # Voice query & transcription endpoints
│   ├── services/              # Business logic
│   │   ├── ingestion/
│   │   │   ├── cleaner.py
│   │   │   ├── parser.py
│   │   │   └── pipeline.py
│   │   ├── voice/
│   │   │   ├── retrieval.py
│   │   │   └── transcriber.py
│   │   └── events.py
│   ├── utils/                 # Utilities
│   │   ├── embeddings.py
│   │   ├── logger.py
│   │   ├── storage.py
│   │   └── vectorstore.py
│   ├── main.py               # Application entry point
│   ├── pyproject.toml        # Python dependencies
│   └── .env.example          # Environment variables template
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── custom/slides/   # Slide-specific components
│   │   │   ├── pages/           # Page components
│   │   │   └── ui/              # Reusable UI components
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── config.ts
│   │   │   ├── store.ts
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── .env.example
├── content/                   # Sample presentations
└── Makefile                  # Development shortcuts
```

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

| Software | Version | Download Link | Purpose |
|----------|---------|---------------|---------|
| **Python** | 3.10+ | [Download](https://www.python.org/downloads/) | Backend runtime |
| **Node.js** | 18+ | [Download](https://nodejs.org/) | Frontend runtime |
| **Docker Desktop** | Latest | [Download](https://www.docker.com/products/docker-desktop/) | Infrastructure services |
| **UV** | Latest | [Install](https://docs.astral.sh/uv/getting-started/installation/) | Python package manager |

### Verify Installations

```bash
# Check Python version (should be 3.10+)
python --version

# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check Docker is running
docker --version
docker ps

# Install UV if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh
```

> 💡 **Tip**: If you're on macOS, you can use Homebrew to install these:
> ```bash
> brew install python@3.13 node uv
> ```

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd presai
```

### 2. Start Infrastructure Services

First, start the required Docker services (Qdrant and LiveKit):

```bash
# From the project root
make infra-up

# Or manually:
cd backend
docker compose up -d
```

This starts:
- **Qdrant** vector database on port `6333`
- **LiveKit** server on port `7880`

Verify services are running:
```bash
docker ps
# You should see 'vectordb' and 'livekit' containers
```

### 3. Backend Setup

#### Step 3.1: Install Dependencies

```bash
cd backend
uv sync
```

This creates a virtual environment and installs all Python dependencies.

#### Step 3.2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Now edit `.env` with your preferred configuration. For **quick local setup**, use these minimal settings:

```env
# ===========================================
# Minimal Configuration for Local Testing
# ===========================================

# File Storage
FILE_STORAGE_PATH=content

# Vector Database
QDRANT_URL=http://localhost:6333
VECTOR_SIZE=768

# Embeddings - Using Ollama (Local & Free)
EMBEDDINGS_PROVIDER=ollama
EMBEDDINGS_BASE_URL=http://localhost:11434
EMBEDDINGS_MODEL=nomic-embed-text

# Voice Mode - Local
VOICE_MODE=local
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecretdevsecretdevsecretdevsec
LIVEKIT_ROOM_PREFIX=presai-voice

# Whisper STT (Local fallback)
FASTER_WHISPER_MODEL=small
FASTER_WHISPER_DEVICE=cpu

# LLM - Using Groq (Free tier, recommended)
LLM_PROVIDER=groq
LLM_MODEL=llama-3.1-70b-versatile

# Get your FREE Groq API key: https://console.groq.com/keys
GROQ_API_KEY=gsk_your_groq_api_key_here

# Debug mode (optional)
PRESAI_DEBUG=false
```

> ⚠️ **Important**: You need a **Groq API key** (free). Get one at: https://console.groq.com/keys
>
> Alternatively, you can use **Ollama** for completely local LLM (see [Configuration Guide](#ai-provider-options)).

#### Step 3.3: Run the Backend

```bash
# Option 1: Using uv directly (recommended)
uv run python main.py

# Option 2: Activate venv first
source .venv/bin/activate
python main.py

# Option 3: Use Makefile from project root
make backend-api
```

✅ Backend should now be running on **http://localhost:8000**

Test it:
```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

### 4. Frontend Setup

#### Step 4.1: Install Dependencies

Open a **new terminal** and run:

```bash
cd frontend
npm install
```

#### Step 4.2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

The default settings work for local development:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_API_TIMEOUT=30000
VITE_VOICE_MODE=local
```

#### Step 4.3: Run the Frontend

```bash
# Option 1: Direct npm command
npm run dev

# Option 2: Use Makefile from project root
make frontend
```

✅ Frontend should now be running on **http://localhost:5173**

### 5. Access the Application

Open your browser and navigate to: **http://localhost:5173**

You should see the PresAI landing page ready to upload presentations!

---

## 📖 Usage Guide

### 1. Upload a Presentation

1. Navigate to **http://localhost:5173**
2. Click **"Upload Presentation"** button
3. Drag & drop or select a `.ppt` or `.pptx` file
4. Wait for ingestion to complete (you'll see a success message)
5. Your presentation is now loaded and ready!

> 💡 **Tip**: Sample presentations are available in the `content/` folder for testing.

### 2. Use Voice Commands

1. Click the **microphone button** in the top-right corner
2. Allow microphone access when prompted
3. Ask a question about your presentation content:
   - *"Show me the slide about marketing strategy"*
   - *"What are the key metrics mentioned?"*
   - *"Go to the competitive analysis slide"*
4. The system will:
   - 🎙️ Transcribe your speech in real-time
   - 🔍 Search for relevant slides using AI
   - 📊 Automatically navigate to the recommended slide
   - 💬 Display transcript and AI-generated response

### 3. Manual Navigation

Prefer traditional controls? You can also:

- ⬅️ ➡️ Use **arrow keys** to navigate slides
- 🔢 Type a **slide number** to jump directly
- 👁️ Browse **slide thumbnails** in the sidebar
- 🔍 Use the **search bar** to find specific content

### 4. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `←` / `→` | Previous/Next slide |
| `M` | Toggle microphone |
| `F` | Fullscreen mode |
| `Esc` | Exit fullscreen |

---

## 🔌 API Reference

### Base URL

```
http://localhost:8000/api/v1
```

### Endpoints

#### Health Check

```http
GET /health
```

**Response:**
```json
{ "status": "healthy" }
```

---

#### Events (Server-Sent Events)

```http
GET /api/v1/events/{session_id}
Accept: text/event-stream
```

**Description:** Subscribe to real-time updates for a session.

---

#### Ingestion

**Upload Presentation:**
```http
POST /api/v1/ingest
Content-Type: multipart/form-data

{
  "file": <pptx_file>
}
```

**Response:**
```json
{
  "message": "Presentation ingested successfully",
  "filename": "presentation.pptx",
  "slides_processed": 25
}
```

**Download File:**
```http
GET /api/v1/file/{filename}
```

---

#### Voice

**Submit Voice Query:**
```http
POST /api/v1/voice/query
Content-Type: application/json

{
  "query": "Show me the revenue projections slide",
  "session_id": "abc123"
}
```

**Response:**
```json
{
  "transcript": "Show me the revenue projections slide",
  "recommended_slide": {
    "slide_number": 15,
    "slide_title": "Revenue Projections 2024-2026",
    "confidence_score": 0.94
  },
  "ai_response": "Slide 15 contains the revenue projections..."
}
```

**Get LiveKit Token:**
```http
POST /api/v1/voice/livekit/token
```

**Transcribe Audio (Local Mode):**
```http
POST /api/v1/voice/transcribe
Content-Type: multipart/form-data

{
  "audio": <audio_file>
}
```

---

### API Testing with cURL

```bash
# Health check
curl http://localhost:8000/health

# Upload presentation
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "file=@presentation.pptx"

# Voice query
curl -X POST http://localhost:8000/api/v1/voice/query \
  -H "Content-Type: application/json" \
  -d '{"query": "marketing strategy", "session_id": "test123"}'
```

### Swagger Documentation

Interactive API docs available at: **http://localhost:8000/docs**

---

## 🛠️ Development

### Running Both Services Simultaneously

Use the Makefile to run everything at once:

```bash
# From project root
make dev-all
```

This starts:
- Backend API (port 8000)
- Voice worker
- Frontend (port 5173)

### Individual Services

```bash
# Backend only
make backend-api

# Worker only
make worker

# Frontend only
make frontend
```

### Docker Management

```bash
# View running containers
docker ps

# View logs for all services
make infra-logs

# View specific service logs
cd backend && docker compose logs -f livekit
cd backend && docker compose logs -f vectordb

# Restart a service
make infra-down
make infra-up

# Complete reset
make infra-down
cd backend && docker compose down -v  # Removes volumes
make infra-up
```

### Code Formatting

#### Backend

```bash
cd backend

# Format code
black .
isort .

# Type checking
mypy .
```

#### Frontend

```bash
cd frontend

# Lint
npm run lint

# Format (if configured)
npm run format
```

### Building for Production

#### Backend

```bash
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend

# Build production bundle
npm run build

# Preview production build
npm run preview
```

The built files will be in `frontend/dist/`

---
```

## 📖 Configuration Guide

### Environment Variables

#### Backend (.env)

##### Core Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `FILE_STORAGE_PATH` | Path to store uploaded files | `content` | ✅ |
| `QDRANT_URL` | Qdrant vector DB URL | `http://localhost:6333` | ✅ |
| `VECTOR_SIZE` | Embedding dimension | `768` | ✅ |
| `PRESAI_DEBUG` | Enable debug logging | `false` | ❌ |

##### Embeddings Provider (Choose ONE)

**Option 1: Ollama (Local - Recommended for Dev)**
```env
EMBEDDINGS_PROVIDER=ollama
EMBEDDINGS_BASE_URL=http://localhost:11434
EMBEDDINGS_MODEL=nomic-embed-text
```
> Install Ollama: https://ollama.ai
> Pull model: `ollama pull nomic-embed-text`

**Option 2: Groq (Cloud - Fast & Free)**
```env
EMBEDDINGS_PROVIDER=groq
EMBEDDINGS_API_KEY=your_groq_api_key
EMBEDDINGS_MODEL=text-embedding-004
```
> Get free API key: https://console.groq.com/keys

**Option 3: OpenAI (Cloud - Paid)**
```env
EMBEDDINGS_PROVIDER=openai
EMBEDDINGS_API_KEY=your_openai_key
EMBEDDINGS_MODEL=text-embedding-3-small
```

##### Voice Configuration

```env
# Mode: local | agentkit_live
VOICE_MODE=local

# LiveKit Local Server
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecretdevsecretdevsecretdevsec
LIVEKIT_ROOM_PREFIX=presai-voice
LIVEKIT_TOKEN_TTL_SECONDS=3600

# Deepgram API (for voice services)
DEEPGRAM_API_KEY=your_deepgram_api_key

# Groq for LLM
GROQ_API_KEY=your_groq_api_key
```

Get Deepgram key: https://console.deepgram.com/

##### Speech-to-Text (Local Whisper)

```env
FASTER_WHISPER_MODEL=small
FASTER_WHISPER_DEVICE=cpu
FASTER_WHISPER_COMPUTE_TYPE=int8
FASTER_WHISPER_LANGUAGE=en
```

Model options: `tiny` → `base` → `small` → `medium` → `large-v2`  
(Trade speed for accuracy)

##### LLM Provider (Choose ONE)

**Option 1: Groq (Recommended)**
```env
LLM_PROVIDER=groq
LLM_MODEL=llama-3.1-70b-versatile
```

**Option 2: Ollama (Local)**
```env
LLM_PROVIDER=ollama
LLM_MODEL=llama3.1
LLM_BASE_URL=http://localhost:11434
```

**Option 3: OpenAI**
```env
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=your_openai_api_key
```

##### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_API_TIMEOUT=30000
VITE_VOICE_MODE=local
```

---

### AI Provider Options

#### Completely Local Setup (Privacy-First)

For maximum privacy with no cloud dependencies:

```env
# Embeddings - Ollama
EMBEDDINGS_PROVIDER=ollama
EMBEDDINGS_MODEL=nomic-embed-text

# LLM - Ollama
LLM_PROVIDER=ollama
LLM_MODEL=llama3.1

# Voice - Local Whisper
VOICE_MODE=local
FASTER_WHISPER_MODEL=small
```

**Requirements:**
1. Install Ollama: https://ollama.ai
2. Pull models:
   ```bash
   ollama pull nomic-embed-text
   ollama pull llama3.1
   ```

#### Hybrid Setup (Recommended)

Best balance of performance and cost:

```env
# Embeddings - Groq (Free, fast)
EMBEDDINGS_PROVIDER=groq
EMBEDDINGS_MODEL=text-embedding-004

# LLM - Groq (Free tier)
LLM_PROVIDER=groq
LLM_MODEL=llama-3.1-70b-versatile

# Voice - Local
VOICE_MODE=local
```

**Get FREE Groq API Key:** https://console.groq.com/keys

#### Production Setup

For production deployment:

```env
# Cloud Voice Mode
VOICE_MODE=agentkit_live
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret_min_32_chars

# Embeddings - OpenAI
EMBEDDINGS_PROVIDER=openai
EMBEDDINGS_MODEL=text-embedding-3-large

# LLM - OpenAI
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
```

---

#### Local Mode (`VOICE_MODE=local`)
- Uses local LiveKit server
- Faster-Whisper for transcription
- No cloud costs
- Recommended for development

#### AgentKit Live Mode (`VOICE_MODE=agentkit_live`)
- Uses LiveKit cloud service
- Production-ready
- Requires cloud credentials
- Better scalability

### Embedding Models

Supported OpenAI embedding models:
- `text-embedding-ada-002` (default)
- `text-embedding-3-small`
- `text-embedding-3-large`

### Whisper Models

Available Faster-Whisper models:
- `tiny` (fastest, less accurate)
- `base`
- `small`
- `medium`
- `large-v2` (slowest, most accurate)

## ❓ Troubleshooting

### Backend Issues

#### Port Already in Use (8000)

**Error:** `Address already in use` or `OSError: [Errno 48]`

**Solution:**
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or change port in main.py
uvicorn main:app --port 8001
```

#### Qdrant Connection Failed

**Error:** `Connection refused` or `Qdrant connection failed`

**Solution:**
```bash
# Check if Qdrant is running
docker ps | grep vectordb

# View Qdrant logs
cd backend && docker compose logs vectordb

# Restart Qdrant
make infra-down
make infra-up

# Verify Qdrant is accessible
curl http://localhost:6333
```

Expected response: JSON with Qdrant version info

#### LiveKit Connection Issues

**Error:** `LiveKit connection failed` or `WebSocket connection error`

**Solution:**
1. Check LiveKit is running:
   ```bash
   docker ps | grep livekit
   ```

2. Verify ports are open:
   ```bash
   lsof -i:7880
   ```

3. Check firewall settings (macOS):
   - System Preferences → Security & Privacy → Firewall
   - Allow Docker and localhost connections

4. Verify LIVEKIT_URL matches your setup:
   ```env
   # For local Docker
   LIVEKIT_URL=ws://localhost:7880
   
   # For LiveKit Cloud
   LIVEKIT_URL=wss://your-project.livekit.cloud
   ```

#### Ollama Not Responding

**Error:** `Ollama connection refused` or `Embedding generation failed`

**Solution:**
```bash
# Check if Ollama is running
ollama list

# Start Ollama service
ollama serve

# Pull required model
ollama pull nomic-embed-text

# Test Ollama
curl http://localhost:11434/api/generate -d '{
  "model": "nomic-embed-text",
  "prompt": "test"
}'
```

#### Groq API Errors

**Error:** `Invalid API key` or `Rate limit exceeded`

**Solution:**
1. Verify API key is correct: https://console.groq.com/keys
2. Check you haven't exceeded free tier limits
3. Ensure GROQ_API_KEY is set in `.env`
4. Test API key:
   ```bash
   curl https://api.groq.com/openai/v1/models \
     -H "Authorization: Bearer YOUR_GROQ_API_KEY"
   ```

---

### Frontend Issues

#### API Connection Failed

**Error:** `Network Error` or `CORS error` in browser console

**Solution:**
1. Ensure backend is running on port 8000:
   ```bash
   curl http://localhost:8000/health
   ```

2. Check frontend `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

3. Verify CORS settings in backend `.env`:
   ```env
   CORS_ORIGINS=http://localhost:5173
   ```

4. Clear browser cache and reload

#### Microphone Not Working

**Error:** `Microphone access denied` or no audio input detected

**Solution:**
1. **Grant permissions:**
   - Browser will prompt for microphone access
   - Click "Allow"

2. **Check browser settings:**
   - Chrome: `chrome://settings/content/microphone`
   - Safari: Preferences → Privacy → Microphone
   - Firefox: `about:preferences#privacy` → Permissions

3. **Try a different browser:**
   - Chrome/Edge recommended (best WebRTC support)
   - Safari may have stricter permissions

4. **Check system microphone:**
   ```bash
   # macOS
   system_profiler SPAudioDataType
   
   # Verify input device in System Preferences → Sound
   ```

5. **HTTPS requirement:**
   - Some browsers require HTTPS for microphone
   - Use `localhost` (works without HTTPS)
   - For remote access, set up HTTPS

#### LiveKit Connection Failed

**Error:** `Cannot connect to LiveKit room`

**Solution:**
1. Verify backend VOICE_MODE matches frontend VITE_VOICE_MODE
2. Check LiveKit server is running:
   ```bash
   docker ps | grep livekit
   ```
3. View LiveKit logs:
   ```bash
   cd backend && docker compose logs livekit
   ```
4. Try clearing browser data and refreshing

---

### Common Errors

#### "No matching slide content found"

**Cause:** Voice query didn't match any slides

**Solution:**
- Ensure you've uploaded a presentation first
- Try broader questions
- Check ingestion completed (check backend logs)
- Verify embeddings are working (check Ollama/Groq)

#### "Voice transcription failed"

**Cause:** Whisper model issue or audio format problem

**Solution:**
```bash
# Verify faster-whisper is installed
cd backend
uv pip list | grep faster-whisper

# Try a smaller model for testing
FASTER_WHISPER_MODEL=tiny

# Check audio format
# Should be PCM 16-bit, 16kHz sample rate
```

#### "ModuleNotFoundError" (Python)

**Cause:** Missing dependencies or wrong virtual environment

**Solution:**
```bash
cd backend

# Reinstall dependencies
uv sync

# Or recreate venv
rm -rf .venv
uv sync
```

#### "npm ERR! peer dependency" (Node.js)

**Cause:** Dependency conflicts

**Solution:**
```bash
cd frontend

# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

### Performance Issues

#### Slow Slide Recommendations

**Solution:**
1. Use a smaller embedding model
2. Reduce BATCH_SIZE in `.env`:
   ```env
   BATCH_SIZE=16
   ```
3. Use Groq instead of local Ollama (faster)
4. Check Qdrant performance:
   ```bash
   curl http://localhost:6333/collections/presai_slides
   ```

#### High Memory Usage

**Solution:**
1. Close unused applications
2. Use smaller Whisper model:
   ```env
   FASTER_WHISPER_MODEL=tiny
   ```
3. Reduce concurrent operations
4. Check for memory leaks in logs

---

## ❓ FAQ

### General Questions

**Q: Is this completely free to run?**  
A: Yes! With Ollama (local embeddings + LLM), it's 100% free. With Groq (recommended), you get a generous free tier that's sufficient for personal use.

**Q: Does it work offline?**  
A: Partially. With Ollama for embeddings/LLM and local Whisper, you can run offline except for initial setup and model downloads.

**Q: What presentation formats are supported?**  
A: `.ppt` and `.pptx` (PowerPoint) files. Other formats like PDF are not yet supported.

**Q: How large can presentations be?**  
A: There's no hard limit, but larger presentations (>100 slides) may take longer to process. We recommend splitting very large decks.

**Q: Can I use this in production?**  
A: Yes! Switch to `VOICE_MODE=agentkit_live` and use cloud providers (LiveKit Cloud, OpenAI, etc.) for production scalability.

### Technical Questions

**Q: Why is my first query slow?**  
A: The first request may trigger model loading. Subsequent queries are much faster. You can also preload models in Ollama.

**Q: Can I customize the AI prompts?**  
A: Yes! Check `backend/services/voice/retrieval.py` to modify the LLM prompts and retrieval logic.

**Q: How do I add support for other languages?**  
A: Change `FASTER_WHISPER_LANGUAGE` in `.env`. Whisper supports 100+ languages.

**Q: Can I host this on my own server?**  
A: Absolutely! Deploy the backend to any cloud provider (AWS, GCP, DigitalOcean) and update the frontend `VITE_API_BASE_URL`.

**Q: Where is my data stored?**  
A: Uploaded files go to `content/` folder. Vector embeddings are stored in Qdrant's volume. No data leaves your machine unless you use cloud APIs.

### Development Questions

**Q: How do I contribute?**  
A: See the [Contributing](#contributing) section below. Fork, create a feature branch, and submit a PR!

**Q: Are there tests?**  
A: Tests are coming soon. Check the repository for updates.

**Q: Can I use a different vector database?**  
A: Currently only Qdrant is supported, but the architecture makes it easy to add others (Pinecone, Weaviate, etc.).

**Q: How do I debug issues?**  
A: Set `PRESAI_DEBUG=true` in backend `.env` for verbose logging. Check Docker logs with `make infra-logs`.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

### 1. Fork the Repository

```bash
# Click "Fork" on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/presai.git
cd presai
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/amazing-feature
```

### 3. Make Your Changes

- Follow existing code style
- Add comments for complex logic
- Test thoroughly locally

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add amazing feature"
```

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### 5. Push and Open a Pull Request

```bash
git push origin feature/amazing-feature
```

Then open a Pull Request on GitHub with:
- Clear description of what you changed
- Screenshots if UI changes
- Testing steps you performed

### 6. Code Review

Maintainers will review your PR and may request changes before merging.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Special thanks to the amazing open-source projects that make PresAI possible:

### Core Technologies
- **[FastAPI](https://fastapi.tiangolo.com/)** - Modern Python web framework
- **[LiveKit](https://livekit.io/)** - Real-time audio/video platform
- **[Qdrant](https://qdrant.tech/)** - Vector similarity search engine
- **[Faster-Whisper](https://github.com/guillaumekln/faster-whisper)** - Fast Whisper inference
- **[React](https://react.dev/)** - UI library
- **[Vite](https://vitejs.dev/)** - Next generation frontend tooling

### AI/ML Providers
- **[Groq](https://groq.com/)** - Lightning-fast AI inference
- **[Ollama](https://ollama.ai/)** - Local LLM runtime
- **[Deepgram](https://deepgram.com/)** - Speech recognition API
- **[OpenAI](https://openai.com/)** - AI models and embeddings

### Libraries & Tools
- **[LangChain](https://python.langchain.com/)** - LLM orchestration framework
- **[python-pptx](https://github.com/scanny/python-pptx)** - PowerPoint parsing
- **[Zustand](https://zustand-demo.pmnd.rs/)** - State management
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS
- **[Shadcn/ui](https://ui.shadcn.com/)** - UI components

---

## 📞 Support

Need help? Here's how to get support:

### Resources

1. **Documentation**: You're reading it! Check other sections first.
2. **GitHub Issues**: [Create an issue](https://github.com/YOUR_REPO/presai/issues) for bugs or feature requests
3. **Discussions**: Join our [community discussions](https://github.com/YOUR_REPO/presai/discussions)
4. **Email**: Contact us at [your-email@example.com](mailto:your-email@example.com)

### Before Creating an Issue

Please:
- ✅ Search existing issues (your problem may already be solved)
- ✅ Check the [Troubleshooting](#troubleshooting) section
- ✅ Gather relevant information:
  - Error messages
  - Backend logs (`make infra-logs`)
  - Browser console errors
  - Your configuration (`.env` with secrets removed)
  - Steps to reproduce

### Community Guidelines

- Be respectful and constructive
- Help others when you can
- Share your solutions and workarounds
- Star the repo if you find it useful! ⭐

---

## 🚀 What's Next?

Ready to try PresAI?

1. **Set it up**: Follow the [Quick Start](#-quick-start) guide
2. **Upload a presentation**: Test with a sample deck
3. **Try voice commands**: Click the mic and ask away!
4. **Customize it**: Tweak settings for your use case
5. **Share it**: Show your colleagues and give feedback

### Roadmap

Coming soon:
- 📝 Multi-language support
- 🎨 Custom themes
- 📊 Analytics dashboard
- 🔗 Integration with Google Slides
- 🤖 Advanced AI agents
- 📱 Mobile app

---

## 📚 Documentation Index

### Main Documentation

- **[⚡ Quick Start Guide](QUICKSTART.md)** - Get running in 5 minutes
- **[Main README](README.md)** - Complete setup and usage guide (you are here)
- **[Backend Docs](backend/README.md)** - Backend-specific documentation
- **[Frontend Docs](frontend/README.md)** - Frontend-specific documentation

### Quick Reference

- **Architecture**: [Backend Stack](#backend-stack-fastapi--python) | [Frontend Stack](#frontend-stack-react--vite)
- **Setup**: [Prerequisites](#prerequisites) | [Installation](#installation) | [Configuration](#configuration-guide)
- **Usage**: [Upload Presentation](#1-upload-a-presentation) | [Voice Commands](#2-use-voice-commands)
- **API**: [Endpoints](#endpoints) | [Swagger UI](http://localhost:8000/docs)
- **Dev**: [Development](#development) | [Troubleshooting](#troubleshooting) | [FAQ](#faq)

### External Resources

- [Groq Console](https://console.groq.com/keys) - Get free API key
- [Ollama](https://ollama.ai/) - Local LLM runtime
- [LiveKit](https://livekit.io/) - Real-time audio platform
- [Qdrant](https://qdrant.tech/) - Vector database
- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework
- [React](https://react.dev/) - UI framework

---

**Built with ❤️ using FastAPI and React**

Made possible by the open-source community. Contributions welcome!

---
