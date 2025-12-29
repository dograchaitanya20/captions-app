import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/config';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  FileVideo,
  Download,
  AlertCircle,
} from 'lucide-react';

const UploadVideo = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [error, setError] = useState('');
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [segments, setSegments] = useState([]);
  const [micSupported, setMicSupported] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  const videoRef = useRef(null);
  const micRecognitionRef = useRef(null);
  const micRestartTimeoutRef = useRef(null);
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setMicSupported(Boolean(SpeechRecognition));

    return () => {
      if (micRecognitionRef.current) {
        try {
          micRecognitionRef.current.stop();
        } catch (_) {}
      }
      if (micRestartTimeoutRef.current) {
        clearTimeout(micRestartTimeoutRef.current);
      }
    };
  }, []);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || segments.length === 0) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const activeIndex = segments.findIndex(
        (seg) => currentTime >= seg.start && currentTime < seg.end
      );
      if (activeIndex !== -1 && activeIndex !== currentSegmentIndex) {
        setCurrentSegmentIndex(activeIndex);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [segments, currentSegmentIndex]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setTranscription('');
      setError('');
      setProgress(0);
      setSegments([]);
      setVideoUrl(null);
      setCurrentSegmentIndex(0);
    }
  };
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a video file first');
      return;
    }
    setUploading(true);
    setError('');
    setProgress(0);
    const token = localStorage.getItem('token');
    if (!token) {
      setUploading(false);
      setError('Please login to upload a video.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/upload/video`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / (e.total || 1));
            setProgress(percent);
          },
        }
      );

      setUploading(false);
      setProgress(100);

      const nextVideoUrl = `${API_BASE_URL}${res.data.fileUrl}`;
      setVideoUrl(nextVideoUrl);
      setTranscription('');
      setSegments([]);
      setCurrentSegmentIndex(0);
      setError('');
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, 100);
    } catch (err) {
      setUploading(false);
      const message = err.response?.data?.message || err.message || 'Video upload failed. Make sure backend is running.';
      setError(message);
    }
  };

  const startMicTranscription = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Browser does not support speech recognition.');
      return;
    }

    if (micActive) {
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    } catch (permErr) {
      setError('Microphone permission denied. Please allow mic access.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language.split('-')[0];
    let lastFinalIndex = 0;

    recognition.onstart = () => {
      setError('');
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const video = videoRef.current;
      if (!video) return;

      setIsListening(false);
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          setIsListening(true);

          if (i >= lastFinalIndex) {
            lastFinalIndex = i + 1;
            
            const transcriptText = transcript.trim();
            if (transcriptText) {
              const currentTime = video.currentTime;
              const estimatedDuration = Math.max(1.5, transcriptText.split(/\s+/).length / 2.5);
              const endTime = currentTime;
              const startTime = Math.max(0, currentTime - estimatedDuration);

              const segment = {
                start: parseFloat(startTime.toFixed(2)),
                end: parseFloat(endTime.toFixed(2)),
                text: transcriptText,
              };

              setSegments((prev) => [...prev, segment]);
              setTranscription((prev) => `${prev} ${transcriptText}`.trim());
            }
          }
        } else {
          interimText += transcript + ' ';
        }
      }
      if (interimText.trim()) {
        setTranscription((prev) => {
          const cleanPrev = prev.replace(/\s*\(typing\.\.\.\s*[^)]*\)\s*$/, '');
          return `${cleanPrev} (typing... ${interimText.trim()})`.trim();
        });
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        const video = videoRef.current;
        if (video && !video.paused) {
          try {
            recognition.stop();
          } catch (_) {}
          if (micRestartTimeoutRef.current) {
            clearTimeout(micRestartTimeoutRef.current);
          }
          micRestartTimeoutRef.current = setTimeout(() => {
            if (micActive) {
              startMicTranscription();
            }
          }, 500);
          return;
        }
      }
      if (event.error !== 'aborted') {
        setError(`Mic error: ${event.error}`);
        setMicActive(false);
      }
    };

    recognition.onend = () => {
      const video = videoRef.current;
      if (video && !video.paused && micActive) {
        if (micRestartTimeoutRef.current) {
          clearTimeout(micRestartTimeoutRef.current);
        }
        micRestartTimeoutRef.current = setTimeout(() => {
          startMicTranscription();
        }, 300);
      } else {
        setMicActive(false);
      }
    };

    micRecognitionRef.current = recognition;
    recognition.start();
    setMicActive(true);
  };

  const stopMicTranscription = () => {
    if (micRecognitionRef.current) {
      try {
        micRecognitionRef.current.stop();
      } catch (_) {}
      micRecognitionRef.current = null;
    }
    if (micRestartTimeoutRef.current) {
      clearTimeout(micRestartTimeoutRef.current);
      micRestartTimeoutRef.current = null;
    }
    setMicActive(false);
    setIsListening(false);
  };

  const downloadCaptions = async (format) => {
    if (segments.length > 0) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(
          `${API_BASE_URL}/api/captions`,
          {
            title: file?.name || 'Video Caption',
            text: transcription,
            segments,
            type: 'video',
            language,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err) {
        console.error('Failed to save caption to history:', err);
      }
    }
    if (format === 'txt') {
      const blob = new Blob([transcription], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'captions.txt';
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'srt') {
      let srtContent = '';
      segments.forEach((seg, idx) => {
        const startTime = formatSRTTime(seg.start);
        const endTime = formatSRTTime(seg.end);
        srtContent += `${idx + 1}\n${startTime} --> ${endTime}\n${seg.text}\n\n`;
      });
      const blob = new Blob([srtContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'captions.srt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatSRTTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="mb-20 text-center">
          <div className="inline-block mb-8 px-5 py-3 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/50 rounded-full backdrop-blur-sm hover:border-blue-400/70 transition-all">
            <p className="text-sm font-bold text-blue-200 flex items-center gap-2">🚀 AI-Powered Transcription</p>
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-200 tracking-tight leading-tight">Create Video Captions</h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed font-medium">Upload your video and instantly generate accurate captions using advanced speech recognition. Perfect for accessibility and engagement.</p>
        </div>

        {!videoUrl && (
          <div className="mb-12">
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/80 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden hover:border-blue-600/50 transition-all">
              <CardContent className="p-16 space-y-12">
                <div>
                  <div className="border-2 border-dashed border-slate-600 rounded-3xl p-20 text-center hover:border-blue-400 hover:bg-blue-500/10 transition-all duration-300 cursor-pointer group bg-slate-900/50 backdrop-blur">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="video-input"
                    />
                    <label htmlFor="video-input" className="cursor-pointer block">
                      {file ? (
                        <>
                          <div className="flex justify-center mb-8">
                            <div className="p-6 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-2xl border border-blue-400/40 group-hover:border-blue-300/60 transition-all">
                              <FileVideo className="h-16 w-16 text-blue-300" />
                            </div>
                          </div>
                          <p className="text-white font-black text-2xl mb-3">{file.name}</p>
                          <p className="text-sm text-slate-300 font-bold">{(file.size / 1024 / 1024).toFixed(2)} MB selected</p>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-center mb-8">
                            <div className="p-6 bg-slate-700/60 group-hover:bg-blue-600/30 rounded-2xl transition-all duration-300 border border-slate-600 group-hover:border-blue-500/50">
                              <Upload className="h-16 w-16 text-slate-400 group-hover:text-blue-300 transition-colors" />
                            </div>
                          </div>
                          <p className="text-white font-black text-2xl mb-3">Drop your video here</p>
                          <p className="text-slate-400 font-semibold text-base">or click to browse • MP4, WebM, MKV up to 500MB</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-white text-sm font-black tracking-wider uppercase">🌍 Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="bg-slate-900/70 border border-slate-700 text-white hover:border-blue-400 transition-all h-14 rounded-xl px-5 font-bold text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
                        <SelectItem value="en-GB">🇬🇧 English (UK)</SelectItem>
                        <SelectItem value="hi-IN">🇮🇳 Hindi</SelectItem>
                        <SelectItem value="es-ES">🇪🇸 Spanish</SelectItem>
                        <SelectItem value="fr-FR">🇫🇷 French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {uploading && (
                    <div className="space-y-4 p-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/40 rounded-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black text-blue-200 uppercase tracking-wide">📤 Uploading</span>
                        <span className="text-3xl font-black text-blue-400">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-3 bg-slate-700 rounded-full" />
                    </div>
                  )}
                </div>
                {error && (
                  <div className="bg-red-900/30 border border-red-600/50 text-red-200 px-6 py-5 rounded-2xl flex items-start gap-4">
                    <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5 text-red-400" />
                    <p className="text-sm font-bold">{error}</p>
                  </div>
                )}
                <div className="bg-gradient-to-br from-blue-600/25 via-cyan-600/25 to-slate-700/25 border border-blue-500/50 text-blue-100 px-8 py-6 rounded-2xl space-y-4 backdrop-blur-sm">
                  <p className="font-black text-blue-200 text-base flex items-center gap-3">✨ How to Get Started</p>
                  <ul className="space-y-3 text-blue-200/90 text-sm font-bold leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="text-lg">1️⃣</span>
                      <span>Upload your video file (MP4, WebM, or MKV)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-lg">2️⃣</span>
                      <span>Click the Start button to activate your microphone</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-lg">3️⃣</span>
                      <span>Speak to generate captions in real-time</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-lg">4️⃣</span>
                      <span>Download as TXT or SRT format when complete</span>
                    </li>
                  </ul>
                </div>
            </CardContent>
              <CardFooter className="pt-10 px-16 pb-10 border-t border-slate-700/50 bg-gradient-to-r from-slate-900/50 to-slate-800/50">
                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-700 hover:from-blue-700 hover:via-blue-800 hover:to-cyan-800 text-white font-black h-16 shadow-2xl hover:shadow-blue-600/60 transition-all rounded-xl text-lg uppercase tracking-wider disabled:opacity-50"
                >
                  {uploading ? `Uploading... ${progress}%` : '🚀 Upload & Get Started'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

      {videoUrl && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16">

          <div className="lg:col-span-2">
            <Card className="border border-slate-700 bg-gradient-to-br from-slate-800/80 to-slate-900/80 overflow-hidden shadow-2xl backdrop-blur-xl rounded-3xl">
              <CardContent className="p-0">
                <div className="relative bg-black w-full" style={{ minHeight: '500px' }}>
                  <video
                    ref={videoRef}
                    controls
                    controlsList="nodownload"
                    crossOrigin="anonymous"
                    preload="metadata"
                    playsInline
                    className="w-full h-full object-contain"
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                      backgroundColor: '#000',
                    }}
                    src={videoUrl}
                    onPause={stopMicTranscription}
                    onEnded={stopMicTranscription}
                  />
                  {micActive && (
                    <div className="absolute bottom-8 left-8 right-8 bg-gradient-to-r from-blue-600 via-blue-600 to-cyan-600 text-white px-8 py-4 rounded-2xl text-center text-base font-black border border-blue-300/70 shadow-2xl uppercase tracking-widest">
                      <div className="flex items-center justify-center gap-3">
                        <span className="inline-block w-3 h-3 bg-white rounded-full animate-pulse"></span>
                        🎤 {isListening ? 'Listening...' : 'Recording captions...'}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border border-slate-700 bg-gradient-to-br from-slate-800/80 to-slate-900/80 h-full flex flex-col shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-900/60 to-blue-900/20">
                <CardTitle className="text-2xl flex items-center gap-4 text-white font-black tracking-wide">
                  <span className="inline-block w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse"></span>
                  {micActive ? '📡 LIVE' : '📝 CAPTIONS'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto bg-slate-900/50 rounded-none p-6 min-h-96 space-y-5">
                {transcription ? (
                  <div className="space-y-5">
                    {segments.length > 0 && currentSegmentIndex >= 0 && segments[currentSegmentIndex] && (
                      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-700 text-white p-6 rounded-2xl border border-blue-400/50 shadow-xl">
                        <div className="text-xs text-blue-100 mb-4 font-black tracking-widest uppercase">{segments[currentSegmentIndex].start.toFixed(1)}s - {segments[currentSegmentIndex].end.toFixed(1)}s</div>
                        <div className="text-lg font-black leading-relaxed">{segments[currentSegmentIndex].text}</div>
                      </div>
                    )}

                    {segments.length > 0 && (
                      <div>
                        <div className="text-xs text-blue-300 font-black mb-4 flex justify-between uppercase tracking-widest">
                          <span>📋 {segments.length} Captions</span>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                          {segments.map((segment, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                if (videoRef.current) {
                                  videoRef.current.currentTime = segment.start;
                                }
                              }}
                              className={`w-full text-left p-4 rounded-xl text-xs transition font-bold ${
                                idx === currentSegmentIndex
                                  ? 'bg-blue-600/50 border-2 border-blue-400 text-white shadow-lg'
                                  : 'hover:bg-slate-700/60 text-slate-300 border border-slate-700 hover:border-blue-500/50'
                              }`}
                            >
                              <span className="text-slate-400 text-xs font-black">[{segment.start.toFixed(1)}s]</span> <span className="text-white">{segment.text}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {transcription && (
                      <div className="text-white text-xs leading-relaxed whitespace-pre-wrap border-t border-slate-700/50 pt-5 mt-4">
                        <p className="text-slate-300 mb-4 font-black uppercase tracking-widest">📄 Transcript</p>
                        <div className="text-slate-300 font-bold leading-relaxed line-clamp-5 text-sm">{transcription}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="mb-6 text-5xl">🎧</div>
                      <p className="text-slate-400 text-base font-black uppercase tracking-wide">
                        {micActive ? '🎤 Recording...' : '👆 Click Start'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-4 pt-6 px-6 pb-6 border-t border-slate-700/50 bg-gradient-to-r from-slate-900/50 to-blue-900/20">
                <div className="flex gap-4 w-full">
                  <Button
                    onClick={startMicTranscription}
                    disabled={!micSupported || micActive || !videoUrl}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-black h-13 text-sm shadow-xl hover:shadow-green-600/50 transition-all rounded-xl disabled:opacity-50 uppercase tracking-wider"
                  >
                    {micActive ? '⏸️ Recording' : '▶️ Start'}
                  </Button>
                  <Button
                    onClick={stopMicTranscription}
                    disabled={!micActive}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black h-13 text-sm shadow-xl hover:shadow-red-600/50 transition-all rounded-xl disabled:opacity-50 uppercase tracking-wider"
                  >
                    ⏹️ Stop
                  </Button>
                </div>
                {segments.length > 0 && (
                  <div className="flex gap-4 w-full pt-2">
                    <Button
                      onClick={() => downloadCaptions('txt')}
                      className="flex-1 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white text-xs font-black h-11 shadow-lg transition-all rounded-lg uppercase tracking-wider"
                    >
                      📥 TXT
                    </Button>
                    <Button
                      onClick={() => downloadCaptions('srt')}
                      className="flex-1 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white text-xs font-black h-11 shadow-lg transition-all rounded-lg uppercase tracking-wider"
                    >
                      📥 SRT
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default UploadVideo;
