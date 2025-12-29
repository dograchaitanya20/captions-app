import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { transcribeAudio, transcribeVideo, saveTranscription } from '../controllers/transcribeController.js';
import { translateCaptions, downloadCaptions } from '../controllers/videoTranscriptionController.js';
import { authMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadsPath = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/mpeg',
      'audio/wav',
      'audio/m4a',
      'audio/x-m4a',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'audio/ogg',
      'video/webm',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

router.post('/audio', authMiddleware, upload.single('file'), transcribeAudio);
router.post('/video', authMiddleware, upload.single('file'), transcribeVideo);
router.post('/save', authMiddleware, saveTranscription);
router.post('/translate', authMiddleware, translateCaptions);
router.get('/download', authMiddleware, downloadCaptions);

console.log('[ROUTES] Transcribe routes registered: /translate, /download, /audio, /video, /save');

export default router;

