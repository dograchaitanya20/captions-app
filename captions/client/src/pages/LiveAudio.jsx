import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Mic, MicOff, Settings2, Trash2, Download } from 'lucide-react';

const LiveAudio = () => {
  const [isListening, setIsListening] = useState(false);
  const [captions, setCaptions] = useState([]);
  const [language, setLanguage] = useState('en-US');
  const [simplify, setSimplify] = useState(false);
  const [fontSize, setFontSize] = useState([24]);
  const [highContrast, setHighContrast] = useState(true);
  
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setCaptions((prev) => [...prev, finalTranscript]);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current?.start();
        }
      };
    } else {
      alert('Browser does not support Speech Recognition.');
    }
  }, [language]); 

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const clearCaptions = () => {
    setCaptions([]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [captions]);

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12">
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-white">Live Audio</h1>
            <p className="text-slate-400 mt-1">Real-time speech-to-text captions</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant={isListening ? "destructive" : "default"} 
              onClick={toggleListening} 
              className={isListening 
                ? "px-8 py-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black rounded-xl shadow-xl h-14 uppercase tracking-wider" 
                : "px-8 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black rounded-xl shadow-xl h-14 uppercase tracking-wider"
              }
            >
              {isListening ? <><MicOff className="mr-3 h-5 w-5" /> Stop</> : <><Mic className="mr-3 h-5 w-5" /> Start</>}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
         
          <Card className="col-span-12 md:col-span-4 h-full overflow-y-auto bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white"><Settings2 className="h-5 w-5" /> Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white font-semibold">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="hi-IN">Hindi</SelectItem>
                    <SelectItem value="ta-IN">Tamil</SelectItem>
                    <SelectItem value="te-IN">Telugu</SelectItem>
                    <SelectItem value="kn-IN">Kannada</SelectItem>
                    <SelectItem value="ml-IN">Malayalam</SelectItem>
                    <SelectItem value="bn-IN">Bengali</SelectItem>
                    <SelectItem value="gu-IN">Gujarati</SelectItem>
                    <SelectItem value="mr-IN">Marathi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="simplify-mode" className="text-white font-semibold">Simplify Captions</Label>
                <Switch id="simplify-mode" checked={simplify} onCheckedChange={setSimplify} />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="high-contrast" className="text-white font-semibold">High Contrast</Label>
                <Switch id="high-contrast" checked={highContrast} onCheckedChange={setHighContrast} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-white font-semibold">Font Size</Label>
                  <span className="text-sm text-zinc-400">{fontSize}px</span>
                </div>
                <Slider 
                  value={fontSize} 
                  onValueChange={setFontSize} 
                  max={48} 
                  min={16} 
                  step={2} 
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button variant="outline" className="w-full bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800" onClick={clearCaptions}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear History
              </Button>
              <Button variant="secondary" className="w-full bg-zinc-800 hover:bg-zinc-700 text-white">
                <Download className="mr-2 h-4 w-4" /> Save Transcript
              </Button>
            </CardFooter>
          </Card>

          <Card className="col-span-12 md:col-span-8 flex flex-col h-full bg-black border-zinc-800">
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4" style={{ backgroundColor: highContrast ? 'black' : 'transparent' }}>
              {captions.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-500 italic">
                  Click Start to begin listening...
                </div>
              ) : (
                captions.map((text, index) => (
                  <p 
                    key={index} 
                    className="transition-all duration-300 ease-in-out"
                    style={{ 
                      fontSize: `${fontSize[0]}px`,
                      color: highContrast ? 'yellow' : 'white',
                      backgroundColor: highContrast ? 'rgba(0,0,0,0.8)' : 'transparent',
                      padding: highContrast ? '0.5rem' : '0',
                      borderRadius: '0.25rem',
                      lineHeight: 1.5
                    }}
                  >
                    {text}
                  </p>
                ))
              )}
              <div ref={messagesEndRef} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveAudio;
