import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileAudio, CheckCircle, Download, AlertCircle, Volume2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { API_BASE_URL } from '@/config';

const UploadAudio = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribed, setTranscribed] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [error, setError] = useState('');
  
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setTranscribed(false);
      setTranscription('');
      setError('');
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in first');
      return;
    }

    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/transcribe/audio`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setProgress(percentCompleted);
          },
        }
      );

      setProgress(100);
      setUploading(false);
      
      const uploadedFileUrl = `${API_BASE_URL}${response.data.fileUrl}`;
      startBrowserTranscription(uploadedFileUrl, response.data.fileName);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Make sure the backend is running.');
      setUploading(false);
    }
  };

  const startBrowserTranscription = (audioUrl, fileName) => {
    setTranscribing(true);
    setError('');
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setError('Speech Recognition not supported in this browser. Please use Chrome or Edge.');
      setTranscribing(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = language;

    let fullTranscript = '';

    recognitionRef.current.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          fullTranscript += event.results[i][0].transcript + ' ';
          setTranscription(fullTranscript.trim());
        }
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Transcription error: ${event.error}`);
      setTranscribing(false);
    };

    recognitionRef.current.onend = () => {
      setTranscribing(false);
      if (fullTranscript.trim()) {
        setTranscribed(true);
        saveTranscription(fileName, fullTranscript.trim());
      }
    };
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().then(() => {
        recognitionRef.current?.start();
      }).catch(err => {
        setError('Failed to play audio: ' + err.message);
        setTranscribing(false);
      });

      audioRef.current.onended = () => {
        recognitionRef.current?.stop();
      };
    }
  };

  const saveTranscription = async (fileName, transcript) => {
    console.log('[AUDIO] Saving transcription:', { fileName, length: transcript.length });
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('[AUDIO] No token available');
        return;
      }
      const response = await axios.post(
        `${API_BASE_URL}/api/transcribe/save`,
        {
          fileName,
          transcription: transcript,
          type: 'audio',
          language,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      console.log('[AUDIO] Transcription saved successfully:', response.data);
    } catch (err) {
      console.error('[AUDIO] Failed to save transcription:', err.response?.data || err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2 text-white">Upload Audio</h1>
          <p className="text-slate-400">Upload and transcribe audio files to text</p>
        </div>
        
        <div className="grid gap-8">
          <Card className="bg-slate-900 border border-slate-800">
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="text-white text-xl font-semibold">Select Audio File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-colors">
                <input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                  id="audio-upload" 
                />
                <label htmlFor="audio-upload" className="flex flex-col items-center cursor-pointer w-full">
                  {file ? (
                    <>
                      <FileAudio className="h-12 w-12 text-white mb-4" />
                      <p className="text-lg font-medium text-white">{file.name}</p>
                      <p className="text-sm text-zinc-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-zinc-500 mb-4" />
                      <p className="text-lg font-medium text-white">Click to upload or drag and drop</p>
                      <p className="text-sm text-zinc-400">MP3, WAV, M4A (Max 100MB)</p>
                    </>
                  )}
                </label>
              </div>

              <div className="space-y-2">
                <Label className="text-white font-semibold">Source Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="hi-IN">Hindi</SelectItem>
                    <SelectItem value="es-ES">Spanish</SelectItem>
                    <SelectItem value="fr-FR">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Volume2 className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-zinc-300">
                    <p className="font-semibold mb-1 text-white">Browser-Based Transcription</p>
                    <p className="text-zinc-400">This uses your browser's Web Speech API. The audio will play automatically during transcription. Make sure your speakers are on or use headphones.</p>
                  </div>
                </div>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white">Uploading...</span>
                    <span className="text-zinc-400">{progress}%</span>
                  </div>
                  <Progress value={progress} className="bg-zinc-800" />
                </div>
              )}

              {transcribing && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white">
                    <div className="animate-pulse">🎤</div>
                    <span>Transcribing audio... (listening to playback)</span>
                  </div>
                  <Progress value={100} className="animate-pulse bg-zinc-800" />
                </div>
              )}

              {error && (
                <div className="bg-red-950/50 border border-red-900 text-red-200 px-4 py-3 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Transcription Error</p>
                    <p className="text-xs mt-1">{error}</p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleUpload} 
                disabled={!file || uploading || transcribing || transcribed} 
                className="w-full bg-white hover:bg-zinc-100 text-black font-semibold"
              >
                {uploading ? 'Uploading...' : transcribing ? 'Transcribing...' : transcribed ? 'Completed' : 'Upload & Transcribe'}
              </Button>
            </CardFooter>
          </Card>

          {transcription && (
            <Card className="animate-in fade-in slide-in-from-bottom-4 bg-zinc-950 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  {transcribed ? <CheckCircle className="h-5 w-5 text-green-500" /> : <div className="animate-pulse">📝</div>}
                  {transcribed ? 'Transcription Complete' : 'Transcribing...'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-zinc-900 text-white p-4 rounded-md whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {transcription}
                </div>
              </CardContent>
              {transcribed && (
                <CardFooter className="flex gap-4">
                  <Button variant="outline" className="flex-1 bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800" onClick={() => {
                    const blob = new Blob([transcription], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'transcription.txt';
                    a.click();
                  }}>
                    <Download className="mr-2 h-4 w-4" /> Download TXT
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
        </div>
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
};

export default UploadAudio;
