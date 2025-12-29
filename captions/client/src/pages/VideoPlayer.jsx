import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';

const VideoPlayer = ({ src, captions = [] }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const [fontSize, setFontSize] = useState([24]);
  const [captionColor, setCaptionColor] = useState('white');
  const [bgColor, setBgColor] = useState('rgba(0,0,0,0.7)');
  const [currentCaption, setCurrentCaption] = useState('');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const subtitle = captions.find(sub => video.currentTime >= sub.start && video.currentTime <= sub.end);
      setCurrentCaption(subtitle ? subtitle.text : '');
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [captions]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (value) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
    }
  };

  const handleSeek = (value) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="container mx-auto h-[calc(100vh-6rem)] flex flex-col py-4">
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-4">
           <div className="relative bg-black rounded-lg overflow-hidden flex-1 group">
              <video 
                ref={videoRef}
                className="w-full h-full object-contain"
                src={src}
                onClick={togglePlay}
              />
              
              <div className="absolute bottom-16 left-0 right-0 text-center pointer-events-none p-4">
                {currentCaption && (
                  <span 
                    style={{ 
                      color: captionColor, 
                      backgroundColor: bgColor,
                      fontSize: `${fontSize[0]}px`,
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    {currentCaption}
                  </span>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Slider 
                   value={[currentTime]} 
                   max={duration} 
                   step={0.1} 
                   onValueChange={handleSeek}
                   className="mb-4"
                 />
                 <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                      <button onClick={togglePlay}>
                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                      </button>
                      <div className="flex items-center gap-2 group/volume">
                         <button onClick={toggleMute}>
                           {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                         </button>
                         <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300">
                            <Slider 
                              value={[isMuted ? 0 : volume]} 
                              max={1} 
                              step={0.1} 
                              onValueChange={handleVolumeChange}
                            />
                         </div>
                      </div>
                      <span className="text-sm">{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                    <button>
                      <Maximize className="h-6 w-6" />
                    </button>
                 </div>
              </div>
           </div>
        </div>

        <Card className="col-span-12 lg:col-span-3 h-full overflow-y-auto">
           <div className="p-6 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-lg border-b pb-4">
                <Settings className="h-5 w-5" /> Caption Settings
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <Slider 
                    value={fontSize} 
                    onValueChange={setFontSize} 
                    min={16} 
                    max={48} 
                    step={2} 
                  />
                  <div className="text-right text-sm text-muted-foreground">{fontSize}px</div>
                </div>

                <div className="space-y-2">
                   <Label>Text Color</Label>
                   <Select value={captionColor} onValueChange={setCaptionColor}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="white">White</SelectItem>
                        <SelectItem value="yellow">Yellow</SelectItem>
                        <SelectItem value="#00ffff">Cyan</SelectItem>
                        <SelectItem value="#ff00ff">Magenta</SelectItem>
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                   <Label>Background Opacity</Label>
                   <Select value={bgColor} onValueChange={setBgColor}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rgba(0,0,0,0)">None</SelectItem>
                        <SelectItem value="rgba(0,0,0,0.5)">Low</SelectItem>
                        <SelectItem value="rgba(0,0,0,0.7)">Medium</SelectItem>
                        <SelectItem value="rgba(0,0,0,1)">High (Solid)</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
};

export default VideoPlayer;
