
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizonal, Heart, Hourglass, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


type Message = {
    id: string;
    text: string;
    senderId: string;
    timestamp: any;
};

type TempConversation = {
    user1: { uid: string; name: string; avatarUrl: string; heartClicked: boolean };
    user2: { uid: string; name: string; avatarUrl: string; heartClicked: boolean };
    expiresAt: any;
};

export default function RandomChatPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const currentUser = auth.currentUser;
    const conversationId = params.id as string;

    const [conversation, setConversation] = useState<TempConversation | null>(null);
    const [otherUser, setOtherUser] = useState<{ uid: string; name: string; avatarUrl: string; } | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isMatchPermanent, setIsMatchPermanent] = useState(false);
    const [showMatchModal, setShowMatchModal] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch and listen to the temporary conversation
    useEffect(() => {
        if (!currentUser || !conversationId) return;

        const convoRef = doc(db, 'temporaryConversations', conversationId);

        const unsubscribe = onSnapshot(convoRef, async (docSnap) => {
            if (!docSnap.exists()) {
                toast({ title: 'Sohbetin süresi doldu veya sohbet sonlandırıldı.', variant: 'destructive' });
                router.push('/shuffle');
                return;
            }

            const data = docSnap.data() as TempConversation;
            setConversation(data);
            
            const other = data.user1.uid === currentUser.uid ? data.user2 : data.user1;
            setOtherUser(other);
            
            // Check for permanent match
            if (data.user1.heartClicked && data.user2.heartClicked && !isMatchPermanent) {
                setIsMatchPermanent(true);
                setShowMatchModal(true);

                // Create permanent conversation
                const permanentConversationId = [data.user1.uid, data.user2.uid].sort().join('-');
                const permanentConvoRef = doc(db, 'conversations', permanentConversationId);
                const permConvoSnap = await getDoc(permanentConvoRef);
                if (!permConvoSnap.exists()) {
                     await setDoc(permanentConvoRef, {
                        users: [data.user1.uid, data.user2.uid],
                        createdAt: serverTimestamp(),
                        lastMessage: null,
                    });
                }
                
                // Optional: Delete temporary conversation after a short delay to allow UI to update
                setTimeout(() => {
                   deleteDoc(convoRef);
                }, 5000);
            }

            // Countdown timer
            if (data.expiresAt) {
                const interval = setInterval(() => {
                    const now = new Date();
                    const expiry = data.expiresAt.toDate();
                    const secondsLeft = Math.round((expiry.getTime() - now.getTime()) / 1000);
                    if (secondsLeft > 0) {
                        setTimeLeft(secondsLeft);
                    } else {
                        setTimeLeft(0);
                        clearInterval(interval);
                        // Don't auto-redirect if match became permanent
                        if (!isMatchPermanent) {
                            router.push('/shuffle');
                        }
                    }
                }, 1000);

                return () => clearInterval(interval);
            }

        }, (error) => {
            console.error("Error listening to conversation:", error);
            router.push('/shuffle');
        });

        // Fetch messages
        const messagesRef = collection(db, 'temporaryConversations', conversationId, 'messages');
        const messagesQuery = onSnapshot(messagesRef, (snapshot) => {
            const msgs = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => a.timestamp?.seconds - b.timestamp?.seconds) as Message[];
            setMessages(msgs);
        });


        return () => {
            unsubscribe();
            messagesQuery();
        };

    }, [currentUser, conversationId, router, toast, isMatchPermanent]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !currentUser || isMatchPermanent) return;

        const messagesRef = collection(db, 'temporaryConversations', conversationId, 'messages');
        await addDoc(messagesRef, {
            text: messageInput.trim(),
            senderId: currentUser.uid,
            timestamp: serverTimestamp(),
        });
        setMessageInput('');
    };

    const handleHeartClick = async () => {
        if (!currentUser || !conversation) return;
        
        const userKey = conversation.user1.uid === currentUser.uid ? 'user1' : 'user2';
        
        const convoRef = doc(db, 'temporaryConversations', conversationId);
        await updateDoc(convoRef, {
            [`${userKey}.heartClicked`]: true,
        });
        
        toast({ title: 'Beğeni gönderildi!', description: 'Diğer kişinin de beğenmesini bekleyin.'});
    };
    
     const handleExit = () => {
        const convoRef = doc(db, 'temporaryConversations', conversationId);
        deleteDoc(convoRef).finally(() => {
            router.push('/shuffle');
        });
    };

    const formatTimeLeft = (seconds: number | null) => {
        if (seconds === null) return '...';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (!conversation || !otherUser || !currentUser) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }
    
    const amIUser1 = conversation.user1.uid === currentUser.uid;
    const myHeartClicked = amIUser1 ? conversation.user1.heartClicked : conversation.user2.heartClicked;

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="flex items-center gap-4 p-3 border-b bg-card shrink-0">
                <Avatar>
                    <AvatarImage src={otherUser.avatarUrl} data-ai-hint={otherUser.name}/>
                    <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold">{otherUser.name}</h3>
                </div>
                <div className="flex items-center gap-2 text-lg font-mono font-bold text-primary">
                    <Hourglass className="w-5 h-5" />
                    <span>{formatTimeLeft(timeLeft)}</span>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={handleExit}>
                    <X className="w-5 h-5"/>
                </Button>
            </header>

            <ScrollArea className="flex-1 bg-muted/30">
                <div className="p-6 flex flex-col gap-4">
                    {messages.map((message) => {
                        const isSender = message.senderId === currentUser.uid;
                        return (
                            <div key={message.id} className={cn('flex items-end gap-2', isSender ? 'self-end' : 'self-start')}>
                                <div
                                    className={cn(
                                        'max-w-xs md:max-w-md rounded-xl px-4 py-2 text-sm break-words',
                                        isSender
                                            ? 'bg-primary text-primary-foreground rounded-br-none'
                                            : 'bg-card border rounded-bl-none'
                                    )}
                                >
                                    <p>{message.text}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            <footer className="p-4 border-t bg-card shrink-0">
                <div className="flex items-center gap-2">
                    <Button
                        size="icon"
                        className={cn("rounded-full w-14 h-14", myHeartClicked ? "bg-green-500 hover:bg-green-600" : "bg-pink-500 hover:bg-pink-600")}
                        onClick={handleHeartClick}
                        disabled={myHeartClicked || isMatchPermanent}
                    >
                        <Heart className="w-8 h-8 fill-white" />
                    </Button>
                    <Input
                        placeholder="Bir mesaj yaz..."
                        className="flex-1 h-14"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        disabled={isMatchPermanent}
                    />
                    <Button size="icon" className="rounded-full w-14 h-14" onClick={handleSendMessage} disabled={isMatchPermanent}>
                        <SendHorizonal className="h-6 w-6" />
                    </Button>
                </div>
            </footer>
             <AlertDialog open={showMatchModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle className='text-center text-3xl font-headline text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500'>Eşleşme!</AlertDialogTitle>
                    <AlertDialogDescription className='text-center'>
                        {otherUser.name} ile artık kalıcı olarak eşleştin. Sohbetinize devam edebilirsiniz.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                     <div className="flex items-center justify-center gap-8 py-4">
                        <Avatar className="w-24 h-24 border-4 border-primary">
                            <AvatarImage src={currentUser.photoURL || ''} data-ai-hint="current user" />
                        </Avatar>
                        <Avatar className="w-24 h-24 border-4 border-pink-500">
                            <AvatarImage src={otherUser.avatarUrl} data-ai-hint={otherUser.name} />
                        </Avatar>
                    </div>
                    <AlertDialogFooter>
                    <AlertDialogAction asChild>
                         <Link href={`/chat?conversationId=${[currentUser.uid, otherUser.uid].sort().join('-')}`}>Sohbete Git</Link>
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

