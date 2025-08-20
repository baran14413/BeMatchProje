
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  isSender: boolean;
  authorImageUrl?: string;
  authorName?: string;
  isPreview?: boolean;
}

const formatTime = (seconds: number | undefined) => {
  if (seconds === undefined || isNaN(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ 
    audioUrl, 
    isSender,
    authorImageUrl,
    authorName,
    isPreview = false
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
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

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const playerColorClass = isSender || isPreview ? 'bg-primary text-primary-foreground' : 'bg-card border';

  return (
    <div className={cn('flex w-full items-center gap-3 p-2 rounded-xl', playerColorClass)}>
      {!isPreview && (
        <Avatar className="h-10 w-10">
          <AvatarImage src={authorImageUrl} />
          <AvatarFallback>{authorName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
      )}
      <Button
        size="icon"
        variant="ghost"
        onClick={handlePlayPause}
        className={cn(
          "h-10 w-10 rounded-full",
          isSender || isPreview ? "hover:bg-white/20" : "hover:bg-black/10"
        )}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </Button>
      <div className="flex-1 space-y-1">
        <Progress value={progress} className={cn("h-1.5", isSender || isPreview ? "bg-primary-foreground/30" : "bg-secondary")} indicatorClassName={cn(isSender || isPreview ? "bg-primary-foreground" : "bg-primary")} />
        <div className="text-xs font-mono opacity-80">
          {formatTime(duration)}
        </div>
      </div>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
    </div>
  );
};

export default VoiceMessagePlayer;
