
'use client';

import React, { useState, useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

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
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    // Her audioUrl değiştiğinde veya bileşen ilk yüklendiğinde yeni bir instance oluştur.
    // Önceki instance'ı temizle.
    if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
    }
    
    setIsLoading(true);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: isSender ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
      progressColor: isSender ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 40,
      cursorWidth: 0,
      url: audioUrl,
      normalize: true,
    });
    
    wavesurferRef.current = ws;

    ws.on('ready', () => {
      setDuration(ws.getDuration());
      setIsLoading(false);
    });

    ws.on('audioprocess', () => {
      setCurrentTime(ws.getCurrentTime());
    });
    
    ws.on('timeupdate', () => {
        setCurrentTime(ws.getCurrentTime());
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => {
        setIsPlaying(false);
        ws.seekTo(0);
        setCurrentTime(0);
    });
    
    ws.on('error', (err) => {
        console.error("Wavesurfer error:", err);
        setIsLoading(false);
    })

    // Component unmount olduğunda temizlik yap.
    return () => {
      ws.destroy();
    };
  }, [audioUrl, isSender]); // audioUrl veya isSender değiştiğinde useEffect'i tekrar çalıştır.

  useEffect(() => {
      if (wavesurferRef.current) {
          wavesurferRef.current.setPlaybackRate(playbackRate, true);
      }
  }, [playbackRate]);


  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };
  
  const handleSetPlaybackRate = (rate: number) => {
      setPlaybackRate(rate);
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
           disabled={isLoading}
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
        onClick={handlePlayPause}
        disabled={isLoading}
        className={cn("h-10 w-10 rounded-full", isSender ? "hover:bg-white/20" : "hover:bg-black/10")}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </Button>
      <div className="flex-1">
        <div ref={containerRef} style={{ minHeight: '40px' }} className="w-full">
            {isLoading && (
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
