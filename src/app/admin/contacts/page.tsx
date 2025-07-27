'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Eye, Archive, ArchiveRestore, Inbox } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, where, doc, updateDoc, Timestamp, or } from 'firebase/firestore';
import { ViewMessageDialog } from '@/components/ViewMessageDialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface ContactMessage {
    id: string;
    name: string;
    email: string;
    message: string;
    createdAt: Timestamp;
    status?: 'new' | 'read' | 'archived'; // Status is now optional
}

export default function ManageContactsPage() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [newMessageCount, setNewMessageCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'inbox' | 'archived'>('inbox');
    const { toast } = useToast();

    useEffect(() => {
        setLoading(true);
        const messagesCollection = collection(db, 'contacts');
        
        let q;
        if (view === 'inbox') {
            q = query(messagesCollection, 
                or(where('status', 'in', ['new', 'read']), where('status', '==', null)), 
                orderBy('createdAt', 'desc')
            );
        } else { // archived
            q = query(messagesCollection, where('status', '==', 'archived'), orderBy('createdAt', 'desc'));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage));
            setMessages(fetchedMessages);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            toast({ variant: 'destructive', title: 'Error Fetching Messages', description: error.message });
            setLoading(false);
        });

        // Separate listener for the "new" message count badge
        const newMessagesQuery = query(messagesCollection, 
             or(where('status', '==', 'new'), where('status', '==', null))
        );
        const unsubscribeCount = onSnapshot(newMessagesQuery, (snapshot) => {
            setNewMessageCount(snapshot.size);
        });


        return () => {
            unsubscribe();
            unsubscribeCount();
        };
    }, [view, toast]);

    const handleStatusChange = async (messageId: string, newStatus: ContactMessage['status']) => {
        const messageRef = doc(db, 'contacts', messageId);
        try {
            await updateDoc(messageRef, { status: newStatus });
            toast({
                title: 'Message Updated',
                description: `The message has been moved to ${newStatus === 'archived' ? 'the archive' : 'the inbox'}.`
            });
        } catch (error) {
            console.error('Failed to update message status:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update message status.' });
        }
    };
    
    const markMessageAsRead = useCallback(async (messageId: string) => {
         const messageRef = doc(db, 'contacts', messageId);
         try {
            await updateDoc(messageRef, { status: 'read' });
         } catch (error) {
            console.error('Failed to mark message as read:', error);
         }
    }, []);

    const handleMessageViewed = useCallback(async (message: ContactMessage) => {
        if (message.status === 'new' || !message.status) {
            await markMessageAsRead(message.id);
        }
    },[markMessageAsRead]);


    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between mb-4">
                    <Button variant="outline" asChild>
                        <Link href="/admin">
                            <ArrowLeft className="mr-2" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="font-headline">
                            Contact Messages
                        </CardTitle>
                        <CardDescription>View and manage messages from your customers.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant={view === 'inbox' ? 'default' : 'outline'} onClick={() => setView('inbox')} className="relative">
                            <Inbox className="mr-2" /> Inbox
                             {newMessageCount > 0 && (
                                <Badge variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full">
                                    {newMessageCount}
                                </Badge>
                            )}
                        </Button>
                        <Button variant={view === 'archived' ? 'default' : 'outline'} onClick={() => setView('archived')}>
                            <Archive className="mr-2" /> Archived
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>From</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {messages.map((message) => (
                                <TableRow key={message.id} className={cn((message.status === 'new' || !message.status) && 'font-bold')}>
                                    <TableCell>{new Date(message.createdAt.seconds * 1000).toLocaleDateString('en-GB')}</TableCell>
                                    <TableCell>{message.name}</TableCell>
                                    <TableCell>{message.email}</TableCell>
                                    <TableCell>
                                        { (message.status === 'new' || !message.status) && <Badge variant="default">New</Badge>}
                                        { message.status === 'read' && <Badge variant="secondary">Read</Badge>}
                                        { message.status === 'archived' && <Badge variant="outline">Archived</Badge>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ViewMessageDialog message={message} onOpen={() => handleMessageViewed(message)}>
                                            <Button variant="ghost" size="icon">
                                                <Eye />
                                            </Button>
                                        </ViewMessageDialog>
                                         {view === 'inbox' ? (
                                            <Button variant="ghost" size="icon" onClick={() => handleStatusChange(message.id, 'archived')}>
                                                <Archive />
                                            </Button>
                                        ) : (
                                            <Button variant="ghost" size="icon" onClick={() => handleStatusChange(message.id, 'read')}>
                                                <ArchiveRestore />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                 { !loading && messages.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        <p>No {view === 'inbox' ? 'new' : 'archived'} messages found.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
