'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const contentSchema = z.object({
  productSalesTitle: z.string().min(1, "Title is required."),
  productSalesDescription: z.string().min(1, "Description is required."),
  galleryTitle: z.string().min(1, "Title is required."),
  galleryDescription: z.string().min(1, "Description is required."),
  // Top-line Banner
  bannerEnabled: z.boolean().default(false),
  bannerText: z.string().optional(),
  // Image Banner
  imageBannerEnabled: z.boolean().default(false),
  imageBannerAlt: z.string().optional(),
  imageBannerHint: z.string().optional(),
  imageBannerImage: z
    .any()
    .optional()
    .refine((files) => !files || files?.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => !files || files?.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

export type SiteContent = z.infer<typeof contentSchema> & {
    imageBannerSrc?: string;
};

export default function ManageContentPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<SiteContent>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
        productSalesTitle: '',
        productSalesDescription: '',
        galleryTitle: '',
        galleryDescription: '',
        bannerEnabled: false,
        bannerText: '',
        imageBannerEnabled: false,
        imageBannerImage: undefined,
        imageBannerAlt: '',
        imageBannerHint: '',
    }
  });

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const contentRef = doc(db, 'siteContent', 'text');
      const contentSnap = await getDoc(contentRef);
      if (contentSnap.exists()) {
        const data = contentSnap.data() as SiteContent;
        form.reset(data);
        if(data.imageBannerSrc) {
            setImagePreview(data.imageBannerSrc);
        }
      }
    } catch (error) {
      console.error("Error fetching site content: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch site content.",
      });
    } finally {
      setLoading(false);
    }
  }, [form, toast]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
       // Keep existing image if no new file is selected
       setImagePreview(form.getValues('imageBannerSrc') || null);
    }
  };

  const onSubmit = async (data: SiteContent) => {
    setIsSaving(true);
    try {
        const contentRef = doc(db, 'siteContent', 'text');
        
        const newImageFile = data.imageBannerImage?.[0];
        let newImageUrl = form.getValues('imageBannerSrc');

        if (newImageFile) {
             const oldImageUrl = form.getValues('imageBannerSrc');
             if(oldImageUrl) {
                try {
                    await deleteObject(ref(storage, oldImageUrl));
                } catch (e: any) {
                   if (e.code !== 'storage/object-not-found') console.error("Could not delete old banner image", e);
                }
             }

            const imagePath = `siteContent/${Date.now()}-${newImageFile.name}`;
            const storageRef = ref(storage, imagePath);
            await uploadBytesResumable(storageRef, newImageFile);
            newImageUrl = await getDownloadURL(storageRef);
        }

        const dataToSave = {
            ...data,
            bannerText: data.bannerText || '',
            imageBannerSrc: newImageUrl || '',
            imageBannerAlt: data.imageBannerAlt || '',
            imageBannerHint: data.imageBannerHint || '',
        };
        // Remove the local file object before saving to Firestore
        delete (dataToSave as any).imageBannerImage;

        await setDoc(contentRef, dataToSave, { merge: true });
        toast({
            title: "Content Saved",
            description: "Your website's content has been updated."
        });
        fetchContent(); // Re-fetch to get the latest state
    } catch (error) {
        console.error("Error saving content: ", error);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Could not save the new content."
        });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
                        <CardTitle className="font-headline">Manage Website Content</CardTitle>
                        <CardDescription>Edit the text and promotional content displayed on your website.</CardDescription>
                    </div>
                     <Button type="submit" disabled={isSaving || loading}>
                        {isSaving && <Loader2 className="mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-8">
                         {/* Top Line Banner Section */}
                        <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="text-lg font-semibold font-headline">Top-line Text Banner</h3>
                            <FormField
                                control={form.control}
                                name="bannerEnabled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Enable Text Banner</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                                />
                            <FormField
                                control={form.control}
                                name="bannerText"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Banner Text</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Free delivery on orders over £30!" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                         {/* Image Banner Section */}
                        <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="text-lg font-semibold font-headline">Homepage Image Banner</h3>
                             <FormField
                                control={form.control}
                                name="imageBannerEnabled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Enable Image Banner</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={form.control}
                                name="imageBannerImage"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Banner Image</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept={ACCEPTED_IMAGE_TYPES.join(',')}
                                            disabled={isSaving}
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
                            <div className="mt-4 w-full aspect-[16/5] relative">
                                <Image src={imagePreview} alt="Banner preview" fill className="rounded-md object-cover" />
                            </div>
                            )}
                            <FormField
                                control={form.control}
                                name="imageBannerAlt"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Image Alt Text</FormLabel>
                                    <FormControl>
                                    <Input placeholder="A descriptive caption for the banner image" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="imageBannerHint"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Image AI Hint</FormLabel>
                                    <FormControl>
                                    <Input placeholder="One or two keywords for AI" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>


                        {/* Product Sales Section */}
                        <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="text-lg font-semibold font-headline">Product Sales Section</h3>
                            <FormField
                                control={form.control}
                                name="productSalesTitle"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="productSalesDescription"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Gallery Section */}
                        <div className="space-y-4 p-4 border rounded-lg">
                             <h3 className="text-lg font-semibold font-headline">Gallery Section</h3>
                             <FormField
                                control={form.control}
                                name="galleryTitle"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="galleryDescription"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
            </Card>
        </form>
    </Form>
  );
}
