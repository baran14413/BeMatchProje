
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

const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ 
    audioUrl, 
    isSender
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
        if (audio.duration > 0 && isFinite(audio.duration) && !isDragging) {
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
  }, [audioUrl, isDragging]);

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
  
  const handleSliderChange = (value: number[]) => {
      const audio = audioRef.current;
      if (audio && duration > 0) {
          const newTime = (value[0] / 100) * duration;
          audio.currentTime = newTime;
          setCurrentTime(newTime);
          setProgress(value[0]);
      }
  };

  const onSliderCommit = (value: number[]) => {
    handleSliderChange(value);
    setIsDragging(false);
    if (isPlaying) {
        audioRef.current?.play();
    }
  };

  const onSliderValueChange = (value: number[]) => {
    if (!isDragging) setIsDragging(true);
    setCurrentTime((value[0] / 100) * duration);
    setProgress(value[0]);
  }


  const togglePlaybackRate = () => {
    const rates = [1, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  };
  
  const playerColorClass = isSender ? 'bg-primary text-primary-foreground' : 'bg-card border';
  const sliderThumbColorClass = isSender ? 'border-primary-foreground' : 'border-primary';
  const sliderTrackColorClass = isSender ? 'bg-primary-foreground/30' : 'bg-secondary';
  const sliderRangeColorClass = isSender ? 'bg-primary-foreground' : 'bg-primary';

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
      
      <div className="flex-1 flex flex-col gap-1.5">
         <Slider 
            value={[progress]} 
            onValueChange={onSliderValueChange}
            onPointerDown={() => setIsDragging(true)}
            onPointerUp={() => { if (audioRef.current) handleSliderChange([progress]); setIsDragging(false); }}
            className="w-full h-2" 
            thumbClassName={cn("h-3 w-3", sliderThumbColorClass)}
            trackClassName={sliderTrackColorClass}
            rangeClassName={sliderRangeColorClass}
        />
        <div className="flex justify-between items-center">
            <span className="text-xs font-mono opacity-80">
            {formatTime(currentTime)} / {formatTime(duration)}
            </span>
             <button
                onClick={togglePlaybackRate}
                className="text-xs font-semibold rounded-md px-1.5 py-0.5"
            >
                {playbackRate}x
            </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
