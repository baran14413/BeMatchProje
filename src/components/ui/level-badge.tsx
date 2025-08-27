'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-24 h-24',
};

const getColorsForLevel = (level: number): [string, string, string] => {
  if (level >= 100) return ['#FFD700', '#FFC400', '#FFFFFF']; // Gold, White
  if (level >= 90) return ['#E5E4E2', '#C0C0C0', '#FFFFFF']; // Platinum, Silver
  if (level >= 80) return ['#B9F2FF', '#99EEFF', '#003366']; // Diamond
  if (level >= 70) return ['#7FFFD4', '#50C878', '#005522']; // Emerald
  if (level >= 60) return ['#B768A2', '#9932CC', '#FFFFFF']; // Amethyst
  if (level >= 50) return ['#FF6347', '#FF4500', '#FFFF00']; // Ruby/Orange
  if (level >= 40) return ['#00BFFF', '#1E90FF', '#FFFFFF']; // Deep Sky Blue
  if (level >= 30) return ['#A1CAF1', '#87CEEB', '#00008B']; // Sapphire
  if (level >= 20) return ['#C0C0C0', '#A9A9A9', '#FFFFFF']; // Silver
  if (level >= 10) return ['#CD7F32', '#B87333', '#FFFFFF']; // Bronze
  return ['#A9A9A9', '#808080', '#FFFFFF']; // Iron/Grey
};

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, size = 'md', className, showTooltip = true }) => {
  const [color1, color2, textColor] = getColorsForLevel(level);

  const badgeContent = (
      <svg
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(sizeClasses[size], className)}
      >
          <defs>
              <linearGradient id={`grad-${color1}-${color2}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: color1, stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: color2, stopOpacity: 1 }} />
              </linearGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                  </feMerge>
              </filter>
          </defs>

          {/* Base shape */}
          <path
              d={
                  level >= 100 ? "M50 2 L98 25 L98 75 L50 98 L2 75 L2 25 Z" // Hexagon for level 100
                : level >= 50 ? "M50 2 L90 50 L50 98 L10 50 Z" // Diamond for 50+
                : "M50,2 L90,98 L10,98 Z" // Triangle for others
              }
              fill={`url(#grad-${color1}-${color2})`}
              stroke={level >= 90 ? color1 : "none"}
              strokeWidth={level >= 90 ? "2" : "0"}
              filter={level >= 90 ? "url(#glow)" : "none"}
          />
          
          {/* Inner accent shape */}
          {level >= 20 && (
            <path
                d={
                    level >= 100 ? "M50 10 L89 30 L89 70 L50 90 L11 70 L11 30 Z"
                  : level >= 50 ? "M50 12 L80 50 L50 88 L20 50 Z"
                  : "M50,15 L80,92 L20,92 Z"
                }
                fill="none"
                stroke={textColor}
                strokeWidth="1.5"
                opacity="0.5"
            />
          )}

          {/* Level Text */}
          <text
              x="50"
              y="58"
              fontFamily="Arial, sans-serif"
              fontSize={level >= 100 ? "40" : "45"}
              fontWeight="bold"
              fill={textColor}
              textAnchor="middle"
              stroke={level >= 100 ? "black" : "none"}
              strokeWidth={level >= 100 ? "1" : "0"}
          >
              {level}
          </text>
      </svg>
  );
  
   if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent>
            <p>Seviye {level}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeContent;
};
