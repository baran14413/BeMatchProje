
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  isSender: boolean;
}

const formatTime = (seconds: number | undefined) => {
  if (seconds === undefined || !isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// A simple, static waveform-like SVG for visual flair.
// In a real-world scenario, this could be generated from the audio data.
const Waveform = ({ progress, isSender }: { progress: number, isSender: boolean }) => {
    const bars = Array.from({ length: 30 }, (_, i) => {
        const height = Math.sin((i / 30) * Math.PI) * 80 + 20; // Simple sine wave for visual effect
        return { y: (100 - height) / 2, height };
    });
    
    const activeColor = isSender ? 'hsl(var(--primary-foreground))' : 'hsl(var(--primary))';
    const inactiveColor = isSender ? 'hsla(var(--primary-foreground), 0.4)' : 'hsl(var(--muted-foreground), 0.4)';

    return (
        <svg width="100%" height="40" viewBox="0 0 150 40" preserveAspectRatio="none" className="w-full h-10">
        <g>
            {bars.map((bar, i) => (
            <rect
                key={i}
                x={i * 5}
                y={bar.y * 0.4}
                width="2"
                height={bar.height * 0.4}
                rx="1"
                fill={i / bars.length * 100 < progress ? activeColor : inactiveColor}
                className="transition-colors duration-100"
            />
            ))}
        </g>
        </svg>
    );
};


const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ 
    audioUrl, 
    isSender
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
        if (audio.duration > 0 && isFinite(audio.duration)) {
            setProgress((audio.currentTime / audio.duration) * 100);
            setCurrentTime(audio.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration)) {
          setDuration(audio.duration);
      } else {
          setDuration(0);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => console.error("Error playing audio:", e));
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const waveformContainer = waveformContainerRef.current;
    if (!audio || !waveformContainer || duration === 0) return;

    const rect = waveformContainer.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    
    const newTime = (percentage / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(percentage);
  };

  const togglePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent seek
    const rates = [1, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  };
  
  const playerColorClass = isSender ? 'bg-primary text-primary-foreground' : 'bg-card border';

  return (
    <div className={cn('flex w-full items-center gap-2 p-2 rounded-xl', playerColorClass)}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <Button
        size="icon"
        variant="ghost"
        onClick={togglePlayPause}
        className={cn(
          "h-10 w-10 rounded-full shrink-0",
          isSender ? "hover:bg-white/20" : "hover:bg-black/10"
        )}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
      </Button>
      
      <div className="flex-1 flex flex-col gap-1 w-full overflow-hidden">
        <div 
            ref={waveformContainerRef}
            className="w-full cursor-pointer"
            onClick={handleSeek}
        >
            <Waveform progress={progress} isSender={isSender} />
        </div>
        <div className="flex justify-between items-center px-1">
            <span className="text-xs font-mono opacity-80">
                {formatTime(currentTime)}
            </span>
            <span className="text-xs font-mono opacity-80">
                {formatTime(duration)}
            </span>
        </div>
      </div>
       <Button
          variant="ghost"
          size="sm"
          onClick={togglePlaybackRate}
          className={cn(
              "h-8 w-12 rounded-full shrink-0 text-xs font-bold",
               isSender ? "hover:bg-white/20" : "hover:bg-black/10"
          )}
      >
          {playbackRate}x
      </Button>
    </div>
  );
};

export default VoiceMessagePlayer;
