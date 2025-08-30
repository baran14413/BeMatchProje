
'use client';

import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';

interface AnimatedLogoProps {
    className?: string;
    onClick?: () => void;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className, onClick }) => {
    return (
         <div className={cn("w-10 h-10 flex items-center justify-center cursor-pointer", className)} onClick={onClick}>
            <span className='text-3xl animate-pulse-heart-sm inline-block bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent'>❤️</span>
        </div>
    );
};

export default AnimatedLogo;
