import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Caption from '../models/Caption.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const transcribeAudio = async (req, res) => {
  try {
    if (!req.file) {
      console.error('[UPLOAD] No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;
    const fileUrl = `/uploads/${fileName}`;

    console.log(`[UPLOAD] Audio file received: ${fileName}`);
    console.log(`[UPLOAD] File path: ${filePath}`);
    console.log(`[UPLOAD] File size: ${req.file.size} bytes`);

    res.json({
      message: 'File uploaded successfully',
      fileUrl,
      fileName,
      fileSize: req.file.size,
    });
  } catch (error) {
    console.error('[UPLOAD] Upload error:', error);
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('[UPLOAD] Failed to delete file:', e);
      }
    }
    res.status(500).json({ message: 'Upload failed: ' + error.message });
  }
};


export const transcribeVideo = async (req, res) => {
  try {
    if (!req.file) {
      console.error('[UPLOAD] No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;
    const fileUrl = `/uploads/${fileName}`;

    console.log(`[UPLOAD] Video file received: ${fileName}`);
    console.log(`[UPLOAD] File path: ${filePath}`);
    console.log(`[UPLOAD] File size: ${req.file.size} bytes`);

    res.json({
      message: 'File uploaded successfully',
      fileUrl,
      fileName,
      fileSize: req.file.size,
    });
  } catch (error) {
    console.error('[UPLOAD] Upload error:', error);
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('[UPLOAD] Failed to delete file:', e);
      }
    }
    res.status(500).json({ message: 'Upload failed: ' + error.message });
  }
};

export const saveTranscription = async (req, res) => {
  try {
    const { fileName, transcription, type } = req.body;

    if (!fileName || !transcription) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log(`[SAVE] Saving transcription for: ${fileName}`);
    const caption = new Caption({
      userId: req.userId,
      title: `${type === 'video' ? 'Video' : 'Audio'} - ${fileName}`,
      type: type || 'audio',
      filePath: fileName,
      transcription,
      captions: parseTranscription(transcription),
      language: req.body.language || 'en',
    });

    await caption.save();
    console.log(`[SAVE] Caption saved to database with ID: ${caption._id}`);

    const filePath = path.join(__dirname, '../../uploads', fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[SAVE] Temporary file deleted: ${filePath}`);
    }

    res.json({
      message: 'Transcription saved',
      captionId: caption._id,
    });
  } catch (error) {
    console.error('[SAVE] Save error:', error);
    res.status(500).json({ message: 'Failed to save transcription: ' + error.message });
  }
};

const parseTranscription = (text) => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const captions = [];
  let currentTime = 0;
  const wordsPerSecond = 2.5;

  sentences.forEach((sentence) => {
    const wordCount = sentence.trim().split(/\s+/).length;
    const duration = wordCount / wordsPerSecond;

    if (sentence.trim()) {
      captions.push({
        start: Math.round(currentTime * 100) / 100,
        end: Math.round((currentTime + duration) * 100) / 100,
        text: sentence.trim(),
      });
      currentTime += duration;
    }
  });

  return captions;
};

