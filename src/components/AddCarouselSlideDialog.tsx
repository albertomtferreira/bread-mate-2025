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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const slideSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  alt: z.string().min(1, { message: 'Alt text is required for accessibility.' }),
  hint: z.string().min(1, { message: 'AI hint is required.' }),
  image: z
    .any()
    .refine((files) => files?.length == 1, "Image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

type SlideFormValues = z.infer<typeof slideSchema>;

interface AddCarouselSlideDialogProps {
  onSlideAdded: () => void;
}

export function AddCarouselSlideDialog({ onSlideAdded }: AddCarouselSlideDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SlideFormValues>({
    resolver: zodResolver(slideSchema),
    defaultValues: {
      title: '',
      description: '',
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

  const resetForm = () => {
      form.reset();
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
  }

  async function onSubmit(values: SlideFormValues) {
    setIsSubmitting(true);

    try {
      const imageFile = values.image[0] as File;
      const path = `carousel/${Date.now()}-${imageFile.name}`;
      const storageRef = ref(storage, path);
      
      const uploadTask = uploadBytesResumable(storageRef, imageFile);
      await uploadTask;

      const imageUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'carousel'), {
        title: values.title,
        description: values.description,
        alt: values.alt,
        hint: values.hint,
        image: imageUrl,
        createdAt: new Date().toISOString(),
      });

      toast({ title: 'Slide Added', description: 'The new slide has been added to the carousel.' });
      onSlideAdded();
      resetForm();
      setIsOpen(false);
      
    } catch (error) {
      console.error('Failed to add slide:', error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not add the new slide.' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
            resetForm();
        }
    }}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" /> Add New Slide
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a New Carousel Slide</DialogTitle>
          <DialogDescription>
            Fill in the details for your new slide and upload an image.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Handcrafted Perfection" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Experience the taste of tradition..."
                      className="resize-none"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image</FormLabel>
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
                  <div className="mt-4 w-full aspect-video relative">
                     <Image src={imagePreview} alt="Image preview" fill className="rounded-md object-cover" />
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
                {isSubmitting ? 'Uploading...' : 'Add Slide'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
