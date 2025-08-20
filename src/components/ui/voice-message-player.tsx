
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWavesurfer } from 'wavesurfer-react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';
import type WaveSurfer from 'wavesurfer.js';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  isSender: boolean;
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ audioUrl, isSender }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const onReady = useCallback((ws: WaveSurfer) => {
    setWavesurfer(ws);
    setDuration(ws.getDuration());
    setIsPlaying(false);
  }, []);
  
  const onPlayPause = useCallback(() => {
    wavesurfer?.playPause();
  }, [wavesurfer]);
  
  const onTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);
  
  const onFinish = useCallback(() => {
    setIsPlaying(false);
  }, []);
  
   useWavesurfer({
    container: containerRef,
    url: audioUrl,
    waveColor: isSender ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
    progressColor: isSender ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
    barWidth: 2,
    barGap: 2,
    barRadius: 2,
    height: 40,
    cursorWidth: 0,
    autoplay: false,
    normalize: true,
    onReady: onReady,
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onFinish: onFinish,
    onTimeupdate: onTimeUpdate,
  });

  useEffect(() => {
     if(wavesurfer) {
         wavesurfer.setPlaybackRate(playbackRate);
     }
  }, [playbackRate, wavesurfer]);
  
  const handleSetPlaybackRate = (rate: number) => {
      if(wavesurfer) {
        setPlaybackRate(rate);
      }
  }
  
  const PlaybackRateButton = ({rate}: {rate: number}) => (
      <Button 
          size="sm" 
          variant="ghost" 
          className={cn(
              "h-6 w-10 text-xs rounded-full", 
              playbackRate === rate && "bg-primary/20",
              isSender ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20" : "text-foreground/80 hover:text-foreground hover:bg-black/10"
           )}
           onClick={() => handleSetPlaybackRate(rate)}
           disabled={!wavesurfer}
        >
            {rate}x
       </Button>
  );

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-xl',
        isSender ? 'bg-primary text-primary-foreground' : 'bg-card border'
      )}
    >
      <Button
        size="icon"
        variant="ghost"
        onClick={onPlayPause}
        disabled={!wavesurfer}
        className={cn("h-10 w-10 rounded-full", isSender ? "hover:bg-white/20" : "hover:bg-black/10")}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </Button>
      <div className="flex-1">
        <div ref={containerRef} style={{ minHeight: '40px' }} className="w-full">
            {!wavesurfer && (
                 <div className="h-10 flex items-center">
                    <Skeleton className={cn("w-full h-2 rounded-full", isSender ? "bg-white/30" : "bg-muted-foreground/30")}/>
                 </div>
            )}
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div className="flex gap-1">
              <PlaybackRateButton rate={1} />
              <PlaybackRateButton rate={1.5} />
              <PlaybackRateButton rate={2} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
