# PresAI 🎤

PresAI is an intelligent presentation assistant that allows you to navigate through slides using voice commands. Built with modern web technologies, it provides real-time voice interaction for seamless presentation control.

## Features

- 🎤 **Voice-Controlled Navigation**: Navigate slides hands-free using natural language queries
- 🔍 **Smart Slide Recommendations**: AI-powered content matching to find relevant slides
- ⚡ **Real-Time Processing**: Live transcription and instant slide navigation
- 📊 **PPT/PPTX Support**: Upload and process PowerPoint presentations
- 🌐 **Modern UI**: Clean, responsive React-based frontend
- 🔊 **LiveKit Integration**: Professional-grade audio streaming and processing

## Architecture

### Backend (FastAPI + Python)
- **Framework**: FastAPI for high-performance REST API
- **Vector Database**: Qdrant for semantic search
- **Embeddings**: OpenAI embeddings for content vectorization
- **Speech-to-Text**: Faster-Whisper for local transcription
- **Live Streaming**: LiveKit for real-time audio communication
- **Event System**: Server-Sent Events (SSE) for real-time updates

### Frontend (React + Vite)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and HMR
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Audio**: LiveKit client SDK
- **Routing**: React Router

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

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.10+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **UV** - Python package manager (`curl -LsSf https://astral.sh/uv/install.sh | sh`)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd presai
```

### 2. Backend Setup

#### Install Dependencies

```bash
cd backend
uv sync
```

#### Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Required Environment Variables:**

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=text-embedding-ada-002

# Qdrant Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=presai_slides

# LiveKit Configuration
VOICE_MODE=local
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecretdevsecretdevsecretdevsec
LIVEKIT_ROOM_PREFIX=presai
LIVEKIT_TOKEN_TTL_SECONDS=3600

# Faster Whisper Configuration (for local mode)
FASTER_WHISPER_MODEL=tiny
FASTER_WHISPER_DEVICE=cpu
FASTER_WHISPER_COMPUTE_TYPE=int8
FASTER_WHISPER_LANGUAGE=en
FASTER_WHISPER_BEAM_SIZE=1

# Miscellaneous
BATCH_SIZE=32
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=INFO
```

#### Start Services with Docker

```bash
# From backend directory
docker compose up -d
```

This starts:
- Qdrant vector database (port 6333)
- LiveKit server (port 7880)

#### Run the Backend

```bash
# Using uv
uv run python main.py

# Or activate virtual environment first
source .venv/bin/activate
python main.py
```

The backend will start on `http://localhost:8000`

### 3. Frontend Setup

#### Install Dependencies

```bash
cd frontend
npm install
```

#### Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit if needed (defaults work for local development)
nano .env
```

**Frontend Environment Variables:**

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_LIVEKIT_URL=ws://localhost:7880
```

#### Run the Frontend

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Usage Guide

### 1. Upload a Presentation

1. Navigate to the application in your browser
2. Click "Upload Presentation" or drag and drop a PPT/PPTX file
3. Wait for the ingestion process to complete
4. Your presentation is now ready for voice navigation

### 2. Use Voice Commands

1. Click the microphone button to activate voice input
2. Ask a question about your presentation content
3. The system will:
   - Transcribe your speech
   - Search for relevant slides
   - Automatically navigate to the recommended slide
   - Display the transcript and answer

### 3. Manual Navigation

You can also:
- Use arrow keys to navigate slides
- Type a slide number to jump directly
- Browse slide thumbnails

## API Endpoints

### Events
- `GET /api/v1/events/{session_id}` - Server-Sent Events stream for real-time updates

### Ingestion
- `POST /api/v1/ingest` - Upload and process a PPT/PPTX file
- `GET /api/v1/file/{filename}` - Download uploaded presentation file

### Voice
- `POST /api/v1/voice/query` - Submit a voice query for slide navigation
- `POST /api/v1/voice/livekit/token` - Get LiveKit authentication token
- `POST /api/v1/voice/transcribe` - Transcribe audio file (local mode only)

### Health Check
- `GET /health` - Check if backend is running

## Development

### Running Tests

```bash
# Backend tests (coming soon)
cd backend
pytest

# Frontend tests (coming soon)
cd frontend
npm test
```

### Code Formatting

```bash
# Backend
cd backend
black .
isort .

# Frontend
cd frontend
npm run lint
npm run format
```

### Docker Commands

```bash
# View running containers
docker ps

# View logs
docker compose logs -f qdrant
docker compose logs -f livekit

# Restart services
docker compose restart

# Stop all services
docker compose down
```

## Configuration Options

### Voice Modes

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

## Troubleshooting

### Backend Issues

**Port Already in Use**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

**Qdrant Connection Failed**
```bash
# Check if Qdrant is running
docker ps | grep qdrant

# Restart Qdrant
docker compose restart qdrant
```

**LiveKit Connection Issues**
- Ensure Docker network is properly configured
- Check firewall settings for port 7880
- Verify LIVEKIT_URL in .env matches your setup

### Frontend Issues

**API Connection Failed**
- Ensure backend is running on port 8000
- Check VITE_API_BASE_URL in frontend/.env
- Verify CORS settings in backend

**Microphone Not Working**
- Grant microphone permissions in browser
- Check browser media settings
- Try a different browser (Chrome recommended)

### Common Errors

**"No matching slide content found"**
- Ensure you've uploaded a presentation first
- Try broader questions
- Check if ingestion completed successfully

**"Voice transcription failed"**
- Verify Faster-Whisper is installed: `pip install faster-whisper`
- Check audio format compatibility
- Ensure microphone input is working

## Performance Optimization

### For Large Presentations

1. Increase batch size in `.env`:
   ```env
   BATCH_SIZE=64
   ```

2. Use more powerful embedding model:
   ```env
   OPENAI_MODEL=text-embedding-3-large
   ```

3. Adjust top_k parameter for faster responses:
   ```python
   top_k=3  # Default is 5
   ```

### For Better Voice Recognition

1. Use a better Whisper model:
   ```env
   FASTER_WHISPER_MODEL=medium
   FASTER_WHISPER_COMPUTE_TYPE=float16
   ```

2. Ensure quiet environment for recording
3. Speak clearly and at moderate pace

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [LiveKit](https://livekit.io/) - Real-time audio/video platform
- [Qdrant](https://qdrant.tech/) - Vector similarity search engine
- [Faster-Whisper](https://github.com/guillaumekln/faster-whisper) - Fast Whisper inference
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Next generation frontend tooling

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Join our community discussions

---

**Built with ❤️ using FastAPI and React**
