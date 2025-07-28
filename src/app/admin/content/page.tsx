
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
import { Separator } from '@/components/ui/separator';

const contentSchema = z.object({
  productSalesTitle: z.string().min(1, "Title is required."),
  productSalesDescription: z.string().min(1, "Description is required."),
  galleryTitle: z.string().min(1, "Title is required."),
  galleryDescription: z.string().min(1, "Description is required."),
});

export type SiteContent = z.infer<typeof contentSchema>;

export default function ManageContentPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<SiteContent>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
        productSalesTitle: '',
        productSalesDescription: '',
        galleryTitle: '',
        galleryDescription: '',
    }
  });

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const contentRef = doc(db, 'siteContent', 'text');
      const contentSnap = await getDoc(contentRef);
      if (contentSnap.exists()) {
        form.reset(contentSnap.data() as SiteContent);
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

  const onSubmit = async (data: SiteContent) => {
    setIsSaving(true);
    try {
        const contentRef = doc(db, 'siteContent', 'text');
        await setDoc(contentRef, data, { merge: true });
        toast({
            title: "Content Saved",
            description: "Your website's text has been updated."
        });
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
                        <CardDescription>Edit the text displayed on various parts of your website.</CardDescription>
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
