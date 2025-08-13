
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizonal, Search, Mic, Phone, Video, Image as ImageIcon, Smile, ArrowLeft, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Message = {
    id: number;
    text: string;
    sender: 'me' | 'other';
    timestamp: string;
};

type Conversation = {
    id: number;
    name: string;
    avatar: string;
    aiHint: string;
    messages: Message[];
    lastMessage: string;
    isOnline: boolean;
};


const initialConversations: Conversation[] = [
  {
    id: 1,
    name: 'Elif',
    avatar: 'https://placehold.co/40x40.png',
    aiHint: 'woman portrait',
    isOnline: true,
    messages: [
      { id: 1, text: 'Merhaba! Profilin çok ilgimi çekti.', sender: 'other', timestamp: '10:30' },
      { id: 2, text: 'Merhaba Elif! Teşekkür ederim, senin de.', sender: 'me', timestamp: '10:31' },
      { id: 3, text: 'Nasılsın? Hafta sonu için bir planın var mı acaba merak ettim de? Belki bir kahve içebiliriz bir yerlerde? Ne dersin? :)', sender: 'other', timestamp: '10:32' },
      { id: 4, text: 'İyiyim, teşekkürler! Henüz bir planım yok. Kahve harika fikir! Nerede buluşabiliriz?', sender: 'me', timestamp: '10:35' },
    ],
    lastMessage: 'İyiyim, teşekkürler! Henüz bir planım yok...',
  },
  {
    id: 2,
    name: 'Mehmet',
    avatar: 'https://placehold.co/40x40.png',
    aiHint: 'man portrait',
    isOnline: false,
    messages: [
        { id: 1, text: 'Yürüyüş rotaları hakkında konuşabiliriz belki?', sender: 'other', timestamp: 'Dün' },
    ],
    lastMessage: 'Yürüyüş rotaları hakkında konuşabiliriz belki?',
  },
];

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState(initialConversations);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');

  const isChatViewOpen = activeChat !== null;

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId) {
      const chatToOpen = conversations.find(c => c.id === parseInt(userId, 10));
      if (chatToOpen) {
        setActiveChat(chatToOpen);
      }
    }
  }, [searchParams, conversations]);


  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeChat) return;

    const newMessage: Message = {
      id: Date.now(),
      text: messageInput.trim(),
      sender: 'me',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedConversations = conversations.map(convo => {
        if (convo.id === activeChat.id) {
            const updatedMessages = [...convo.messages, newMessage];
            return {
                ...convo,
                messages: updatedMessages,
                lastMessage: newMessage.text,
            };
        }
        return convo;
    });

    setConversations(updatedConversations);

    const updatedActiveChat = updatedConversations.find(c => c.id === activeChat.id);
    if (updatedActiveChat) {
        setActiveChat(updatedActiveChat);
    }

    setMessageInput('');
  };

  const handleSetActiveChat = (convo: Conversation) => {
    setActiveChat(conversations.find(c => c.id === convo.id) || null);
  }

  const handleBackToList = () => {
      setActiveChat(null);
      // If we came directly via a query param, going back should take us to the main match page.
      if (searchParams.get('userId')) {
          router.push('/match');
      }
  }

  return (
    <div className="flex h-full bg-background text-foreground">
      {/* Sidebar with Conversation List */}
      <aside className={cn(
        "w-full flex flex-col h-full",
        isChatViewOpen && "hidden",
      )}>
        <header className="flex items-center gap-4 p-3 border-b bg-card shrink-0 sticky top-0">
             <Link href="/match">
                <Button variant="ghost" size="icon" className="rounded-full">
                    <ArrowLeft className="w-5 h-5"/>
                </Button>
            </Link>
            <h2 className="text-xl font-bold font-headline">Sohbetler</h2>
        </header>

        <div className='flex-1 flex flex-col'>
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Ara..." className="pl-8" />
                </div>
            </div>
            <ScrollArea className="flex-1">
            {conversations.map((convo) => (
                <div
                key={convo.id}
                className={cn(
                    'flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50'
                )}
                onClick={() => handleSetActiveChat(convo)}
                >
                <div className='relative'>
                    <Avatar className='w-12 h-12'>
                    <AvatarImage src={convo.avatar} data-ai-hint={convo.aiHint} />
                    <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {convo.isOnline && <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background'/>}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="font-semibold truncate">{convo.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                </div>
                </div>
            ))}
            </ScrollArea>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={cn(
          "w-full flex-col h-full",
          isChatViewOpen ? "flex" : "hidden"
      )}>
        {activeChat ? (
          <>
            <header className="flex items-center gap-4 p-3 border-b bg-card shrink-0 sticky top-0">
               <Button variant="ghost" size="icon" className="rounded-full" onClick={handleBackToList}>
                    <ArrowLeft className="w-5 h-5"/>
                </Button>
              <Avatar>
                 <AvatarImage src={activeChat.avatar} data-ai-hint={activeChat.aiHint} />
                 <AvatarFallback>{activeChat.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                 <h3 className="text-lg font-semibold">{activeChat.name}</h3>
                 {activeChat.isOnline && <p className='text-xs text-green-500'>Çevrimiçi</p>}
              </div>
              <div className='flex items-center gap-2'>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Phone className="w-5 h-5"/>
                </Button>
                 <Button variant="ghost" size="icon" className="rounded-full">
                    <Video className="w-5 h-5"/>
                </Button>
              </div>
            </header>
            <ScrollArea className="flex-1 p-6 bg-muted/30">
              <div className="flex flex-col gap-4">
                {activeChat.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex items-end gap-2 max-w-md',
                      message.sender === 'me' ? 'self-end flex-row-reverse' : 'self-start'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-xl px-4 py-2 text-sm',
                        message.sender === 'me'
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-card border rounded-bl-none'
                      )}
                    >
                      <p>{message.text}</p>
                      <p className={cn(
                        'text-xs mt-1',
                        message.sender === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                      )}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <footer className="p-4 border-t bg-card shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
                 <Button type="button" size="icon" variant="ghost" className="rounded-full shrink-0">
                    <ImageIcon className="w-5 h-5" />
                 </Button>
                 <Button type="button" size="icon" variant="ghost" className="rounded-full shrink-0">
                    <Smile className="w-5 h-5" />
                 </Button>
                <Input
                    placeholder="Bir mesaj yaz..."
                    className="flex-1 bg-muted border-none rounded-full"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                />
                 {messageInput ? (
                    <Button type="submit" size="icon" className="rounded-full bg-primary text-primary-foreground shrink-0">
                        <SendHorizonal className="h-5 w-5" />
                    </Button>
                 ) : (
                    <Button type="button" size="icon" className="rounded-full bg-primary text-primary-foreground shrink-0">
                        <Mic className="h-5 w-5" />
                    </Button>
                 )}
              </form>
            </footer>
          </>
        ) : null}
      </main>
    </div>
  );
}
