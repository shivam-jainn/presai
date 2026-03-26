# PresAI Frontend ⚡

Modern React-based frontend for PresAI - Voice-controlled presentation assistant.

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Default config works for local development:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_API_TIMEOUT=30000
VITE_VOICE_MODE=local
```

### 3. Run Development Server

```bash
npm run dev
```

Frontend runs on: **http://localhost:5173**

## Features

- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- 🎤 **Voice Interface** - Real-time audio with LiveKit integration
- 📊 **PPTX Preview** - Render PowerPoint presentations in browser
- ⚡ **Fast Performance** - Vite HMR for instant updates
- 🔍 **Smart Search** - AI-powered slide recommendations
- 📱 **Mobile Responsive** - Works on all devices

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | React 18 + TypeScript | Type-safe components |
| **Build Tool** | Vite | Fast dev server & bundling |
| **Styling** | Tailwind CSS | Utility-first styling |
| **State** | Zustand | Lightweight state management |
| **Audio** | LiveKit Client | Real-time voice streaming |
| **Routing** | React Router | Client-side navigation |
| **Preview** | pptx-preview | PowerPoint rendering |
| **UI Components** | Shadcn/ui | Beautiful primitives |

## Project Structure

```
frontend/
├── public/            # Static assets
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/        # Images, fonts
│   ├── components/
│   │   ├── custom/
│   │   │   └── slides/
│   │   │       ├── AudioWaveform.tsx
│   │   │       ├── ControlPill.tsx
│   │   │       ├── RealTimeTranscript.tsx
│   │   │       ├── SlideCanvas.tsx
│   │   │       ├── StatusToast.tsx
│   │   │       └── TopBar.tsx
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   └── Slides.tsx
│   │   └── ui/        # Base UI components
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   ├── api.ts     # API client
│   │   ├── config.ts  # App config
│   │   ├── store.ts   # Zustand store
│   │   └── utils.ts   # Helpers
│   ├── types/
│   │   └── pptxjs.d.ts
│   ├── App.tsx        # Root component
│   ├── index.css      # Global styles
│   └── main.tsx       # Entry point
├── package.json
└── vite.config.ts
```

## Available Scripts

### Development

```bash
npm run dev          # Start dev server (HMR enabled)
```

### Production

```bash
npm run build        # Build production bundle
npm run preview      # Preview production build
```

### Maintenance

```bash
npm run lint         # ESLint check
npm run format       # Format code (if configured)
```

## Key Components

### Pages

**Landing Page** (`/`)
- Upload interface
- Feature showcase
- Getting started guide

**Slides Page** (`/slides/:id`)
- Presentation viewer
- Voice controls
- Slide navigation
- Real-time transcript

### Custom Components

**SlideCanvas**
- Renders PPTX slides
- Handles zoom and pan
- Keyboard navigation

**AudioWaveform**
- Visualizes voice input
- Real-time animation
- Recording indicator

**RealTimeTranscript**
- Live speech transcription
- Streaming text display
- Error handling

**ControlPill**
- Floating action button
- Microphone toggle
- Status indicator

**TopBar**
- Navigation header
- Session info
- Settings menu

## State Management

Using **Zustand** for lightweight global state:

```typescript
// Example usage
import { useStore } from './lib/store'

const { 
  currentSlide, 
  setCurrentSlide, 
  isRecording,
  toggleRecording 
} = useStore()
```

## API Integration

### Axios Client

Configured in `src/lib/api.ts`:

```typescript
import axios from 'axios'
import { API_BASE_URL, API_TIMEOUT } from './config'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
})

// Usage
const response = await api.post('/voice/query', {
  query: "Show me revenue slides",
  session_id: "abc123"
})
```

### Key API Calls

```typescript
// Upload presentation
await api.post('/ingest', formData)

// Voice query
await api.post('/voice/query', { query, session_id })

// Get LiveKit token
await api.post('/voice/livekit/token')

// Subscribe to events (SSE)
const eventSource = new EventSource(
  `${API_BASE_URL}/events/${sessionId}`
)
```

## LiveKit Integration

### Setup

```typescript
import { Room, RoomEvent } from 'livekit-client'

const room = new Room()

// Connect to LiveKit server
await room.connect(LIVEKIT_URL, token)

// Handle participant tracks
room.on(RoomEvent.TrackSubscribed, (track) => {
  // Process audio/video
})
```

### Voice Controls

```typescript
// Enable microphone
const track = await createLocalTracks({ audio: true })

// Publish to room
await room.localParticipant.publishTrack(track)

// Stop recording
track.stop()
```

## Styling

### Tailwind CSS

Utility-first approach:

```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Action
  </button>
</div>
```

### Custom Components

Built on top of Shadcn/ui primitives:

```tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

<Button variant="primary">Click me</Button>
<Card className="p-4">Content</Card>
```

## TypeScript Configuration

Strict type checking enabled:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000/api/v1` |
| `VITE_API_TIMEOUT` | Request timeout (ms) | `30000` |
| `VITE_VOICE_MODE` | Voice mode (local/cloud) | `local` |

## Building for Production

```bash
# Build optimized bundle
npm run build

# Output directory
ls dist/
```

### Deployment

Deploy `dist/` folder to any static hosting:

- **Vercel**: Automatic deployment from Git
- **Netlify**: Drag & drop or CLI
- **Cloudflare Pages**: Git integration
- **AWS S3**: Manual upload

Example for Vercel:

```bash
vercel deploy --prod
```

## Development Tips

### Hot Module Replacement

Vite HMR is automatic - changes appear instantly without reload.

### Debugging

```typescript
// Enable debug logging
localStorage.setItem('debug', 'presai:*')

// In browser console
console.log(useStore.getState())
```

### Performance

- Use React.memo for expensive components
- Lazy load routes with React.lazy
- Optimize images (WebP format)
- Code splitting with dynamic imports

## Common Issues

### API Connection Failed

**Solution:**
1. Ensure backend is running on port 8000
2. Check `VITE_API_BASE_URL` in `.env`
3. Verify CORS settings in backend

### Microphone Not Working

**Solution:**
1. Grant browser permissions
2. Check system microphone settings
3. Try Chrome/Edge browser
4. Ensure HTTPS (or localhost)

### Build Errors

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm cache clean --force
```

## Testing

Tests coming soon! Planned setup:

```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run test:e2e
```

## Contributing

1. Create branch: `git checkout -b feature/frontend-feature`
2. Make changes
3. Test thoroughly
4. Lint: `npm run lint`
5. Commit: `git commit -m "feat: add feature"`
6. Push and create PR

## Code Style

- **Formatting**: Prettier (if configured)
- **Linting**: ESLint with TypeScript rules
- **Imports**: Organized (types first, then libs, then internal)
- **Components**: Functional with hooks

Example:

```typescript
// Types
import type { FC } from 'react'

// External libs
import { useState } from 'react'

// Internal modules
import { useStore } from '@/lib/store'

// Component
export const MyComponent: FC = () => {
  // Implementation
}
```

## Dependencies

Key packages:

- `react` - UI framework
- `livekit-client` - Real-time audio
- `pptx-preview` - PowerPoint rendering
- `zustand` - State management
- `axios` - HTTP client
- `tailwindcss` - Styling
- `shadcn/ui` - UI primitives

See `package.json` for full list.

## Browser Support

- **Chrome** 90+ (Recommended)
- **Edge** 90+
- **Firefox** 88+
- **Safari** 14+ (Limited WebRTC features)

## License

MIT License - See root [LICENSE](../LICENSE) file.

---

**Frontend runs on:** http://localhost:5173  
**Backend API:** http://localhost:8000  
**Main README:** [../README.md](../README.md)
