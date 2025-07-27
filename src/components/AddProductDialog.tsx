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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Separator } from './ui/separator';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const allergenItems = [
    { id: 'wheat', label: 'Wheat' },
    { id: 'nuts', label: 'Nuts' },
    { id: 'milk', label: 'Milk' },
    { id: 'soya', label: 'Soya' },
    { id: 'eggs', label: 'Eggs' },
];

const productSchema = z.object({
  name: z.string().min(3, { message: 'Product name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number.' }),
  alt: z.string().min(1, { message: 'Alt text is required for accessibility.' }),
  hint: z.string().min(1, { message: 'AI hint is required.' }),
  isAvailable: z.boolean().default(true),
  image: z
    .any()
    .refine((files) => files?.length == 1, "Image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
  allergens: z.array(z.string()).optional(),
  otherAllergen: z.string().optional(),
  hasOtherAllergen: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface AddProductDialogProps {
  onProductAdded: () => void;
}

export function AddProductDialog({ onProductAdded }: AddProductDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      alt: '',
      hint: '',
      isAvailable: true,
      image: undefined,
      allergens: [],
      otherAllergen: '',
      hasOtherAllergen: false,
    },
  });
  
  const hasOtherAllergen = form.watch('hasOtherAllergen');

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

  async function onSubmit(values: ProductFormValues) {
    setIsSubmitting(true);

    try {
      const imageFile = values.image[0] as File;
      const path = `products/${Date.now()}-${imageFile.name}`;
      const storageRef = ref(storage, path);
      
      const uploadTask = uploadBytesResumable(storageRef, imageFile);
      await uploadTask;

      const imageUrl = await getDownloadURL(storageRef);
      
      const finalAllergens = values.allergens || [];
      if (values.hasOtherAllergen && values.otherAllergen) {
        finalAllergens.push(values.otherAllergen);
      }

      await addDoc(collection(db, 'products'), {
        name: values.name,
        description: values.description,
        price: values.price,
        alt: values.alt,
        hint: values.hint,
        image: imageUrl,
        isAvailable: values.isAvailable,
        allergens: finalAllergens,
        createdAt: new Date().toISOString(),
      });

      toast({ title: 'Product Added', description: 'The new product has been successfully added.' });
      onProductAdded();
      resetForm();
      setIsOpen(false);
      
    } catch (error) {
      console.error('Failed to add product:', error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not add the new product.' });
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
          <PlusCircle className="mr-2" /> Add New Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a New Product</DialogTitle>
          <DialogDescription>
            Fill in the details for your new product and upload an image.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Classic Sourdough" {...field} disabled={isSubmitting} />
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
                      placeholder="e.g., A timeless classic with a tangy flavor..."
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
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (£)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 4.50" {...field} disabled={isSubmitting} />
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
            <Separator />
            <FormField
                control={form.control}
                name="isAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Available for purchase
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            <Separator />
            <FormField
                control={form.control}
                name="allergens"
                render={() => (
                    <FormItem>
                    <div className="mb-4">
                        <FormLabel className="text-base">Allergens</FormLabel>
                    </div>
                    {allergenItems.map((item) => (
                        <FormField
                        key={item.id}
                        control={form.control}
                        name="allergens"
                        render={({ field }) => {
                            return (
                            <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                            >
                                <FormControl>
                                <Checkbox
                                    checked={field.value?.includes(item.label)}
                                    onCheckedChange={(checked) => {
                                    return checked
                                        ? field.onChange([...(field.value || []), item.label])
                                        : field.onChange(
                                            (field.value || []).filter(
                                                (value) => value !== item.label
                                            )
                                        )
                                    }}
                                />
                                </FormControl>
                                <FormLabel className="font-normal">
                                {item.label}
                                </FormLabel>
                            </FormItem>
                            )
                        }}
                        />
                    ))}
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="hasOtherAllergen"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                        <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        </FormControl>
                        <FormLabel className="font-normal">
                            Other
                        </FormLabel>
                    </FormItem>
                )}
                />

                {hasOtherAllergen && (
                <FormField
                    control={form.control}
                    name="otherAllergen"
                    render={({ field }) => (
                    <FormItem className="mt-2">
                        <FormControl>
                        <Input placeholder="Specify other allergen" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Uploading...' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
