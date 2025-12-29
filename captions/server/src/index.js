import express from 'express';
import mongoose, { Types } from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

import authRoutes from './routes/auth.js';
import captionRoutes from './routes/captions.js';
import transcribeRoutes from './routes/transcribe.js';
import uploadRoutes from './routes/upload.js';
import Caption from './models/Caption.js';
import { simplifyText, translateText } from './controllers/videoTranscriptionController.js';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/captions_app';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Range');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
}, express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4')) res.setHeader('Content-Type', 'video/mp4');
    else if (filePath.endsWith('.webm')) res.setHeader('Content-Type', 'video/webm');
    else if (filePath.endsWith('.mkv')) res.setHeader('Content-Type', 'video/x-matroska');
    else if (filePath.endsWith('.avi')) res.setHeader('Content-Type', 'video/x-msvideo');
    else if (filePath.endsWith('.mov')) res.setHeader('Content-Type', 'video/quicktime');
    res.setHeader('Accept-Ranges', 'bytes');
  },
}));

app.use('/api/auth', authRoutes);
app.use('/api/captions', captionRoutes);
app.use('/api/transcribe', transcribeRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => {
  res.send('Captioning Platform API is running');
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const activeSessions = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('caption-session:start', async (payload, ack) => {
    try {
      const { title = 'Microphone session', filePath = 'microphone', language = 'en', targetLanguage, userId } = payload || {};

      const caption = new Caption({
        userId: userId || new Types.ObjectId(),
        title,
        type: 'video',
        filePath,
        transcription: '',
        captions: [],
        language,
      });

      await caption.save();

      activeSessions.set(socket.id, {
        captionId: caption._id.toString(),
        transcription: '',
        language,
        targetLanguage,
        title,
        filePath,
        userId,
      });

      ack && ack({ ok: true, captionId: caption._id });
    } catch (error) {
      console.error('[SOCKET] Failed to start session:', error.message);
      ack && ack({ ok: false, error: error.message });
    }
  });

  socket.on('caption-segment', async (payload, ack) => {
    try {
      const session = activeSessions.get(socket.id);
      if (!session) return ack && ack({ ok: false, error: 'No active caption session for this socket.' });

      const { start = 0, end, text = '', targetLanguage } = payload || {};
      const simplified = simplifyText(text);
      const translated = translateText(simplified, targetLanguage || session.targetLanguage || session.language);

      const segment = {
        start,
        end: typeof end === 'number' ? end : start + Math.max(1.5, simplified.split(/\s+/).length / 2.5),
        text: translated,
      };

      session.transcription = `${session.transcription} ${segment.text}`.trim();

      await Caption.findByIdAndUpdate(session.captionId, {
        $push: { captions: segment },
        $set: { transcription: session.transcription, language: session.language },
      });

      ack && ack({ ok: true, segment, transcription: session.transcription });
    } catch (error) {
      console.error('[SOCKET] Failed to save segment:', error.message);
      ack && ack({ ok: false, error: error.message });
    }
  });

  socket.on('caption-session:complete', async (payload, ack) => {
    try {
      const session = activeSessions.get(socket.id);
      if (!session) return ack && ack({ ok: false, error: 'No active caption session to complete.' });

      const duration = (payload && payload.duration) ?? 0;
      await Caption.findByIdAndUpdate(session.captionId, {
        $set: { duration, transcription: session.transcription },
      });

      activeSessions.delete(socket.id);
      ack && ack({ ok: true });
    } catch (error) {
      console.error('[SOCKET] Failed to complete session:', error.message);
      ack && ack({ ok: false, error: error.message });
    }
  });

  socket.on('disconnect', () => {
    activeSessions.delete(socket.id);
    console.log('User disconnected:', socket.id);
  });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
