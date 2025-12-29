 

import Caption from '../models/Caption.js';

const fillerRegex = /\b(um|uh|er|ah|like|you know|basically|actually|literally)\b/gi;

export const simplifyText = (text) => {
  const trimmed = text.replace(fillerRegex, '').replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

export const translateText = (text, targetLanguage) => {
  if (!text) return '';
  if (!targetLanguage || targetLanguage === 'en') return text;

  const dictionary = {
    es: { hello: 'hola', welcome: 'bienvenido', thanks: 'gracias' },
    fr: { hello: 'bonjour', welcome: 'bienvenue', thanks: 'merci' },
    hi: { hello: 'नमस्ते', welcome: 'स्वागत', thanks: 'धन्यवाद' },
  };

  const langKey = targetLanguage.split('-')[0];
  const replacements = dictionary[langKey];
  if (!replacements) {
    return `[${langKey}] ${text}`;
  }

  return text
    .split(' ')
    .map((word) => replacements[word.toLowerCase()] || word)
    .join(' ');
};

export const translateCaptions = async (req, res) => {
  const { captionId, targetLanguage } = req.body;

  try {
    const caption = await Caption.findById(captionId);
    if (!caption) {
      return res.status(404).json({ message: 'Captions not found' });
    }

    const translatedSegments = caption.captions.map((seg) => ({
      ...seg,
      text: translateText(seg.text, targetLanguage),
    }));

    res.json({
      success: true,
      segments: translatedSegments,
      message: `Captions translated to ${targetLanguage || 'en'} (rule-based demo)`,
    });
  } catch (error) {
    console.error('[TRANSLATE] Error:', error);
    res.status(500).json({ message: 'Translation failed', error: error.message });
  }
};

export const generateSRT = (segments) => {
  let srt = '';

  segments.forEach((segment, index) => {
    const startTime = formatSRTTime(segment.start);
    const endTime = formatSRTTime(segment.end);

    srt += `${index + 1}\n`;
    srt += `${startTime} --> ${endTime}\n`;
    srt += `${segment.text}\n\n`;
  });

  return srt;
};

function formatSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

export const downloadCaptions = async (req, res) => {
  const { captionId, format } = req.query;

  try {
    const caption = await Caption.findById(captionId);

    if (!caption) {
      return res.status(404).json({ message: 'Captions not found' });
    }

    if (format === 'srt') {
      const srtContent = generateSRT(caption.captions);

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="captions.srt"');
      res.send(srtContent);
    } else {
      const txtContent = caption.transcription;

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="transcription.txt"');
      res.send(txtContent);
    }
  } catch (error) {
    console.error('[DOWNLOAD] Error:', error);
    res.status(500).json({ message: 'Download failed', error: error.message });
  }
};

