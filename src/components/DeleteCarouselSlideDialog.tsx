'use client';

import { useState } from 'react';
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
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { cn } from '@/lib/utils';

interface DeleteCarouselSlideDialogProps {
  slideId: string;
  imageUrl: string;
  onSlideDeleted: () => void;
}

export function DeleteCarouselSlideDialog({
  slideId,
  imageUrl,
  onSlideDeleted,
}: DeleteCarouselSlideDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // 1. Delete image from Firebase Storage
      if (imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }

      // 2. Delete document from Firestore
      await deleteDoc(doc(db, 'carousel', slideId));

      toast({
        title: 'Slide Deleted',
        description: 'The carousel slide has been successfully removed.',
      });
      onSlideDeleted();
    } catch (error: any) {
        let errorMessage = 'Could not delete the slide.';
        if (error.code === 'storage/object-not-found') {
            // If image doesn't exist, we can still delete the firestore document
             try {
                await deleteDoc(doc(db, 'carousel', slideId));
                 toast({
                    title: 'Slide Deleted',
                    description: 'The database entry was removed, but the image was not found in storage.',
                });
                onSlideDeleted();
             } catch (firestoreError) {
                 console.error('Failed to delete slide document:', firestoreError);
                 toast({ variant: 'destructive', title: 'Deletion Failed', description: 'Could not delete the slide from the database.' });
             }
        } else {
             console.error('Failed to delete slide:', error);
             toast({ variant: 'destructive', title: 'Deletion Failed', description: errorMessage });
        }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive">
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the carousel slide and its image from the server.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={isDeleting}
            className={cn(buttonVariants({ variant: "destructive" }))}
            >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Continue'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
