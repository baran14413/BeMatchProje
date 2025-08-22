
'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Textarea } from './textarea';
import { Input } from './input';
import { UserSuggestion, UserSuggestionList } from './user-suggestion';
import { useUserSuggestions } from '@/hooks/use-user-suggestions';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface MentionTextareaProps {
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isInput?: boolean;
  onEnterPress?: () => void;
}

export const MentionTextarea: React.FC<MentionTextareaProps> = ({
  value,
  setValue,
  placeholder,
  className,
  disabled,
  isInput = false,
  onEnterPress
}) => {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const { suggestions, loading } = useUserSuggestions(mentionQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (onEnterPress && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnterPress();
    }
  };

  useEffect(() => {
    const handleValueChange = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart;
      if (cursorPos === null) return;
      
      const textBeforeCursor = value.substring(0, cursorPos);
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
      
      if (mentionMatch) {
        setMentionQuery(mentionMatch[1]);
        setShowSuggestions(true);
      } else {
        setMentionQuery(null);
        setShowSuggestions(false);
      }
    };

    handleValueChange();
  }, [value]);

  const handleSuggestionClick = (username: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
     if (cursorPos === null) return;
     
    const textBeforeCursor = value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const startIndex = mentionMatch.index || 0;
      const newValue = `${value.substring(0, startIndex)}@${username} ${value.substring(cursorPos)}`;
      setValue(newValue);
      
      // Move cursor after the inserted username
      setTimeout(() => {
          const newCursorPos = startIndex + username.length + 2;
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
    
    setShowSuggestions(false);
    setMentionQuery(null);
  };
  
  const Component = isInput ? Input : Textarea;
  const inputProps = {
    ref: textareaRef as any,
    placeholder: placeholder,
    className: isInput ? cn("bg-muted border-none rounded-full px-4 pr-10", className) : className,
    value: value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(e.target.value),
    onKeyDown: onEnterPress ? handleKeyDown : undefined,
    disabled: disabled,
  };

  return (
    <div className="relative w-full">
      <Component {...inputProps} />
      
      {showSuggestions && (
        <div className="absolute bottom-full left-0 w-full mb-2 z-10">
            <UserSuggestionList>
                 {loading ? (
                    <div className='flex items-center justify-center p-2 text-sm text-muted-foreground'>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Yükleniyor...
                    </div>
                ) : suggestions.length > 0 ? (
                    suggestions.map((user) => (
                        <UserSuggestion
                            key={user.uid}
                            user={user}
                            onClick={() => handleSuggestionClick(user.username)}
                        />
                    ))
                 ) : (
                    <p className='p-2 text-sm text-center text-muted-foreground'>Kullanıcı bulunamadı.</p>
                 )}
            </UserSuggestionList>
        </div>
      )}
    </div>
  );
};
