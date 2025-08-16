
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizonal, Heart, Timer, LogOut, Star, Shuffle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { db, auth } from '@/lib/firebase';
import { collection, query, where, limit, getDocs, addDoc, onSnapshot, doc, updateDoc, serverTimestamp, orderBy, Timestamp, setDoc, deleteDoc } from 'firebase/firestore';


type Message = {
    id: string;
    text: string;
    senderId: string;
};

type ShuffleState = 'idle' | 'searching' | 'chatting' | 'rating' | 'matched';

type ShufflePartner = {
    uid: string;
    name: string;
    avatarUrl: string;
};

const TIME_LIMIT = 300; // 5 minutes in seconds

export default function ShufflePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [shuffleState, setShuffleState] = useState<ShuffleState>('idle');
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [liked, setLiked] = useState(false);
    const [partnerLiked, setPartnerLiked] = useState(false);
    const [rating, setRating] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [shuffleSessionId, setShuffleSessionId] = useState<string | null>(null);
    const [partner, setPartner] = useState<ShufflePartner | null>(null);
    const currentUser = auth.currentUser;

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (shuffleSessionId) {
                deleteDoc(doc(db, 'shuffleSessions', shuffleSessionId));
            }
        };
    }, [shuffleSessionId]);
    
    // Timer logic
    useEffect(() => {
        if (shuffleState === 'chatting' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && shuffleState === 'chatting') {
            handleChatEnd('Süre doldu!');
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [shuffleState, timeLeft]);
    
    // Listen for partner likes and messages
    useEffect(() => {
        if (!shuffleSessionId || !currentUser) return;

        const sessionRef = doc(db, 'shuffleSessions', shuffleSessionId);

        const unsubSession = onSnapshot(sessionRef, (docSnap) => {
            if (!docSnap.exists()) return;
            const data = docSnap.data();
            const partnerId = data.users.find((uid: string) => uid !== currentUser.uid);
            if (data.likes && data.likes[partnerId] && !partnerLiked) {
                setPartnerLiked(true);
                toast({
                    title: `${partner?.name || 'Partnerin'} senden hoşlandı!`,
                    description: 'Kalbe basarak eşleşmeyi tamamla.',
                    className: 'bg-green-500 text-white'
                });
            }
        });
        
        const messagesRef = collection(db, 'shuffleSessions', shuffleSessionId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const unsubMessages = onSnapshot(q, (snapshot) => {
            const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            setMessages(newMessages);
        });

        return () => {
            unsubSession();
            unsubMessages();
        }

    }, [shuffleSessionId, currentUser, partner, partnerLiked, toast]);


    const startSearch = async () => {
        if (!currentUser) return;
        setShuffleState('searching');

        try {
            const q = query(
                collection(db, 'shuffleQueue'), 
                where('status', '==', 'waiting'), 
                limit(1)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // No one is waiting, so add self to queue
                await setDoc(doc(db, 'shuffleQueue', currentUser.uid), {
                    uid: currentUser.uid,
                    status: 'waiting',
                    timestamp: serverTimestamp(),
                });
                 // Listen for someone to match with us
                const unsub = onSnapshot(doc(db, 'shuffleQueue', currentUser.uid), (docSnap) => {
                    if (docSnap.data()?.status === 'matched') {
                        unsub();
                        const sessionId = docSnap.data()?.sessionId;
                        joinChatSession(sessionId);
                    }
                });

            } else {
                // Match found
                const partnerDoc = querySnapshot.docs[0];
                const partnerId = partnerDoc.id;

                // Create a new shuffle session
                const sessionRef = await addDoc(collection(db, 'shuffleSessions'), {
                    users: [currentUser.uid, partnerId],
                    createdAt: serverTimestamp(),
                    likes: { [currentUser.uid]: false, [partnerId]: false }
                });

                // Update queue entries for both users
                await updateDoc(doc(db, 'shuffleQueue', partnerId), { status: 'matched', sessionId: sessionRef.id });
                await setDoc(doc(db, 'shuffleQueue', currentUser.uid), { status: 'matched', sessionId: sessionRef.id });
                
                joinChatSession(sessionRef.id);
            }
        } catch (error) {
            console.error("Error in shuffle search:", error);
            toast({ variant: 'destructive', title: "Eşleşme aranırken bir hata oluştu."});
            resetState();
        }
    };
    
    const joinChatSession = async (sessionId: string) => {
        if (!currentUser) return;
        const sessionDoc = await getDoc(doc(db, 'shuffleSessions', sessionId));
        if (!sessionDoc.exists()) {
            resetState();
            return;
        }
        const partnerId = sessionDoc.data()!.users.find((uid: string) => uid !== currentUser.uid);
        const partnerDoc = await getDoc(doc(db, 'users', partnerId));

        if (!partnerDoc.exists()) {
            resetState();
            return;
        }
        setPartner(partnerDoc.data() as ShufflePartner);
        setShuffleSessionId(sessionId);
        setShuffleState('chatting');
        setTimeLeft(TIME_LIMIT);
        
        // Clean up our queue doc
        await deleteDoc(doc(db, 'shuffleQueue', currentUser.uid));
    };


    const handleSendMessage = async () => {
        if (!messageInput.trim() || !shuffleSessionId || !currentUser) return;
        const messagesRef = collection(db, 'shuffleSessions', shuffleSessionId, 'messages');
        try {
            await addDoc(messagesRef, {
                text: messageInput.trim(),
                senderId: currentUser.uid,
                timestamp: serverTimestamp(),
            });
            setMessageInput('');
        } catch (error) {
            console.error("Error sending message:", error);
            toast({ variant: 'destructive', title: "Mesaj gönderilemedi."});
        }
    };

    const handleLike = async () => {
        if (!shuffleSessionId || !currentUser) return;
        setLiked(true);
        const sessionRef = doc(db, 'shuffleSessions', shuffleSessionId);
        await updateDoc(sessionRef, { [`likes.${currentUser.uid}`]: true });

        if (partnerLiked) {
            handleMatch();
        } else {
             toast({
                title: 'Beğeni gönderildi!',
                description: 'Partnerinin de seni beğenmesini bekle.',
            });
        }
    };
    
    const handleMatch = async () => {
        if (!currentUser || !partner) return;
        setShuffleState('matched');
        if (timerRef.current) clearInterval(timerRef.current);
        
        toast({
            title: 'Eşleşme Tamamlandı! 🎉',
            description: 'Sohbete devam etmek için yönlendiriliyorsunuz...',
            className: 'bg-primary text-primary-foreground'
        });

        // Create a permanent conversation
        const conversationRef = await addDoc(collection(db, 'conversations'), {
            users: [currentUser.uid, partner.uid],
            lastMessage: null,
            createdAt: serverTimestamp()
        });

        setTimeout(() => {
            router.push(`/chat?conversationId=${conversationRef.id}`);
            resetState();
        }, 2000);
    }
    
     const handleChatEnd = (reason: string) => {
        if (timerRef.current) clearInterval(timerRef.current);
        toast({ title: reason, description: 'Lütfen partnerinizi puanlayın.' });
        if(shuffleSessionId) deleteDoc(doc(db, 'shuffleSessions', shuffleSessionId));
        setShuffleSessionId(null);
        setShuffleState('rating');
    };

    const handleFinishRating = () => {
        toast({ title: 'Puanınız gönderildi!', description: 'Yeni bir eşleşme arayabilirsiniz.' });
        resetState();
    };

    const resetState = () => {
        setShuffleState('idle');
        setMessages([]);
        setMessageInput('');
        setTimeLeft(TIME_LIMIT);
        setLiked(false);
        setPartnerLiked(false);
        setRating(0);
        setPartner(null);
        if (timerRef.current) clearInterval(timerRef.current);
        if(shuffleSessionId) deleteDoc(doc(db, 'shuffleSessions', shuffleSessionId));
        setShuffleSessionId(null);
        if (currentUser) deleteDoc(doc(db, 'shuffleQueue', currentUser.uid));
    }
    
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (shuffleState === 'idle') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Shuffle className="w-24 h-24 text-primary mb-6" />
                <h1 className="text-3xl font-bold font-headline mb-2">Hızlı Eşleşme</h1>
                <p className="text-muted-foreground max-w-md mb-8">
                    Rastgele bir kullanıcı ile 5 dakikalık anonim bir sohbete başla. Karşılıklı anlaşırsanız, normal sohbete geçebilirsiniz!
                </p>
                <Button size="lg" className="h-16 text-xl px-12 rounded-full" onClick={startSearch}>
                    Eşleşme Bul
                </Button>
            </div>
        );
    }

    if (shuffleState === 'searching') {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="relative w-48 h-48">
                    <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary rounded-full animate-spin border-t-transparent"></div>
                    <Avatar className="w-full h-full p-2 bg-background">
                        <AvatarImage src={currentUser?.photoURL || ''} data-ai-hint="man portrait" />
                        <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                </div>
                <h2 className="text-2xl font-semibold mt-8 animate-pulse">Eşleşme Aranıyor...</h2>
                 <Button variant="outline" className="mt-8" onClick={resetState}>İptal</Button>
            </div>
        );
    }

    if (shuffleState === 'rating') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <h1 className="text-3xl font-bold font-headline mb-2">Sohbet Bitti</h1>
                <p className="text-muted-foreground max-w-md mb-8">
                    Deneyiminizi daha iyi hale getirmemize yardımcı olmak için lütfen son partnerinizi puanlayın.
                </p>
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map(star => (
                        <Star
                            key={star}
                            className={cn(
                                "w-12 h-12 cursor-pointer transition-colors",
                                star <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/50"
                            )}
                            onClick={() => setRating(star)}
                        />
                    ))}
                </div>
                <Button size="lg" disabled={rating === 0} onClick={handleFinishRating}>
                    Puanla ve Bitir
                </Button>
            </div>
        );
    }
    
     if (shuffleState === 'matched') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                 <Loader2 className="w-24 h-24 text-primary mb-6 animate-spin" />
                <h1 className="text-3xl font-bold font-headline mb-2">Eşleşme Tamamlandı!</h1>
                <p className="text-muted-foreground max-w-md mb-8">
                    Harika! Kalıcı sohbetiniz oluşturuluyor ve yönlendiriliyorsunuz...
                </p>
            </div>
        )
     }

    return (
        <div className="flex flex-col h-full bg-background text-foreground">
            <header className="flex items-center gap-4 p-3 border-b bg-card shrink-0">
                <Avatar>
                    <AvatarImage src={partner?.avatarUrl} data-ai-hint={partner?.name} />
                    <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                    <h3 className="text-lg font-semibold">{partner?.name || 'Yabancı'}</h3>
                </div>
                <div className='flex items-center gap-4'>
                    <div className="flex items-center gap-2 text-lg font-mono font-semibold text-primary">
                        <Timer className="w-5 h-5" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="rounded-full">
                                <LogOut className="w-5 h-5"/>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Sohbetten ayrılmak istediğine emin misin?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bu işlem geri alınamaz. Ayrılırsanız bu kullanıcıyla olan tüm sohbetiniz silinir ve bir daha eşleşemeyebilirsiniz.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleChatEnd('Sohbetten ayrıldınız.')}>
                                Ayrıl
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </header>

            <ScrollArea className="flex-1 p-6 bg-muted/30">
                <div className="flex flex-col gap-4">
                    {messages.map((message) => (
                        <div key={message.id} className={cn('flex items-end gap-2 max-w-md', message.senderId === currentUser?.uid ? 'self-end flex-row-reverse' : 'self-start')}>
                            <div className={cn('rounded-xl px-4 py-2 text-sm', message.senderId === currentUser?.uid ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border rounded-bl-none')}>
                                <p>{message.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <footer className="p-4 border-t bg-card shrink-0">
                <div className="flex items-center gap-2">
                    <Button
                        size="icon"
                        variant={liked ? "default" : "outline"}
                        className={cn(
                            "rounded-full w-12 h-12 transition-all",
                             liked && "bg-green-500 hover:bg-green-600",
                             partnerLiked && !liked && "animate-pulse border-green-500 border-2 text-green-500"
                        )}
                        onClick={handleLike}
                        disabled={liked}
                    >
                        <Heart className="w-6 h-6" fill={liked ? 'currentColor' : 'transparent'} />
                    </Button>
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex-1 flex items-center gap-2">
                        <Input
                            placeholder="Bir mesaj yaz..."
                            className="flex-1 bg-muted border-none rounded-full h-12 px-5"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                        />
                        <Button type="submit" size="icon" className="rounded-full w-12 h-12 bg-primary text-primary-foreground shrink-0">
                            <SendHorizonal className="h-6 w-6" />
                        </Button>
                    </form>
                </div>
            </footer>
        </div>
    );
}
