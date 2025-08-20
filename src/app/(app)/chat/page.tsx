
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams }from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizonal, Search, Mic, Phone, Video, Image as ImageIcon, Smile, ArrowLeft, Pencil, Trash2, BellOff, Pin, X, Loader2, Undo, Check as CheckIcon, Paperclip } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { collection, query, where, getDocs, onSnapshot, doc, orderBy, addDoc, serverTimestamp, Timestamp, updateDoc, getDoc, arrayUnion, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { auth, db, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';


type UserData = {
    uid: string;
    name: string;
    avatarUrl: string;
    isOnline: boolean;
};

type Message = {
    id: string;
    text?: string;
    imageUrl?: string;
    senderId: string;
    timestamp: Timestamp;
    reaction?: string;
    isEdited?: boolean;
    isDeleted?: boolean;
    deletedFor?: string[];
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

const REACTIONS = ['❤️', '👍', '😂', '😢', '😮'];


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
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageToSend, setImageToSend] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  const [isSendingImage, setIsSendingImage] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const isRedirectingRef = useRef(false);
  

  // A chat view is open if a conversationId or userId is present in the URL
  const isChatViewOpen = searchParams.has('conversationId') || searchParams.has('userId');

  // Find or create conversation when userId is in URL
  useEffect(() => {
    const userIdToChat = searchParams.get('userId');
    if (userIdToChat && currentUser && !isRedirectingRef.current) {
        const findOrCreateConversation = async () => {
            isRedirectingRef.current = true;
            setActiveChat(null); // Clear previous chat while loading
            setChatLoading(true);
            try {
                // Generate a consistent conversation ID by sorting UIDs
                const conversationId = [currentUser.uid, userIdToChat].sort().join('-');
                const conversationRef = doc(db, 'conversations', conversationId);
                const conversationSnap = await getDoc(conversationRef);

                if (!conversationSnap.exists()) {
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
                 isRedirectingRef.current = false;
                 setChatLoading(false);
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
        setLoading(true);
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
        
        let resolvedConvos = (await Promise.all(convosPromises)).filter(c => c !== null) as Conversation[];
        
        resolvedConvos.sort((a, b) => {
            const timeA = a.lastMessage?.timestamp?.toMillis() || 0;
            const timeB = b.lastMessage?.timestamp?.toMillis() || 0;
            return timeB - timeA;
        });

        setConversations(resolvedConvos);
        setLoading(false);
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
        setChatLoading(false);
        return;
    }
    
    setChatLoading(true);

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
             setActiveChat(null);
             router.replace('/chat', {scroll: false});
        }
    }, (error) => {
        console.error("Error fetching active chat details:", error);
        toast({title: "Sohbet detayları alınamadı.", variant: "destructive"});
    });

    const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('timestamp', 'asc'));
    const messagesUnsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
        const msgs = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(msgs);
        setChatLoading(false);
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
         setMessageInput(tempMessageInput); 
    }
  };

   const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (reader.result) {
          setImageToSend(reader.result.toString());
        }
      });
      reader.readAsDataURL(e.target.files[0]);
    }
    // Reset file input value to allow selecting the same file again
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };
  
  const handleSendImage = async () => {
    if (!imageToSend || !activeChat || !currentUser) return;
    setIsSendingImage(true);

    try {
        const storageRef = ref(storage, `chat_images/${activeChat.id}/${Date.now()}`);
        const uploadTask = await uploadString(storageRef, imageToSend, 'data_url');
        const downloadURL = await getDownloadURL(uploadTask.ref);

        const conversationRef = doc(db, 'conversations', activeChat.id);
        const messagesRef = collection(conversationRef, 'messages');

        await addDoc(messagesRef, {
            text: imageCaption,
            imageUrl: downloadURL,
            senderId: currentUser.uid,
            timestamp: serverTimestamp(),
        });

        await updateDoc(conversationRef, {
             lastMessage: {
                text: imageCaption ? `[Resim] ${imageCaption}` : '[Resim]',
                timestamp: serverTimestamp(),
            }
        });

        setImageToSend(null);
        setImageCaption('');

    } catch (error) {
        console.error("Error sending image:", error);
        toast({ title: "Resim gönderilemedi.", variant: "destructive" });
    } finally {
        setIsSendingImage(false);
    }
  }


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

  const handleBackToList = () => router.push('/chat', { scroll: false });
  const handleToggleEditMode = () => { setIsEditMode(!isEditMode); setSelectedIds(new Set()); };
  
  const handleDelete = async () => {
    const idsToDelete = new Set(selectedIds);
    if (idsToDelete.size === 0) return;

    try {
      const batch = writeBatch(db);

      for (const id of idsToDelete) {
        const messagesRef = collection(db, 'conversations', id, 'messages');
        const messagesSnapshot = await getDocs(messagesRef);
        messagesSnapshot.docs.forEach(messageDoc => {
          batch.delete(messageDoc.ref);
        });
        const conversationRef = doc(db, 'conversations', id);
        batch.delete(conversationRef);
      }
      
      await batch.commit();

      toast({ title: `${idsToDelete.size} sohbet ve içindeki tüm mesajlar silindi.` });
      setIsEditMode(false);
      setSelectedIds(new Set());
      
      if (activeChat && idsToDelete.has(activeChat.id)) {
        router.push('/chat');
      }
    } catch (error) {
      console.error("Error deleting conversations: ", error);
      toast({ title: 'Sohbetler silinirken bir hata oluştu.', variant: 'destructive' });
    }
  };
  
    const handleReaction = async (messageId: string, reaction: string | null) => {
        if (!activeChat) return;
        const messageRef = doc(db, 'conversations', activeChat.id, 'messages', messageId);
        await updateDoc(messageRef, { reaction: reaction });
    };

    const startEditing = (message: Message) => {
        setEditingMessageId(message.id);
        setMessageInput(message.text || '');
        textareaRef.current?.focus();
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setMessageInput('');
    };
    
    const saveEditing = async () => {
        if (!activeChat || !editingMessageId || !messageInput.trim()) return;
        const messageRef = doc(db, 'conversations', activeChat.id, 'messages', editingMessageId);
        await updateDoc(messageRef, {
            text: messageInput.trim(),
            isEdited: true
        });
        cancelEditing();
    };
    
    const handleDeleteMessageForMe = async (messageId: string) => {
        if (!activeChat || !currentUser) return;
        const messageRef = doc(db, 'conversations', activeChat.id, 'messages', messageId);
        
        const message = messages.find(m => m.id === messageId);
        if (message?.senderId === currentUser.uid) {
           await updateDoc(messageRef, { text: 'Bu mesaj silindi.', isDeleted: true, reaction: null, imageUrl: null });
        } else {
            await updateDoc(messageRef, {
                deletedFor: arrayUnion(currentUser.uid)
            });
        }
    };

    const handleDeleteMessageForEveryone = async (messageId: string) => {
        if (!activeChat) return;
        const messageRef = doc(db, 'conversations', activeChat.id, 'messages', messageId);
        await updateDoc(messageRef, { text: 'Bu mesaj silindi.', isDeleted: true, reaction: null, imageUrl: null });
    };
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMessageId) {
            saveEditing();
        } else {
            handleSendMessage();
        }
    };

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [messageInput]);


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
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => {}} disabled={selectedIds.size !== 1}>
                           <BellOff className="w-5 h-5"/>
                       </Button>
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => {}} disabled={selectedIds.size !== 1}>
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
          "w-full flex flex-col h-full",
          isChatViewOpen ? "flex" : "hidden md:flex",
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
                  <div className="flex flex-col gap-1">
                    {messages.map((message) => {
                        const isUserHidden = currentUser && message.deletedFor?.includes(currentUser.uid);
                        if (isUserHidden) {
                            return null; // Don't render anything for this user
                        }

                        if (message.isDeleted) {
                             return (
                                <div key={message.id} className={cn('flex items-end gap-2 max-w-lg', message.senderId === currentUser?.uid ? 'self-end' : 'self-start')}>
                                    <div className="rounded-xl px-4 py-2 text-sm text-muted-foreground italic">
                                        Bu mesaj silindi.
                                    </div>
                                </div>
                            );
                        }
                       
                       const hasOnlyImage = message.imageUrl && !message.text;

                       const messageContent = (
                            <div className={cn(
                                'rounded-xl px-4 py-2 text-sm relative',
                                message.senderId === currentUser?.uid ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border rounded-bl-none',
                                hasOnlyImage && 'bg-transparent border-none p-0'
                            )}>
                                {message.imageUrl && (
                                     <div className='relative my-2 max-w-[250px]'>
                                        <Image
                                            src={message.imageUrl}
                                            alt="Sohbet resmi"
                                            width={250}
                                            height={250}
                                            className="rounded-md object-cover cursor-pointer"
                                            onClick={() => setImageToView(message.imageUrl!)}
                                        />
                                    </div>
                                )}
                                {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
                                <div className={cn('flex items-center gap-2 text-xs mt-1', 
                                    message.senderId === currentUser?.uid ? 'text-primary-foreground/70' : 'text-muted-foreground/70',
                                    hasOnlyImage && 'hidden'
                                )}>
                                    {message.isEdited && <span>(düzenlendi)</span>}
                                    <span>{message.timestamp?.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {message.reaction && (
                                    <div className="absolute -bottom-3.5 rounded-full bg-background border px-1 py-0.5 text-xs select-none"
                                        style={{ [message.senderId === currentUser?.uid ? 'right' : 'left']: '10px' }}>
                                        {message.reaction}
                                    </div>
                                )}
                            </div>
                       );

                       return (
                           <div key={message.id} className={cn('flex items-end gap-2 max-w-lg group', message.senderId === currentUser?.uid ? 'self-end flex-row-reverse' : 'self-start')}>
                               <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <div className='cursor-pointer'>{messageContent}</div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align={message.senderId === currentUser?.uid ? 'end' : 'start'}>
                                        <div className="flex gap-1 p-1">
                                            {REACTIONS.map(r => (
                                                <Button key={r} variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleReaction(message.id, message.reaction === r ? null : r)}>
                                                    {r}
                                                </Button>
                                            ))}
                                        </div>
                                        {message.text && message.senderId === currentUser?.uid && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => startEditing(message)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    <span>Düzenle</span>
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleDeleteMessageForMe(message.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Benden Sil</span>
                                        </DropdownMenuItem>
                                        {message.senderId === currentUser?.uid && (
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteMessageForEveryone(message.id)}>
                                                <Undo className="mr-2 h-4 w-4" />
                                                <span>Herkesten Sil</span>
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                           </div>
                       )
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
            <footer className="p-4 border-t bg-card shrink-0">
              <form onSubmit={handleFormSubmit} className="flex items-start gap-2">
                 {editingMessageId ? (
                     <>
                        <Button type="button" size="icon" variant="ghost" className="rounded-full shrink-0 mt-1" onClick={cancelEditing}>
                            <X className="w-5 h-5 text-destructive" />
                        </Button>
                        <Textarea
                            ref={textareaRef}
                            placeholder="Mesajı düzenle..."
                            className="flex-1 bg-muted border-none rounded-2xl resize-none min-h-[40px] max-h-[120px] py-2"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                        />
                        <Button type="submit" size="icon" className="rounded-full bg-green-500 text-white shrink-0 mt-1">
                            <CheckIcon className="h-5 w-5" />
                        </Button>
                     </>
                 ) : (
                    <>
                         <input type="file" ref={fileInputRef} onChange={onFileSelect} accept="image/*" className="hidden" />
                         <Button type="button" size="icon" variant="ghost" className="rounded-full shrink-0 mt-1" onClick={() => fileInputRef.current?.click()}>
                            <Paperclip className="w-5 h-5" />
                         </Button>
                         <Button type="button" size="icon" variant="ghost" className="rounded-full shrink-0 mt-1">
                            <Smile className="w-5 h-5" />
                         </Button>
                        <Textarea
                            ref={textareaRef}
                            placeholder="Bir mesaj yaz..."
                            className="flex-1 bg-muted border-none rounded-2xl resize-none min-h-[40px] max-h-[120px] py-2"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />
                         {messageInput ? (
                            <Button type="submit" size="icon" className="rounded-full bg-primary text-primary-foreground shrink-0 mt-1">
                                <SendHorizonal className="h-5 w-5" />
                            </Button>
                         ) : (
                            <Button type="button" size="icon" className="rounded-full bg-primary text-primary-foreground shrink-0 mt-1">
                                <Mic className="h-5 w-5" />
                            </Button>
                         )}
                    </>
                 )}
              </form>
            </footer>
          </>
        ) : (
          isChatViewOpen && !activeChat && (
            <div className="flex h-full w-full items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          )
        )}
      </main>

       {/* Send Image Modal */}
      <Dialog open={!!imageToSend} onOpenChange={(open) => !open && setImageToSend(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Resim Gönder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {imageToSend && (
              <Image src={imageToSend} alt="Önizleme" width={400} height={400} className="rounded-md max-h-[50vh] object-contain" />
            )}
            <Textarea
                placeholder="İsteğe bağlı alt yazı..."
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                className="mt-4"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageToSend(null)} disabled={isSendingImage}>İptal</Button>
            <Button onClick={handleSendImage} disabled={isSendingImage}>
              {isSendingImage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
        {/* View Image Modal */}
      <Dialog open={!!imageToView} onOpenChange={(open) => !open && setImageToView(null)}>
        <DialogContent className="max-w-3xl p-0 bg-transparent border-none">
           {imageToView && (
              <Image src={imageToView} alt="Sohbet resmi" width={800} height={800} className="rounded-md object-contain w-full h-auto max-h-[90vh]" />
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

    

    