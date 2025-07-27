'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const imageSchema = z.object({
  alt: z.string().min(1, { message: 'Alt text is required for accessibility.' }),
  hint: z.string().min(1, { message: 'AI hint is required.' }),
  image: z
    .any()
    .refine((files) => files?.length == 1, "An image file is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

type ImageFormValues = z.infer<typeof imageSchema>;

interface AddGalleryImageDialogProps {
  onImageAdded: () => void;
}

export function AddGalleryImageDialog({ onImageAdded }: AddGalleryImageDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ImageFormValues>({
    resolver: zodResolver(imageSchema),
    defaultValues: {
      alt: '',
      hint: '',
      image: undefined,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      if (!form.getValues('alt')) {
        form.setValue('alt', file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' '));
      }
      if (!form.getValues('hint')) {
        form.setValue('hint', file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ').split(' ')[0]);
      }
    } else {
      setImagePreview(null);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form and state when dialog is closed
      form.reset();
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    setIsOpen(open);
  };

  async function onSubmit(values: ImageFormValues) {
    setIsSubmitting(true);

    try {
      const imageFile = values.image[0] as File;
      const path = `gallery/${Date.now()}-${imageFile.name}`;
      const storageRef = ref(storage, path);
      
      const uploadTask = uploadBytesResumable(storageRef, imageFile);
      await uploadTask;

      const imageUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'gallery'), {
        src: imageUrl,
        alt: values.alt,
        hint: values.hint,
        createdAt: new Date().toISOString(),
      });

      toast({ title: 'Image Added', description: 'The new image has been added to the gallery.' });
      onImageAdded();
      handleOpenChange(false); // Close dialog and trigger reset
    } catch (error) {
      console.error('Failed to add image:', error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not add the new image.' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" /> Add New Image
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a New Gallery Image</DialogTitle>
          <DialogDescription>
            Upload a new image to display in your website gallery.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image File</FormLabel>
                   <FormControl>
                      <Input
                          type="file"
                          accept={ACCEPTED_IMAGE_TYPES.join(',')}
                          disabled={isSubmitting}
                          ref={fileInputRef}
                          onChange={(e) => {
                              field.onChange(e.target.files);
                              handleImageChange(e);
                          }}
                      />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {imagePreview && (
              <div className="w-full aspect-video relative">
                 <Image src={imagePreview} alt="New image preview" fill className="rounded-md object-cover" />
              </div>
            )}
             <FormField
              control={form.control}
              name="alt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alt Text</FormLabel>
                  <FormControl>
                    <Input placeholder="A descriptive caption for the image" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="hint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Hint</FormLabel>
                  <FormControl>
                    <Input placeholder="One or two keywords for AI" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Uploading...' : 'Add Image'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
