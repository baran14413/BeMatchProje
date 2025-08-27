
'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { User as UserIcon } from 'lucide-react';

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

    // Positioning logic for chairs around an elliptic table
    const angle = (index / SEAT_COUNT) * 2 * Math.PI;
    const tableWidth = 65; // %
    const tableHeight = 35; // %
    const top = 50 - Math.sin(angle) * (tableHeight + 10);
    const left = 50 + Math.cos(angle) * (tableWidth / 2 + 10);
    const rotation = -angle * (180 / Math.PI) + 90;

    return (
      <div
        key={index}
        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
        style={{
          top: `${top}%`,
          left: `${left}%`,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        }}
        onClick={() => handleSeatClick(index)}
      >
        <div className="relative w-16 h-20">
          {/* Chair Back */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-16 bg-yellow-800 rounded-t-lg shadow-md group-hover:bg-yellow-700 transition-colors"></div>
          {/* Chair Seat */}
          <div className="absolute bottom-0 left-0 w-16 h-8 bg-yellow-900 rounded-md shadow-lg"></div>
           {/* Avatar on Seat */}
          {isOccupied && (
            <div className="absolute inset-0 flex items-center justify-center">
                 <Avatar className="w-10 h-10 border-2 bg-background" style={{ transform: `rotate(${-rotation}deg)`}}>
                    <AvatarImage src={isCurrentUser ? currentUser.photoURL || '' : ''} />
                    <AvatarFallback>
                        <UserIcon className="w-5 h-5"/>
                    </AvatarFallback>
                </Avatar>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-green-900/40 relative overflow-hidden p-4">
        {/* Wooden floor effect */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-30"></div>
      
      <div className="relative w-[70vw] h-[50vh] max-w-4xl max-h-96">
        {/* Table */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[65%] h-[35%] 
                        bg-yellow-900 rounded-[50%] shadow-2xl border-4 border-yellow-950
                        bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-repeat">
            <div className="absolute inset-0 rounded-[50%] shadow-[inset_0_10px_20px_rgba(0,0,0,0.4)]"></div>
        </div>

        {/* Seats */}
        {seats.map((_, index) => renderSeat(index))}
      </div>
    </div>
  );
}

