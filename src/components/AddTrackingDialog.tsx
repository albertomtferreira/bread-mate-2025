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
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Loader2, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Order } from '@/types';
import type { Courier } from '@/app/admin/couriers/page';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { updateOrderStatus } from '@/services/orderService';


const trackingSchema = z.object({
  courierId: z.string().min(1, { message: 'Please select a courier.' }),
  trackingNumber: z.string().min(1, { message: 'Tracking number is required.' }),
});

type TrackingFormValues = z.infer<typeof trackingSchema>;

interface AddTrackingDialogProps {
  order: Order;
}

export function AddTrackingDialog({ order }: AddTrackingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const { toast } = useToast();

  const form = useForm<TrackingFormValues>({
    resolver: zodResolver(trackingSchema),
    defaultValues: {
      courierId: order.trackingProvider || '',
      trackingNumber: order.trackingNumber || '',
    },
  });

  useEffect(() => {
      const fetchCouriers = async () => {
          if(isOpen) {
              const couriersCollection = collection(db, 'couriers');
              const courierSnapshot = await getDocs(couriersCollection);
              const courierList = courierSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Courier));
              setCouriers(courierList);
          }
      };
      fetchCouriers();
  }, [isOpen]);

  async function onSubmit(values: TrackingFormValues) {
    setIsSubmitting(true);
    
    try {
      const selectedCourier = couriers.find(c => c.id === values.courierId);
      if (!selectedCourier) {
          throw new Error('Selected courier not found.');
      }

      await updateOrderStatus({ 
        order, 
        status: 'Shipped',
        trackingDetails: {
            trackingProvider: selectedCourier.name,
            trackingUrl: selectedCourier.trackingUrl,
            trackingNumber: values.trackingNumber
        }
    });

      toast({
        title: 'Order Shipped!',
        description: 'Tracking details have been saved and the order is marked as shipped.',
      });
      setIsOpen(false);
    } catch (error: any) {
      console.error('Failed to update order:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not save tracking details. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isShipped = order.status === 'Shipped' || order.status === 'Delivered' || order.status === 'Cancelled';
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isShipped}>
              <Truck />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
            <p>{isShipped ? 'Order has already been shipped' : 'Mark as Shipped & Add Tracking'}</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Tracking Information</DialogTitle>
          <DialogDescription>
            Select the courier and enter the tracking number for order #{order.id.substring(0, 7)}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="courierId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Courier / Provider</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a courier" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {couriers.map(courier => (
                            <SelectItem key={courier.id} value={courier.id}>{courier.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
              control={form.control}
              name="trackingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AB123456789GB" {...field} />
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
                Save & Mark as Shipped
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
