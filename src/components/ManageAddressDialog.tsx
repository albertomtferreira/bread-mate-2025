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
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { updateUserDetails } from '@/services/userService';

// This is the same schema as in UpdateAddressDialog
export const addressSchema = z.object({
  addressLine1: z.string().min(1, 'Billing address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'Billing city is required'),
  postcode: z.string().regex(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, {
    message: 'Please enter a valid UK postcode for billing.',
  }),
  useDifferentDeliveryAddress: z.boolean().default(false),
  deliveryAddressLine1: z.string().optional(),
  deliveryAddressLine2: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryPostcode: z.string().optional(),
}).refine(data => {
    if (data.useDifferentDeliveryAddress) {
        const hasLine1 = !!data.deliveryAddressLine1 && data.deliveryAddressLine1.trim().length > 0;
        const hasCity = !!data.deliveryCity && data.deliveryCity.trim().length > 0;
        const hasPostcode = !!data.deliveryPostcode && /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(data.deliveryPostcode);
        return hasLine1 && hasCity && hasPostcode;
    }
    return true;
}, {
    message: "A full delivery address (Address Line 1, City, Postcode) is required.",
    path: ['deliveryAddressLine1']
});


export type UserDetails = z.infer<typeof addressSchema>;

interface ManageAddressDialogProps {
  currentUserDetails: UserDetails | null;
  onAddressUpdate: (newDetails: Partial<UserDetails>) => void;
}

export function ManageAddressDialog({ currentUserDetails, onAddressUpdate }: ManageAddressDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<UserDetails>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      postcode: '',
      useDifferentDeliveryAddress: false,
      deliveryAddressLine1: '',
      deliveryAddressLine2: '',
      deliveryCity: '',
      deliveryPostcode: '',
    },
  });

  const useDifferentDeliveryAddress = form.watch('useDifferentDeliveryAddress');

  useEffect(() => {
    if (currentUserDetails && isOpen) {
      form.reset({
        addressLine1: currentUserDetails.addressLine1 || '',
        addressLine2: currentUserDetails.addressLine2 || '',
        city: currentUserDetails.city || '',
        postcode: currentUserDetails.postcode || '',
        useDifferentDeliveryAddress: !!currentUserDetails.deliveryAddressLine1,
        deliveryAddressLine1: currentUserDetails.deliveryAddressLine1 || '',
        deliveryAddressLine2: currentUserDetails.deliveryAddressLine2 || '',
        deliveryCity: currentUserDetails.deliveryCity || '',
        deliveryPostcode: currentUserDetails.deliveryPostcode || '',
      });
    }
  }, [currentUserDetails, form, isOpen]);

  async function onSubmit(values: UserDetails) {
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to update your address." });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
        const detailsToSave: Partial<UserDetails> = { ...values };

        if (!values.useDifferentDeliveryAddress) {
            detailsToSave.deliveryAddressLine1 = '';
            detailsToSave.deliveryAddressLine2 = '';
            detailsToSave.deliveryCity = '';
            detailsToSave.deliveryPostcode = '';
        }

      await updateUserDetails(user.uid, detailsToSave);
      onAddressUpdate(detailsToSave);
      toast({ title: "Address Updated", description: "Your addresses have been successfully updated." });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update address:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update your address. Please try again." });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Edit />
          <span className="sr-only">Manage Address</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Your Addresses</DialogTitle>
          <DialogDescription>
            Edit your billing and delivery information below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <h4 className="font-semibold text-foreground">Billing Address</h4>
            <FormField control={form.control} name="addressLine1" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl><Input placeholder="123 Baking Lane" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField control={form.control} name="addressLine2" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2 (Optional)</FormLabel>
                  <FormControl><Input placeholder="Apartment, suite, etc." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl><Input placeholder="Bread City" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField control={form.control} name="postcode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postcode</FormLabel>
                    <FormControl><Input placeholder="BR3 4AD" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField control={form.control} name="useDifferentDeliveryAddress" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Use a different delivery address</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {useDifferentDeliveryAddress && (
              <div className="space-y-4 pt-4 border-t">
                 <h4 className="font-semibold text-foreground">Delivery Address</h4>
                 <FormField control={form.control} name="deliveryAddressLine1" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl><Input placeholder="123 Delivery Street" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField control={form.control} name="deliveryAddressLine2" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2 (Optional)</FormLabel>
                      <FormControl><Input placeholder="Apartment, suite, etc." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                   <FormField control={form.control} name="deliveryCity" render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl><Input placeholder="Shipmenton" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField control={form.control} name="deliveryPostcode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl><Input placeholder="SH1 9PA" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
               <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
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
