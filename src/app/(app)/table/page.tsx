
'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { User as UserIcon, Sofa } from 'lucide-react';

const SEAT_COUNT = 7;

export default function TablePage() {
  const currentUser = auth.currentUser;
  const [seats, setSeats] = useState<(string | null)[]>(new Array(SEAT_COUNT).fill(null));

  const handleSeatClick = (index: number) => {
    setSeats(prevSeats => {
      const newSeats = [...prevSeats];
      // Check if user is already seated
      const userSeatIndex = newSeats.indexOf(currentUser?.uid || '');
      
      if (userSeatIndex !== -1) { // User is seated
        if (userSeatIndex === index) { // Clicked their own seat to stand up
          newSeats[index] = null;
        }
        // If they click another seat while already seated, do nothing for now
      } else { // User is not seated
        if (newSeats[index] === null) { // Seat is empty
          newSeats[index] = currentUser?.uid || null;
        }
      }
      return newSeats;
    });
  };

  const renderSeat = (index: number) => {
    const isOccupied = seats[index] !== null;
    const isCurrentUser = isOccupied && seats[index] === currentUser?.uid;

    const angle = (index / SEAT_COUNT) * 2 * Math.PI + Math.PI / 2; // Offset to start from top
    const circleRadius = 38; // Percentage of parent width/height
    const top = 50 - Math.sin(angle) * circleRadius;
    const left = 50 - Math.cos(angle) * circleRadius;
    const rotation = angle * (180 / Math.PI) + 180;

    return (
      <div
        key={index}
        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
        style={{
          top: `${top}%`,
          left: `${left}%`,
          transform: `translate(-50%, -50%)`,
        }}
        onClick={() => handleSeatClick(index)}
      >
        <div className="relative w-16 h-16 sm:w-20 sm:h-20" style={{ transform: `rotate(${rotation}deg)`}}>
            {/* Chair using Sofa icon for better look */}
            <Sofa className={cn(
                "w-full h-full text-yellow-800 drop-shadow-lg transition-transform group-hover:scale-110",
                isCurrentUser && "text-purple-600"
            )} strokeWidth={1.5}/>
           
           {/* Avatar on Seat */}
          {isOccupied && (
            <div className="absolute inset-0 flex items-center justify-center pb-2">
                 <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 bg-background" style={{ transform: `rotate(${-rotation}deg)`}}>
                    <AvatarImage src={isCurrentUser ? currentUser?.photoURL || '' : ''} />
                    <AvatarFallback>
                        <UserIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
                    </AvatarFallback>
                </Avatar>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-800 relative overflow-hidden p-4">
        {/* Wooden floor effect */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-plank.png')] bg-repeat opacity-20"></div>
      
      {/* The Room */}
      <div className="relative w-[95vw] h-[95vh] sm:w-[80vw] sm:h-[80vh] max-w-5xl max-h-[800px]">

        {/* Circular Rug */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] 
                        bg-red-900/70 rounded-full shadow-2xl border-4 border-yellow-700
                        flex items-center justify-center
                        bg-[url('https://www.transparenttextures.com/patterns/az-subtle.png')] bg-repeat">
             <div className="absolute inset-0 rounded-full shadow-[inset_0_0_80px_rgba(0,0,0,0.6)]"></div>
             {/* Rug center detail */}
             <div className="w-1/4 h-1/4 rounded-full border-2 border-yellow-600/50"></div>
        </div>

        {/* Seats */}
        {seats.map((_, index) => renderSeat(index))}
      </div>
    </div>
  );
}
