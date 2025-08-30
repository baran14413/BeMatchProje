
'use client';

import Lottie from 'lottie-react';
import animationData from '@/lib/animations/loaderemir.json';
import { cn } from '@/lib/utils';

interface AnimatedLogoProps {
    className?: string;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className }) => {
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    return (
        <div className={cn("w-10 h-10", className)}>
            <Lottie {...defaultOptions} />
        </div>
    );
};

export default AnimatedLogo;
