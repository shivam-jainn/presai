# PresAI Backend 🚀

FastAPI-based backend for PresAI - Voice-controlled presentation assistant.

## Quick Setup

### 1. Install Dependencies

```bash
uv sync
```

### 2. Start Infrastructure

```bash
docker compose up -d
```

This starts:
- **Qdrant** (port 6333) - Vector database
- **LiveKit** (port 7880) - Real-time audio server

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings. Minimal config:

```env
# Storage
FILE_STORAGE_PATH=content
QDRANT_URL=http://localhost:6333

# Embeddings (Choose one)
EMBEDDINGS_PROVIDER=ollama
EMBEDDINGS_BASE_URL=http://localhost:11434
EMBEDDINGS_MODEL=nomic-embed-text

# OR Groq (get free key: https://console.groq.com/keys)
# EMBEDDINGS_PROVIDER=groq
# EMBEDDINGS_API_KEY=your_groq_key

# Voice
VOICE_MODE=local
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecretdevsecretdevsecretdevsec

# LLM
LLM_PROVIDER=groq
LLM_MODEL=llama-3.1-70b-versatile
GROQ_API_KEY=your_groq_api_key
```

### 4. Run Server

```bash
uv run python main.py
```

Server runs on: **http://localhost:8000**

## API Documentation

Interactive Swagger UI: **http://localhost:8000/docs**

### Key Endpoints

- `GET /health` - Health check
- `POST /api/v1/ingest` - Upload presentation
- `POST /api/v1/voice/query` - Voice query
- `GET /api/v1/events/{session_id}` - SSE stream

## Development

### Using Makefile (from project root)

```bash
make backend-api    # Run API server
make worker         # Run voice worker
make dev-all        # Run everything
```

### Manual Setup

```bash
# Activate virtual environment
source .venv/bin/activate

# Run API
uvicorn main:app --reload --port 8000

# Run worker (separate terminal)
python -m agents.slide_voice_worker dev
```

## Architecture

### Directory Structure

```
backend/
├── config/           # Configuration modules
│   ├── base_config.py
│   ├── embedding_config.py
│   ├── llm.py
│   └── voice.py
├── routers/          # API endpoints
│   ├── events.py
│   ├── ingestion_router.py
│   └── voice.py
├── services/         # Business logic
│   ├── ingestion/
│   │   ├── parser.py
│   │   ├── cleaner.py
│   │   └── pipeline.py
│   └── voice/
│       ├── retrieval.py
│       └── transcriber.py
├── utils/            # Utilities
│   ├── embeddings.py
│   ├── vectorstore.py
│   └── storage.py
├── agents/           # AI workers
│   └── slide_voice_worker.py
├── main.py          # Entry point
└── pyproject.toml   # Dependencies
```

### Core Services

#### Ingestion Pipeline
1. **Parser** - Extract content from PPTX
2. **Cleaner** - Process and normalize text
3. **Embedding** - Convert to vectors
4. **Storage** - Save to Qdrant

#### Voice Processing
1. **Transcription** - Speech-to-text (Whisper/Deepgram)
2. **Retrieval** - Find relevant slides (vector search)
3. **LLM** - Generate AI response
4. **TTS** - Text-to-speech (optional)

## Configuration Options

### Embedding Providers

| Provider | Speed | Cost | Privacy | Setup |
|----------|-------|------|---------|-------|
| **Ollama** | Medium | Free | ⭐⭐⭐ | Local install |
| **Groq** | Fast | Free tier | ⭐⭐ | API key |
| **OpenAI** | Fast | Paid | ⭐ | API key |

### Voice Modes

**Local Mode** (`VOICE_MODE=local`)
- Uses local LiveKit + Whisper
- No cloud costs
- Recommended for development

**Cloud Mode** (`VOICE_MODE=agentkit_live`)
- Uses LiveKit Cloud
- Production-ready
- Requires cloud credentials

## Testing

```bash
# Health check
curl http://localhost:8000/health

# Upload presentation
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "file=@presentation.pptx"

# Voice query
curl -X POST http://localhost:8000/api/v1/voice/query \
  -H "Content-Type: application/json" \
  -d '{"query": "marketing strategy", "session_id": "test"}'
```

## Troubleshooting

### Common Issues

**Port 8000 in use:**
```bash
lsof -ti:8000 | xargs kill -9
```

**Qdrant connection failed:**
```bash
docker ps | grep vectordb
docker compose logs vectordb
```

**Ollama not responding:**
```bash
ollama serve
ollama pull nomic-embed-text
```

**Groq API errors:**
- Verify API key at https://console.groq.com/keys
- Check rate limits

## Dependencies

Key packages:
- `fastapi` - Web framework
- `langchain` - LLM orchestration
- `qdrant-client` - Vector DB
- `livekit-agents` - Real-time audio
- `faster-whisper` - Local STT
- `python-pptx` - PowerPoint parsing

See `pyproject.toml` for full list.

## License

MIT License - See root [LICENSE](../LICENSE) file.

---

**Backend runs on:** http://localhost:8000  
**Swagger docs:** http://localhost:8000/docs  
**Main README:** [../README.md](../README.md)
