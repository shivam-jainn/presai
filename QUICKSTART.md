# ⚡ Quick Setup Guide - PresAI

Get PresAI running in **5 minutes** or less!

## Prerequisites (2 minutes)

Install these if you haven't already:

```bash
# macOS (using Homebrew)
brew install python@3.13 node uv

# Check Docker is installed
docker --version

# If not, download from https://www.docker.com/products/docker-desktop/
```

## Installation (3 minutes)

### Step 1: Clone & Start Infrastructure

```bash
# Clone repository
git clone <repository-url>
cd presai

# Start Docker services (Qdrant + LiveKit)
make infra-up
```

### Step 2: Backend Setup

```bash
cd backend

# Install Python dependencies
uv sync

# Copy environment config
cp .env.example .env

# Edit .env - add your Groq API key (get free: https://console.groq.com/keys)
nano .env

# Run backend
uv run python main.py
```

✅ Backend running on http://localhost:8000

### Step 3: Frontend Setup (new terminal)

```bash
cd frontend

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Run frontend
npm run dev
```

✅ Frontend running on http://localhost:5173

## 🎉 You're Done!

Open **http://localhost:5173** in your browser.

### Next Steps

1. **Upload a presentation** - Click "Upload" and select a PPTX file
2. **Test voice** - Click microphone and ask "Show me slide 5"
3. **Explore features** - Try different voice commands

## Minimal Configuration

You only need to set **ONE** thing in `backend/.env`:

```env
GROQ_API_KEY=gsk_your_free_key_here
```

Everything else works with defaults!

### Alternative: Completely Local (No API Keys)

Want 100% local setup? Install Ollama:

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull nomic-embed-text
ollama pull llama3.1

# Update backend/.env
EMBEDDINGS_PROVIDER=ollama
LLM_PROVIDER=ollama
```

No API keys needed!

## Troubleshooting

**Port 8000 in use?**
```bash
lsof -ti:8000 | xargs kill -9
```

**Docker not running?**
```bash
open -a Docker  # macOS
# Wait for Docker icon to stop spinning
```

**Frontend won't start?**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Backend errors?**
```bash
cd backend
source .venv/bin/activate
python main.py  # See detailed errors
```

## Makefile Shortcuts

From project root:

```bash
make infra-up      # Start Docker services
make infra-down    # Stop Docker services
make infra-logs    # View service logs
make backend-api   # Run backend only
make frontend      # Run frontend only
make dev-all       # Run everything at once
```

## What's Installed?

| Service | Port | Purpose |
|---------|------|---------|
| **Frontend** | 5173 | React UI |
| **Backend API** | 8000 | FastAPI server |
| **Qdrant** | 6333 | Vector database |
| **LiveKit** | 7880 | Audio streaming |

## Need Help?

- Full documentation: [README.md](README.md)
- Backend docs: [backend/README.md](backend/README.md)
- Frontend docs: [frontend/README.md](frontend/README.md)
