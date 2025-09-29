
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Star } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

type Feedback = {
  id: string;
  user: {
    uid: string;
    name: string;
    avatarUrl: string;
  };
  rating: number;
  comment: string;
  createdAt: Date;
};

const formatRelativeTime = (date: Date) => {
    try {
        return formatDistanceToNowStrict(date, { addSuffix: true, locale: tr });
    } catch (e) {
        return 'bilinmiyor';
    }
};

const RatingStars = ({ rating }: { rating: number }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'}`} />
        ))}
    </div>
);

export default function FeedbackPage() {
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchFeedback = async () => {
            setLoading(true);
            try {
                const feedbackQuery = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
                const feedbackSnapshot = await getDocs(feedbackQuery);
                const feedbackData = feedbackSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: (data.createdAt as Timestamp)?.toDate(),
                    } as Feedback;
                });
                setFeedbackList(feedbackData);
            } catch (error) {
                console.error("Error fetching feedback:", error);
                toast({ variant: 'destructive', title: "Geri bildirimler alınamadı." });
            } finally {
                setLoading(false);
            }
        };
        fetchFeedback();
    }, [toast]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kullanıcı Geri Bildirimleri</CardTitle>
                <CardDescription>
                    Kullanıcıların uygulama deneyimleri hakkındaki görüşleri ve puanlamaları.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center p-10">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kullanıcı</TableHead>
                                    <TableHead>Puan</TableHead>
                                    <TableHead>Yorum</TableHead>
                                    <TableHead>Tarih</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {feedbackList.length > 0 ? feedbackList.map(feedback => (
                                    <TableRow key={feedback.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-9 h-9">
                                                    <AvatarImage src={feedback.user.avatarUrl} />
                                                    <AvatarFallback>{feedback.user.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{feedback.user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{feedback.user.uid.substring(0,10)}...</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <RatingStars rating={feedback.rating} />
                                        </TableCell>
                                        <TableCell className="max-w-sm">
                                            <p className="line-clamp-3">{feedback.comment || "Yorum yok."}</p>
                                        </TableCell>
                                        <TableCell>
                                            {formatRelativeTime(feedback.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                            Henüz geri bildirim bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
