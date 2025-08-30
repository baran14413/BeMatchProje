
'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Textarea } from './textarea';
import { Input } from './input';
import { UserSuggestion, HashtagSuggestion, SuggestionList } from './user-suggestion';
import { useUserSuggestions } from '@/hooks/use-user-suggestions';
import { useHashtagSuggestions } from '@/hooks/use-hashtag-suggestions';
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

type SuggestionType = 'user' | 'hashtag' | null;

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
  const [suggestionType, setSuggestionType] = useState<SuggestionType>(null);

  const { suggestions: userSuggestions, loading: userLoading } = useUserSuggestions(suggestionType === 'user' ? mentionQuery : null);
  const { suggestions: hashtagSuggestions, loading: hashtagLoading } = useHashtagSuggestions(suggestionType === 'hashtag' ? mentionQuery : null);

  const textareaRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
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
      const mentionMatch = textBeforeCursor.match(/(?:^|\s)([@#])(\w*)$/);
      
      if (mentionMatch) {
        setSuggestionType(mentionMatch[1] === '@' ? 'user' : 'hashtag');
        setMentionQuery(mentionMatch[2]);
        setShowSuggestions(true);
      } else {
        setSuggestionType(null);
        setMentionQuery(null);
        setShowSuggestions(false);
      }
    };

    handleValueChange();
  }, [value]);

  const handleSuggestionClick = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
     if (cursorPos === null) return;
     
    const textBeforeCursor = value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/(?:^|\s)([@#])(\w*)$/);

    if (mentionMatch) {
      const mentionChar = mentionMatch[1]; // @ or #
      const startIndex = mentionMatch.index === 0 ? 0 : (mentionMatch.index || 0) + 1;
      const newValue = `${value.substring(0, startIndex)}${mentionChar}${textToInsert} ${value.substring(cursorPos)}`;
      setValue(newValue);
      
      // Move cursor after the inserted username
      setTimeout(() => {
          const newCursorPos = startIndex + textToInsert.length + 2;
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
    
    setShowSuggestions(false);
    setMentionQuery(null);
    setSuggestionType(null);
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

  const isLoading = userLoading || hashtagLoading;
  const hasSuggestions = suggestionType === 'user' ? userSuggestions.length > 0 : hashtagSuggestions.length > 0;

  return (
    <div className="relative w-full">
      <Component {...inputProps} />
      
      {showSuggestions && (
        <div className="absolute bottom-full left-0 w-full mb-2 z-10">
            <SuggestionList>
                 {isLoading ? (
                    <div className='flex items-center justify-center p-2 text-sm text-muted-foreground'>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Yükleniyor...
                    </div>
                ) : hasSuggestions ? (
                    <>
                        {suggestionType === 'user' && userSuggestions.map((user) => (
                            <UserSuggestion
                                key={user.uid}
                                user={user}
                                onClick={() => handleSuggestionClick(user.username)}
                            />
                        ))}
                        {suggestionType === 'hashtag' && hashtagSuggestions.map((hashtag) => (
                            <HashtagSuggestion
                                key={hashtag.tag}
                                hashtag={hashtag}
                                onClick={() => handleSuggestionClick(hashtag.tag)}
                            />
                        ))}
                    </>
                 ) : (
                    <p className='p-2 text-sm text-center text-muted-foreground'>Sonuç bulunamadı.</p>
                 )}
            </SuggestionList>
        </div>
      )}
    </div>
  );
};
