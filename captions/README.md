# Captioning Platform - Full Stack Setup

## Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

## Quick Start

### 1. Install Dependencies

#### Backend
```bash
cd server
npm install
```

#### Frontend
```bash
cd client
npm install
```

### 2. Environment Setup

Create `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/captions_app?appName=Cluster0
JWT_SECRET=your_secret_key_here
```

Update your actual MongoDB credentials in MONGO_URI.

### 3. Start the Application

#### Terminal 1 - Backend Server
```bash
cd server
npm run dev
```

Server will run on `http://localhost:5000`

#### Terminal 2 - Frontend Development Server
```bash
cd client
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Test the Application

1. Navigate to `http://localhost:5173`
2. Register a new account
3. Login
4. Try the features:
   - **Live Audio Captioning**: Uses browser's Web Speech API
   - **Upload Audio/Video**: Upload media and play it back while the microphone listens (SpeechRecognition)
   - **Dashboard**: View all features

## Features

### Real-Time Captioning
- **Live Audio**: Uses Web Speech API (no API keys required)
- **Live Video**: Real-time captions with webcam

### Microphone-based Captioning (JavaScript-only)
- **Audio/Video**: Upload MP3/WAV/MP4/WebM, then play it while the browser microphone listens.
- **SpeechRecognition API** in Chrome/Edge (no Python, no Whisper, no paid APIs).
- **WebSockets** stream recognized phrases to the Node backend for rule-based simplification/translation.

### User Features
- JWT Authentication
- User preferences (font size, colors, etc.)
- Caption history
- Download transcripts

## Project Structure

```
captions/
├── client/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/         # All page components
│   │   ├── components/    # UI & Layout components
│   │   ├── context/       # Auth context
│   │   ├── lib/           # Utilities
│   │   └── App.tsx        # Main app
│   └── package.json
│
├── server/                # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/   # Business logic (JS-only mic pipeline)
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth middleware
│   │   └── index.ts       # Entry point with WebSocket streaming
│   ├── uploads/           # Uploaded files (temporary)
│   └── package.json
│
└── README.md             # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)
- `PUT /api/auth/preferences` - Update user preferences (requires auth)

### Transcription
- `POST /api/transcribe/audio` - Transcribe audio file (requires auth)
- `POST /api/transcribe/video` - Transcribe video file (requires auth)

### Captions
- `GET /api/captions` - Get caption history (requires auth)
- `GET /api/captions/:id` - Get specific caption (requires auth)
- `DELETE /api/captions/:id` - Delete caption (requires auth)

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite (fast build tool)
- Tailwind CSS (styling)
- ShadCN UI (components)
- React Router (navigation)
- Axios (HTTP client)
- Socket.io (real-time)

### Backend
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT (authentication)
- Multer (file uploads)
- Socket.io (real-time)
- Faster-Whisper (offline transcription)

## Troubleshooting

### Python Script Not Running
1. Ensure Python 3.9+ is installed: `python --version`
2. Install dependencies: `pip install -r server/python/requirements.txt`
3. Test manually: `python server/python/transcribe.py <audio-file>`

### MongoDB Connection Failed
1. Check MONGO_URI in `.env` file
2. Ensure MongoDB Atlas IP whitelist includes your IP
3. Verify username/password are correct

### Port Already in Use
- Backend: Change PORT in `.env` and update frontend API URL
- Frontend: Change Vite port in `client/vite.config.ts`

### CORS Errors
- Check that backend CORS allows `http://localhost:5173`
- Update CORS origin in `server/src/index.ts` if using different port

## Performance Notes

- **Whisper Model**: Using "base" model balances speed/accuracy
- **GPU Support**: For faster transcription, install CUDA-capable version
- **File Upload Limit**: Set to 500MB for videos, 100MB for audio
- **Session**: JWT tokens expire in 7 days

## Next Steps

1. **Deploy**: Use Vercel for frontend, Railway/Render for backend
2. **Database**: MongoDB Atlas (production ready)
3. **Files**: Use AWS S3 or similar for file storage
4. **Scaling**: Add Redis for caching, message queues for transcription jobs
5. **Monitoring**: Add error tracking (Sentry), logging (Winston)

## License

MIT
