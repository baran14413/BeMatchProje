
'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export type SuggestedUser = {
  uid: string;
  name: string;
  username: string;
  avatarUrl: string;
};

interface UserSuggestionProps {
  user: SuggestedUser;
  onClick: () => void;
}

export const UserSuggestion: React.FC<UserSuggestionProps> = ({ user, onClick }) => {
  return (
    <li
      className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer"
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()} // Prevents textarea from losing focus
    >
      <Avatar className="w-8 h-8 mr-3">
        <AvatarImage src={user.avatarUrl} alt={user.name} />
        <AvatarFallback>{user.name?.[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <p className="font-semibold truncate text-sm">{user.name}</p>
        <p className="text-muted-foreground truncate text-xs">@{user.username}</p>
      </div>
    </li>
  );
};


interface UserSuggestionListProps {
    children: React.ReactNode;
}

export const UserSuggestionList: React.FC<UserSuggestionListProps> = ({ children }) => {
    return (
        <div className='max-h-60 w-full overflow-y-auto bg-background border rounded-lg shadow-lg'>
            <ul className='p-1'>
                {children}
            </ul>
        </div>
    )
}
