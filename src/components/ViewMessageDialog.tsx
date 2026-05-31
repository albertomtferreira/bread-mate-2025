'use client';

import { useState } from 'react';
import type { ContactMessage } from '@/app/admin/contacts/page';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getAuth } from 'firebase/auth';
import { Mail, Send, Reply, History, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';

interface ViewMessageDialogProps {
  message: ContactMessage;
  children?: React.ReactNode;
  onOpen?: () => void;
}

export function ViewMessageDialog({ message, children, onOpen }: ViewMessageDialogProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  
  const handleOpen = () => {
    if(onOpen) {
      onOpen();
    }
  }

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;

    setSending(true);
    try {
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();

        const response = await fetch('/api/contact/reply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                contactId: message.id,
                replyMessage: replyMessage
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to send reply');
        }

        toast({
            title: "Reply Sent",
            description: `Your response has been emailed to ${message.name}.`
        });
        setIsReplying(false);
        setReplyMessage('');
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error Sending Reply",
            description: error.message
        });
    } finally {
        setSending(false);
    }
  }

  return (
    <Dialog onOpenChange={(open) => open && handleOpen()}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Message from {message.name}</DialogTitle>
            {message.status === 'replied' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <History className="w-3 h-3 mr-1" /> Replied
                </Badge>
            )}
          </div>
          <DialogDescription>
            Received on {new Date(message.createdAt.seconds * 1000).toLocaleString('en-GB')}
          </DialogDescription>
        </DialogHeader>
        
        <Separator />
        
        <div className="py-4 space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-1 text-muted-foreground">Original Message:</p>
                <div className="text-sm text-foreground whitespace-pre-wrap">{message.message}</div>
            </div>

            {message.replyBody && !isReplying && (
                <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg ring-1 ring-primary/20">
                     <p className="text-sm font-semibold mb-1 text-primary flex items-center">
                        <History className="w-4 h-4 mr-1" /> Your Last Reply:
                    </p>
                    <div className="text-sm text-foreground whitespace-pre-wrap">{message.replyBody}</div>
                    {message.repliedAt && (
                        <p className="text-[10px] text-muted-foreground mt-2">
                             Replied on {new Date(message.repliedAt.seconds * 1000).toLocaleString('en-GB')}
                        </p>
                    )}
                </div>
            )}

            {isReplying && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center text-sm font-semibold text-primary">
                        <Reply className="w-4 h-4 mr-1" /> Composition Reply
                    </div>
                    <Textarea 
                        placeholder="Write your email reply here..."
                        className="min-h-[150px] resize-none"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        disabled={sending}
                    />
                </div>
            )}
        </div>
        
        <Separator />

        <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center gap-4 pt-2">
            <div className="text-sm text-muted-foreground flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                <a href={`mailto:${message.email}`} className="hover:underline hover:text-primary transition-colors">
                    {message.email}
                </a>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
                {isReplying ? (
                    <>
                        <Button variant="ghost" onClick={() => setIsReplying(false)} disabled={sending}>
                            Cancel
                        </Button>
                        <Button onClick={handleSendReply} disabled={sending}>
                            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Send Message
                        </Button>
                    </>
                ) : (
                    <Button onClick={() => setIsReplying(true)}>
                        <Reply className="w-4 h-4 mr-2" />
                        {message.status === 'replied' ? 'Reply Again' : 'Reply'}
                    </Button>
                )}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
