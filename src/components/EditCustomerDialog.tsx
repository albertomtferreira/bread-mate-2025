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
import { Loader2, Edit, Mail, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserDetails } from '@/services/userService';
import { useAuth } from '@/contexts/AuthProvider';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const customerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  contactNumber: z.string().refine((value) => /^(?:\+44|0)7\d{9}$/.test(value), {
    message: 'Please enter a valid UK mobile number.',
  }).or(z.literal('')),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().regex(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, {
    message: 'Please enter a valid UK postcode.',
  }),
  useDifferentDeliveryAddress: z.boolean().default(false),
  deliveryAddressLine1: z.string().optional(),
  deliveryAddressLine2: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryPostcode: z.string().optional(),
}).refine(data => {
    if (data.useDifferentDeliveryAddress) {
        const hasLine1 = !!data.deliveryAddressLine1 && data.deliveryAddressLine1.length > 0;
        const hasCity = !!data.deliveryCity && data.deliveryCity.length > 0;
        const hasPostcode = !!data.deliveryPostcode && /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(data.deliveryPostcode);
        return hasLine1 && hasCity && hasPostcode;
    }
    return true;
}, {
    message: "Valid Delivery Address Line 1, City, and Postcode are required.",
    path: ['deliveryAddressLine1']
});


type CustomerFormValues = z.infer<typeof customerSchema>;

interface EditCustomerDialogProps {
  customer: any;
  onCustomerUpdate: () => void;
}

export function EditCustomerDialog({ customer, onCustomerUpdate }: EditCustomerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { sendPasswordResetEmail } = useAuth();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      contactNumber: '',
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
    if (customer && isOpen) {
      form.reset({
        name: customer.name || '',
        contactNumber: customer.contactNumber || '',
        addressLine1: customer.addressLine1 || '',
        addressLine2: customer.addressLine2 || '',
        city: customer.city || '',
        postcode: customer.postcode || '',
        useDifferentDeliveryAddress: !!customer.deliveryAddressLine1,
        deliveryAddressLine1: customer.deliveryAddressLine1 || '',
        deliveryAddressLine2: customer.deliveryAddressLine2 || '',
        deliveryCity: customer.deliveryCity || '',
        deliveryPostcode: customer.deliveryPostcode || '',
      });
    }
  }, [customer, form, isOpen]);

  async function onSubmit(values: CustomerFormValues) {
    setIsSubmitting(true);
    try {
        const detailsToSave = { ...values };

        if (!values.useDifferentDeliveryAddress) {
            detailsToSave.deliveryAddressLine1 = '';
            detailsToSave.deliveryAddressLine2 = '';
            detailsToSave.deliveryCity = '';
            detailsToSave.deliveryPostcode = '';
        }

      await updateUserDetails(customer.id, detailsToSave);
      toast({ title: 'Customer Updated', description: "The customer's details have been updated." });
      onCustomerUpdate();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update customer details.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handlePasswordReset = async () => {
    if (customer.email) {
      await sendPasswordResetEmail(customer.email);
    } else {
       toast({ variant: 'destructive', title: 'Error', description: 'This customer does not have an email address on file.' });
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
          <DialogTitle>Edit Customer Details</DialogTitle>
          <DialogDescription>
            Make changes to the customer's profile. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <h4 className="font-semibold">Personal Information</h4>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex items-center gap-2 rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                    <Mail />
                    <span>{customer.email}</span>
                </div>
            </div>
            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Separator className="my-4"/>

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
                    <FormControl><Input placeholder="Doughville" {...field} /></FormControl>
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


            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between pt-4">
                <Button type="button" variant="destructive" onClick={handlePasswordReset}>
                    <KeyRound /> Send Password Reset
                </Button>
                <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                        Cancel
                        </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
