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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import type { Product } from '@/types';
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
    .optional()
    .refine((files) => !files || files?.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => !files || files?.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
  allergens: z.array(z.string()).optional(),
  otherAllergen: z.string().optional(),
  hasOtherAllergen: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface EditProductDialogProps {
  product: Product;
  onProductEdited: () => void;
}

export function EditProductDialog({ product, onProductEdited }: EditProductDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(product.image);
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

  useEffect(() => {
    if (product && isOpen) {
        const standardAllergens = product.allergens?.filter(a => allergenItems.some(item => item.label === a)) || [];
        const otherAllergen = product.allergens?.find(a => !allergenItems.some(item => item.label === a)) || '';

        form.reset({
            name: product.name,
            description: product.description,
            price: product.price,
            alt: product.alt,
            hint: product.hint,
            isAvailable: product.isAvailable,
            image: undefined,
            allergens: standardAllergens,
            otherAllergen: otherAllergen,
            hasOtherAllergen: !!otherAllergen,
        });
        setImagePreview(product.image);
    }
  }, [product, form, isOpen]);

  
  const hasOtherAllergen = form.watch('hasOtherAllergen');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  async function onSubmit(values: ProductFormValues) {
    setIsSubmitting(true);

    try {
        const productUpdateData: any = {
            name: values.name,
            description: values.description,
            price: values.price,
            alt: values.alt,
            hint: values.hint,
            isAvailable: values.isAvailable,
        };

        const imageFile = values.image?.[0];
        if (imageFile) {
            const path = `products/${product.id}/${Date.now()}-${imageFile.name}`;
            const storageRef = ref(storage, path);
            await uploadBytesResumable(storageRef, imageFile);
            productUpdateData.image = await getDownloadURL(storageRef);
        }

        const finalAllergens = values.allergens || [];
        if (values.hasOtherAllergen && values.otherAllergen) {
            finalAllergens.push(values.otherAllergen);
        }
        productUpdateData.allergens = finalAllergens;
        
        const docRef = doc(db, 'products', product.id);
        await updateDoc(docRef, productUpdateData);

      toast({ title: 'Product Updated', description: 'The product has been successfully updated.' });
      onProductEdited();
      setIsOpen(false);
      
    } catch (error) {
      console.error('Failed to update product:', error);
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update the product.' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Make changes to your product. Click save when you're done.
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
                    <Input {...field} disabled={isSubmitting} />
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
                    <Input type="number" step="0.01" {...field} disabled={isSubmitting} />
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
