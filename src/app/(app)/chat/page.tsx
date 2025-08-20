
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams }from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizonal, Search, Mic, Phone, Video, Image as ImageIcon, Smile, ArrowLeft, Pencil, Trash2, BellOff, Pin, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { collection, query, where, getDocs, onSnapshot, doc, orderBy, addDoc, serverTimestamp, Timestamp, updateDoc, getDoc, arrayUnion, arrayRemove, deleteDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';

type UserData = {
    uid: string;
    name: string;
    avatarUrl: string;
    isOnline: boolean;
};

type Message = {
    id: string;
    text: string;
    senderId: string;
    timestamp: Timestamp;
};

type Conversation = {
    id: string;
    otherUser: UserData;
    lastMessage: {
        text: string;
        timestamp: Timestamp | null;
    } | null;
    isPinned: boolean;
    isMuted: boolean;
    unreadCount: number;
};

const formatRelativeTime = (date: Date | null) => {
    if (!date) return '';
    try {
        return formatDistanceToNowStrict(date, {
            addSuffix: true,
            locale: tr,
        });
    } catch (e) {
        return 'az önce';
    }
};


export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const currentUser = auth.currentUser;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // A chat view is open if a conversationId or userId is present in the URL
  const isChatViewOpen = searchParams.has('conversationId') || searchParams.has('userId');

  // Find or create conversation when userId is in URL
  useEffect(() => {
    const userIdToChat = searchParams.get('userId');
    if (userIdToChat && currentUser && !searchParams.has('conversationId')) {
        const findOrCreateConversation = async () => {
            setRedirecting(true);
            try {
                // Generate a consistent conversation ID
                const conversationId = [currentUser.uid, userIdToChat].sort().join('-');
                const conversationRef = doc(db, 'conversations', conversationId);
                const conversationSnap = await getDoc(conversationRef);

                if (!conversationSnap.exists()) {
                     // Create a new conversation with the specific ID
                     await setDoc(conversationRef, {
                        users: [currentUser.uid, userIdToChat],
                        createdAt: serverTimestamp(),
                        lastMessage: null,
                     });
                }
                router.replace(`/chat?conversationId=${conversationId}`, { scroll: false });
                
            } catch (error) {
                console.error("Error finding or creating conversation: ", error);
                toast({ title: "Sohbet başlatılamadı.", variant: "destructive" });
                router.replace('/chat');
            } finally {
                // No need to setRedirecting(false) here, it's handled by the main convo loader
            }
        };
        findOrCreateConversation();
    }
  }, [searchParams, currentUser, router, toast]);

  // Fetch conversations
  useEffect(() => {
    if (!currentUser) {
        setLoading(false);
        return;
    }

    const q = query(collection(db, 'conversations'), where('users', 'array-contains', currentUser.uid));
    
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const convosPromises = querySnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const otherUserId = data.users.find((uid: string) => uid !== currentUser.uid);
            
            if (otherUserId) {
                const userDoc = await getDoc(doc(db, 'users', otherUserId));
                if (userDoc.exists()) {
                    const userData = userDoc.data() as UserData;
                    return {
                        id: docSnap.id,
                        otherUser: { ...userData, uid: otherUserId },
                        lastMessage: data.lastMessage || null,
                        isPinned: false, // TODO
                        isMuted: false,  // TODO
                        unreadCount: 0,  // TODO
                    } as Conversation;
                }
            }
            return null;
        });
        
        const resolvedConvos = (await Promise.all(convosPromises)).filter(c => c !== null) as Conversation[];
        
        // Sort conversations by last message timestamp client-side
        resolvedConvos.sort((a, b) => {
            const timeA = a.lastMessage?.timestamp?.toMillis() || 0;
            const timeB = b.lastMessage?.timestamp?.toMillis() || 0;
            return timeB - timeA;
        });

        setConversations(resolvedConvos);
        setLoading(false);
        setRedirecting(false); // Stop redirecting loader once conversations load
    }, (error) => {
        console.error("Error fetching conversations: ", error);
        toast({ title: "Sohbetler yüklenirken bir hata oluştu.", variant: 'destructive'});
        setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, toast]);


  // Fetch active chat details and messages
  useEffect(() => {
    const conversationId = searchParams.get('conversationId');

    if (!conversationId || !currentUser) {
        setActiveChat(null);
        setMessages([]);
        return;
    }
    
    setChatLoading(true);

    // Listener for the active conversation details
    const convoUnsubscribe = onSnapshot(doc(db, 'conversations', conversationId), async (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const otherUserId = data.users.find((uid: string) => uid !== currentUser.uid);

            if (otherUserId) {
                const userDoc = await getDoc(doc(db, 'users', otherUserId));
                if (userDoc.exists()) {
                    const userData = userDoc.data() as UserData;
                    setActiveChat({
                        id: docSnap.id,
                        otherUser: { ...userData, uid: otherUserId },
                        lastMessage: data.lastMessage || null,
                        isPinned: false,
                        isMuted: false,
                        unreadCount: 0,
                    });
                }
            }
        } else {
             // Conversation might have been deleted
             setActiveChat(null);
             router.replace('/chat');
        }
    }, (error) => {
        console.error("Error fetching active chat details:", error);
        toast({title: "Sohbet detayları alınamadı.", variant: "destructive"});
    });

    // Listener for messages in the active conversation
    const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('timestamp', 'asc'));
    const messagesUnsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
        const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(msgs);
        setChatLoading(false); // Messages are loaded
    }, (error) => {
        console.error("Error fetching messages: ", error);
        toast({ title: "Mesajlar yüklenirken bir hata oluştu.", variant: 'destructive'});
        setChatLoading(false);
    });

    return () => {
        convoUnsubscribe();
        messagesUnsubscribe();
    };
  }, [searchParams, currentUser, toast, router]);
  
  // Scroll to bottom of chat
  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.children[1] as HTMLDivElement;
        if(scrollElement) {
           scrollElement.scrollTop = scrollElement.scrollHeight;
        }
    }
  }, [messages]);


  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChat || !currentUser) return;

    const conversationRef = doc(db, 'conversations', activeChat.id);
    const messagesRef = collection(conversationRef, 'messages');
    
    const tempMessageInput = messageInput.trim();
    setMessageInput('');

    try {
        await addDoc(messagesRef, {
            text: tempMessageInput,
            senderId: currentUser.uid,
            timestamp: serverTimestamp(),
        });
        
        await updateDoc(conversationRef, {
            lastMessage: {
                text: tempMessageInput,
                timestamp: serverTimestamp(),
            }
        });

    } catch (error) {
         console.error("Error sending message: ", error);
         toast({ title: "Mesaj gönderilemedi.", variant: 'destructive'});
         setMessageInput(tempMessageInput); // Restore input on error
    }
  };
  
  const handleItemClick = (convo: Conversation) => {
    if (isEditMode) {
      const newSelectedIds = new Set(selectedIds);
      if (newSelectedIds.has(convo.id)) {
        newSelectedIds.delete(convo.id);
      } else {
        newSelectedIds.add(convo.id);
      }
      setSelectedIds(newSelectedIds);
    } else {
      router.push(`/chat?conversationId=${convo.id}`);
    }
  };


  const handleBackToList = () => {
      router.push('/chat');
  }
  
  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setSelectedIds(new Set()); // Exit edit mode clears selection
  };
  
  const handleDelete = async () => {
    const promises = Array.from(selectedIds).map(id => deleteDoc(doc(db, 'conversations', id)));
    try {
        await Promise.all(promises);
        toast({ title: `${selectedIds.size} sohbet silindi.` });
        setIsEditMode(false);
        setSelectedIds(new Set());
    } catch(error) {
        console.error("Error deleting conversations: ", error);
        toast({ title: 'Sohbetler silinirken bir hata oluştu.', variant: 'destructive'});
    }
  };

  const handleMute = () => {
    // TODO: Implement mute logic with user-specific conversation data
    toast({ title: "Bu özellik henüz eklenmedi." });
    setIsEditMode(false);
    setSelectedIds(new Set());
  };
  
  const handlePin = () => {
    // TODO: Implement pin logic with user-specific conversation data
    toast({ title: "Bu özellik henüz eklenmedi." });
    setIsEditMode(false);
    setSelectedIds(new Set());
  };


  if (redirecting) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar with Conversation List */}
      <aside className={cn(
        "w-full flex-col h-full flex",
        isChatViewOpen ? "hidden md:flex md:w-1/3 md:border-r" : "flex",
      )}>
        <header className="flex items-center gap-4 p-3 border-b bg-card shrink-0 sticky top-0">
            {isEditMode ? (
                <>
                   <div className='flex items-center gap-2'>
                       <Button variant="ghost" size="icon" className="rounded-full" onClick={handleDelete} disabled={selectedIds.size === 0}>
                           <Trash2 className="w-5 h-5"/>
                       </Button>
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={handleMute} disabled={selectedIds.size !== 1}>
                           <BellOff className="w-5 h-5"/>
                       </Button>
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={handlePin} disabled={selectedIds.size !== 1}>
                           <Pin className="w-5 h-5"/>
                       </Button>
                   </div>
                   <div className='flex-1 text-center font-semibold'>
                        {selectedIds.size > 0 ? `${selectedIds.size} seçildi` : "Öğe seçin"}
                   </div>
                   <Button variant="ghost" size="icon" className="rounded-full" onClick={handleToggleEditMode}>
                       <X className="w-5 h-5"/>
                   </Button>
                </>
            ) : (
                 <>
                    <h2 className="text-xl font-bold font-headline flex-1">Sohbetler</h2>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={handleToggleEditMode}>
                        <Pencil className="w-5 h-5"/>
                    </Button>
                 </>
            )}
        </header>

        <div className='flex-1 flex flex-col'>
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Ara..." className="pl-8" />
                </div>
            </div>
            <ScrollArea className="flex-1">
            {loading ? (
                <div className="p-4 space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="w-12 h-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : conversations.length > 0 ? (
                conversations.map((convo) => (
                    <div
                    key={convo.id}
                    className={cn(
                        'flex items-center gap-3 p-4 cursor-pointer transition-colors',
                        selectedIds.has(convo.id) ? 'bg-primary/20' : 'hover:bg-muted/50',
                        convo.unreadCount > 0 && 'bg-primary/5',
                        activeChat?.id === convo.id && 'bg-muted'
                    )}
                    onClick={() => handleItemClick(convo)}
                    >
                    {isEditMode && (
                      <Checkbox
                        checked={selectedIds.has(convo.id)}
                        onCheckedChange={() => handleItemClick(convo)}
                        className="h-5 w-5"
                      />
                    )}
                    <div className='relative'>
                        <Avatar className='w-12 h-12'>
                        <AvatarImage src={convo.otherUser.avatarUrl} data-ai-hint={convo.otherUser.name} />
                        <AvatarFallback>{convo.otherUser.name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        {convo.otherUser.isOnline && <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background'/>}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                            <p className={cn("truncate", convo.unreadCount > 0 ? "font-bold" : "font-semibold")}>{convo.otherUser.name}</p>
                            <span className="text-xs text-muted-foreground font-mono whitespace-nowrap ml-2">{formatRelativeTime(convo.lastMessage?.timestamp?.toDate() || null)}</span>
                        </div>
                        <p className={cn("text-sm truncate", convo.unreadCount > 0 ? "font-bold text-foreground" : "text-muted-foreground")}>{convo.lastMessage?.text}</p>
                    </div>
                     <div className="flex flex-col items-end gap-1 self-start pt-1">
                        {convo.unreadCount > 0 && (
                            <Badge className="bg-green-500 text-white w-5 h-5 flex items-center justify-center p-0 text-xs">{convo.unreadCount}</Badge>
                        )}
                        {convo.isMuted && <BellOff className="w-4 h-4 text-muted-foreground" />}
                     </div>
                    </div>
                ))
            ) : (
                <div className="text-center text-muted-foreground p-10">
                    <p>Henüz sohbet yok.</p>
                    <p className="text-sm">Yeni bir eşleşme bulunca sohbetleriniz burada görünecek.</p>
                </div>
            )}
            </ScrollArea>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={cn(
          "w-full flex-col h-full",
          isChatViewOpen ? "flex" : "hidden md:hidden",
      )}>
        {activeChat ? (
          <>
            <header className="flex items-center gap-4 p-3 border-b bg-card shrink-0">
               <Button variant="ghost" size="icon" className="rounded-full md:hidden" onClick={handleBackToList}>
                    <ArrowLeft className="w-5 h-5"/>
                </Button>
              <Avatar>
                 <AvatarImage src={activeChat.otherUser.avatarUrl} data-ai-hint={activeChat.otherUser.name} />
                 <AvatarFallback>{activeChat.otherUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                 <h3 className="text-lg font-semibold">{activeChat.otherUser.name}</h3>
                 {activeChat.otherUser.isOnline && <p className='text-xs text-green-500'>Çevrimiçi</p>}
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
            <ScrollArea className="flex-1 bg-muted/30" ref={scrollAreaRef}>
              <div className='p-6'>
                {chatLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex items-end gap-2 max-w-md',
                          message.senderId === currentUser?.uid ? 'self-end flex-row-reverse' : 'self-start'
                        )}
                      >
                        <div
                          className={cn(
                            'rounded-xl px-4 py-2 text-sm',
                            message.senderId === currentUser?.uid
                              ? 'bg-primary text-primary-foreground rounded-br-none'
                              : 'bg-card border rounded-bl-none'
                          )}
                        >
                          <p>{message.text}</p>
                          <p className={cn(
                            'text-xs mt-1 text-right',
                            message.senderId === currentUser?.uid ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                          )}>
                            {message.timestamp?.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
        ) : isChatViewOpen && (
            <div className="flex h-full w-full items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )}
      </main>
    </div>
  );
}
