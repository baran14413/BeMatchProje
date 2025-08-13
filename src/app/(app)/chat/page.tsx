'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizonal, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const mockConversations = [
  {
    id: 1,
    name: 'Elif',
    avatar: 'https://placehold.co/40x40.png',
    aiHint: 'woman portrait',
    messages: [
      { id: 1, text: 'Merhaba! Profilin çok ilgimi çekti.', sender: 'other' },
      { id: 2, text: 'Merhaba Elif! Teşekkür ederim, senin de.', sender: 'me' },
    ],
    lastMessage: 'Merhaba Elif! Teşekkür ederim, senin de.',
  },
  {
    id: 2,
    name: 'Mehmet',
    avatar: 'https://placehold.co/40x40.png',
    aiHint: 'man portrait',
    messages: [
        { id: 1, text: 'Yürüyüş rotaları hakkında konuşabiliriz belki?', sender: 'other' },
    ],
    lastMessage: 'Yürüyüş rotaları hakkında konuşabiliriz belki?',
  },
];

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState(mockConversations[0]);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-1/3 border-r flex flex-col">
        <div className="p-4 border-b">
            <h2 className="text-2xl font-bold font-headline">Sohbetler</h2>
            <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Ara..." className="pl-8" />
            </div>
        </div>
        <ScrollArea className="flex-1">
          {mockConversations.map((convo) => (
            <div
              key={convo.id}
              className={cn(
                'flex items-center gap-3 p-4 cursor-pointer hover:bg-accent',
                activeChat.id === convo.id && 'bg-accent'
              )}
              onClick={() => setActiveChat(convo)}
            >
              <Avatar>
                <AvatarImage src={convo.avatar} data-ai-hint={convo.aiHint} />
                <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold truncate">{convo.name}</p>
                <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
              </div>
            </div>
          ))}
        </ScrollArea>
      </aside>
      <main className="w-2/3 flex flex-col">
        {activeChat ? (
          <>
            <header className="flex items-center gap-4 p-4 border-b bg-card">
              <Avatar>
                 <AvatarImage src={activeChat.avatar} data-ai-hint={activeChat.aiHint} />
                 <AvatarFallback>{activeChat.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold">{activeChat.name}</h3>
            </header>
            <ScrollArea className="flex-1 p-6">
              <div className="flex flex-col gap-4">
                {activeChat.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex items-end gap-2 max-w-xs',
                      message.sender === 'me' ? 'self-end flex-row-reverse' : 'self-start'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-lg px-4 py-2',
                        message.sender === 'me'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border'
                      )}
                    >
                      <p>{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <footer className="p-4 border-t bg-card">
              <div className="relative">
                <Input placeholder="Bir mesaj yaz..." className="pr-12" />
                <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                  <SendHorizonal className="h-4 w-4" />
                </Button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1">
            <p className="text-muted-foreground">Başlamak için bir sohbet seçin</p>
          </div>
        )}
      </main>
    </div>
  );
}
