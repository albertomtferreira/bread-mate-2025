'use client';

import { useState } from 'react';
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
import { Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const courierSchema = z.object({
  name: z.string().min(2, { message: 'Courier name must be at least 2 characters.' }),
  trackingUrl: z.string().url({ message: 'Please enter a valid URL.' }).includes('{trackingNumber}', { message: 'URL must include the {trackingNumber} placeholder.' }),
});

type CourierFormValues = z.infer<typeof courierSchema>;

interface AddCourierDialogProps {
  onCourierAdded: () => void;
}

export function AddCourierDialog({ onCourierAdded }: AddCourierDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CourierFormValues>({
    resolver: zodResolver(courierSchema),
    defaultValues: {
      name: '',
      trackingUrl: '',
    },
  });

  const resetForm = () => {
      form.reset();
  }

  async function onSubmit(values: CourierFormValues) {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'couriers'), {
        name: values.name,
        trackingUrl: values.trackingUrl,
      });

      toast({ title: 'Courier Added', description: 'The new courier has been successfully added.' });
      onCourierAdded();
      resetForm();
      setIsOpen(false);
      
    } catch (error) {
      console.error('Failed to add courier:', error);
      toast({ variant: 'destructive', title: 'Action Failed', description: 'Could not add the new courier.' });
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
          <PlusCircle className="mr-2" /> Add New Courier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a New Courier</DialogTitle>
          <DialogDescription>
            Fill in the details for the new shipping courier.
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
                    <Input placeholder="e.g., Royal Mail" {...field} disabled={isSubmitting} />
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
                    <Input
                      placeholder="https://www.courier.com/track?id={trackingNumber}"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescriptionAlt>
                    Enter the full tracking URL. Use the placeholder {'{trackingNumber}'} where the tracking number should be inserted.
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
                Add Courier
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
