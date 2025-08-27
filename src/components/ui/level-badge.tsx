
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
  sm: 'w-10 h-7',
  md: 'w-12 h-8',
  lg: 'w-16 h-10',
  xl: 'w-24 h-14',
};

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, size = 'md', className, showTooltip = true }) => {
  
  const { svg: baseSvg, textY, textFontSize, textColor } = getBadgeSvgForLevel(level);
  
  const textContent = level >= 100 ? 'Seviye 100' : `${level}`;

  // Inject the level number into the SVG string
  const finalSvg = baseSvg.replace(
      '</svg>', 
      `<text
          x="50%"
          y="${textY}"
          dominant-baseline="middle"
          text-anchor="middle"
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
          font-size="${textFontSize}"
          font-weight="bold"
          fill="${textColor}"
          stroke="${level >= 90 && level < 100 ? 'black' : 'none'}"
          stroke-width="0.2"
      >
          ${textContent}
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
