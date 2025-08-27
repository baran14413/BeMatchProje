
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getBadgeSvgForLevel } from '@/lib/xp-config';

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

// Colors for text fill, not used in SVG directly anymore but kept for reference
const getColorsForLevel = (level: number): string => {
  if (level >= 100) return '#000000'; // Black for legendary
  if (level >= 90) return '#003366'; // Dark blue for diamond
  if (level >= 50) return '#FFFFFF'; // White for ruby
  return '#000000'; // Black for others
};

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, size = 'md', className, showTooltip = true }) => {
  const textColor = getColorsForLevel(level);
  
  // Get the base SVG structure from the config file
  const baseSvg = getBadgeSvgForLevel(level);
  
  // Inject the level number and text color into the SVG string
  const finalSvg = baseSvg.replace(
      '</svg>', 
      `<text
          x="50"
          y="${level >= 100 ? '62' : '65'}"
          font-family="Arial, sans-serif"
          font-size="${level >= 100 ? '40' : '45'}"
          font-weight="bold"
          fill="${textColor}"
          text-anchor="middle"
          stroke="${level >= 100 ? 'black' : 'none'}"
          stroke-width="${level >= 100 ? '0.5' : '0'}"
      >
          ${level}
      </text>
      </svg>`
  );

  const badgeContent = (
      <div 
          className={cn(sizeClasses[size], className)}
          dangerouslySetInnerHTML={{ __html: finalSvg }}
      />
  );
  
   if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild><div tabIndex={0}>{badgeContent}</div></TooltipTrigger>
          <TooltipContent>
            <p>Seviye {level}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeContent;
};
