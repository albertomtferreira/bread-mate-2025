'use client';

import { useState, useEffect } from 'react';
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
  FormDescription as FormDescriptionAlt,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Courier } from '@/app/admin/couriers/page';

const courierSchema = z.object({
  name: z.string().min(2, { message: 'Courier name must be at least 2 characters.' }),
  trackingUrl: z.string().url({ message: 'Please enter a valid URL.' }).includes('{trackingNumber}', { message: 'URL must include the {trackingNumber} placeholder.' }),
});

type CourierFormValues = z.infer<typeof courierSchema>;

interface EditCourierDialogProps {
  courier: Courier;
  onCourierEdited: () => void;
}

export function EditCourierDialog({ courier, onCourierEdited }: EditCourierDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CourierFormValues>({
    resolver: zodResolver(courierSchema),
    defaultValues: {
      name: courier.name,
      trackingUrl: courier.trackingUrl,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: courier.name,
        trackingUrl: courier.trackingUrl,
      });
    }
  }, [isOpen, courier, form]);


  async function onSubmit(values: CourierFormValues) {
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'couriers', courier.id);
      await updateDoc(docRef, values);

      toast({ title: 'Courier Updated', description: 'The courier details have been successfully updated.' });
      onCourierEdited();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update courier:', error);
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update the courier.' });
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Courier</DialogTitle>
          <DialogDescription>
            Make changes to the courier's details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Courier Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trackingUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking URL</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescriptionAlt>
                    Use the placeholder {'{trackingNumber}'} where the tracking number should go.
                  </FormDescriptionAlt>
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
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
