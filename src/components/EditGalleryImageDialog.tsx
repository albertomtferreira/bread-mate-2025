'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Loader2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import type { GalleryImage } from '@/app/admin/gallery/page';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const imageSchema = z.object({
  alt: z.string().min(1, { message: 'Alt text is required for accessibility.' }),
  hint: z.string().min(1, { message: 'AI hint is required.' }),
  image: z
    .any()
    .optional()
    .refine((files) => !files || files?.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => !files || files?.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

type ImageFormValues = z.infer<typeof imageSchema>;

interface EditGalleryImageDialogProps {
  image: GalleryImage;
  onImageEdited: () => void;
}

export function EditGalleryImageDialog({ image, onImageEdited }: EditGalleryImageDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(image.src);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ImageFormValues>({
    resolver: zodResolver(imageSchema),
    defaultValues: {
      alt: image.alt,
      hint: image.hint,
      image: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        alt: image.alt,
        hint: image.hint,
        image: undefined,
      });
      setImagePreview(image.src);
    }
  }, [isOpen, image, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  async function onSubmit(values: ImageFormValues) {
    setIsSubmitting(true);

    try {
      const imageUpdateData: any = {
        alt: values.alt,
        hint: values.hint,
      };

      const newImageFile = values.image?.[0];

      if (newImageFile) {
        // Delete the old image if it exists
        if (image.src) {
            try {
                const oldImageRef = ref(storage, image.src);
                await deleteObject(oldImageRef);
            } catch (error: any) {
                // It's ok if the old image doesn't exist.
                if (error.code !== 'storage/object-not-found') {
                    throw error;
                }
            }
        }
        
        // Upload new image
        const path = `gallery/${Date.now()}-${newImageFile.name}`;
        const storageRef = ref(storage, path);
        await uploadBytesResumable(storageRef, newImageFile);
        imageUpdateData.src = await getDownloadURL(storageRef);
      }

      const docRef = doc(db, 'gallery', image.id);
      await updateDoc(docRef, imageUpdateData);

      toast({ title: 'Image Updated', description: 'The gallery image has been successfully updated.' });
      onImageEdited();
      setIsOpen(false);
      
    } catch (error) {
      console.error('Failed to update image:', error);
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update the image.' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Edit />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Gallery Image</DialogTitle>
          <DialogDescription>
            Make changes to the image details or upload a new one.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Replace Image (Optional)</FormLabel>
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
                  <div className="mt-4 w-full aspect-square relative">
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
                    <Input {...field} disabled={isSubmitting} />
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
                    <Input {...field} disabled={isSubmitting} />
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
