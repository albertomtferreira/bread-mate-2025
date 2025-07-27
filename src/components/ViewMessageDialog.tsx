'use client';

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

interface ViewMessageDialogProps {
  message: ContactMessage;
  children?: React.ReactNode;
  onOpen?: () => void;
}

export function ViewMessageDialog({ message, children, onOpen }: ViewMessageDialogProps) {
  
  const handleOpen = () => {
    if(onOpen) {
      onOpen();
    }
  }

  return (
    <Dialog onOpenChange={(open) => open && handleOpen()}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Message from {message.name}</DialogTitle>
          <DialogDescription>
            Received on {new Date(message.createdAt.seconds * 1000).toLocaleString('en-GB')}
          </DialogDescription>
        </DialogHeader>
        
        <Separator />
        
        <div className="py-4 whitespace-pre-wrap">
            <p className="text-sm text-foreground">{message.message}</p>
        </div>
        
        <Separator />

        <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center pt-4">
            <div className="text-sm text-muted-foreground">
                <a href={`mailto:${message.email}`} className="hover:underline">{message.email}</a>
            </div>
            {/* Future Reply Button can go here */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
