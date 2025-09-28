
'use client';

import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';
import heartAnimation from '@/lib/animations/heart-lottie.json';

interface AnimatedLogoProps {
    className?: string;
    onClick?: () => void;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className, onClick }) => {
    return (
         <div className={cn("w-10 h-10 flex items-center justify-center cursor-pointer", className)} onClick={onClick}>
            <Lottie animationData={heartAnimation} loop={false} />
        </div>
    );
};

export default AnimatedLogo;

    