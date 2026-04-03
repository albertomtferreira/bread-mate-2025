'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserDetailsForm } from '@/app/signup/details/page';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { ManageAddressDialog, type UserDetails as AddressDetails } from '@/components/ManageAddressDialog';
import { PayPalDialog } from '@/components/PayPalDialog';
import { createOrder } from '@/services/orderService';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { OrderSuccessDialog } from '@/components/OrderSuccessDialog';


type UserDetails = UserDetailsForm & {
  deliveryAddressLine1?: string;
  deliveryAddressLine2?: string;
  deliveryCity?: string;
  deliveryPostcode?: string;
};

const guestCheckoutSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  customerEmail: z.string().email('A valid email is required'),
  contactNumber: z.string().refine((value) => /^(?:\+44|0)7\d{9}$/.test(value), {
    message: 'Please enter a valid UK mobile number.'
  }),
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
  subscribeToNewsletter: z.boolean().default(false),
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


const AddressDisplay = ({ address }: { address: Partial<UserDetailsForm> }) => {
    if (!address.addressLine1 || !address.city || !address.postcode) {
        return <p className="text-muted-foreground">No address provided.</p>;
    }
    return (
        <address className="not-italic text-sm text-muted-foreground">
        {address.addressLine1}
        <br />
        {address.addressLine2 && (
          <>
            {address.addressLine2}
            <br />
          </>
        )}
        {address.city}, {address.postcode}
      </address>
    )
}

export default function CheckoutDetailsPage() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<'billing' | 'delivery'>('delivery');
  const router = useRouter();
  const { toast } = useToast();
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);

  const deliveryFee = cartItems.length > 0 ? 2.0 : 0;
  const subtotal = getCartTotal();
  const total = subtotal + deliveryFee;

  const guestForm = useForm<z.infer<typeof guestCheckoutSchema>>({
    resolver: zodResolver(guestCheckoutSchema),
    defaultValues: {
        customerName: '',
        customerEmail: '',
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
        subscribeToNewsletter: false,
    },
  });

  const fetchUserDetails = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUserDetails(docSnap.data() as UserDetails);
        }
      }
    };

  useEffect(() => {
    if (cartItems.length === 0 && !completedOrderId) {
        router.replace('/checkout');
    }
    fetchUserDetails();
  }, [user, cartItems, router, completedOrderId]);
  
  const handleAddressUpdate = (newDetails: Partial<AddressDetails>) => {
    setUserDetails(prev => {
        if (!prev) return null;
        return {
            ...prev,
            ...newDetails,
            // Map the AddressDetails fields to UserDetails fields if they have different names
            deliveryAddressLine1: newDetails.deliveryAddressLine1,
            deliveryAddressLine2: newDetails.deliveryAddressLine2,
            deliveryCity: newDetails.deliveryCity,
            deliveryPostcode: newDetails.deliveryPostcode,
        } as UserDetails;
    });
  }
  
  const billingAddress = {
    addressLine1: userDetails?.addressLine1,
    addressLine2: userDetails?.addressLine2,
    city: userDetails?.city,
    postcode: userDetails?.postcode,
  };
  
  const hasDeliveryAddress = userDetails?.deliveryAddressLine1;

  const deliveryAddress = {
    addressLine1: hasDeliveryAddress ? userDetails.deliveryAddressLine1 : userDetails?.addressLine1,
    addressLine2: hasDeliveryAddress ? userDetails.deliveryAddressLine2 : userDetails?.addressLine2,
    city: hasDeliveryAddress ? userDetails.deliveryCity : userDetails?.city,
    postcode: hasDeliveryAddress ? userDetails.deliveryPostcode : userDetails?.postcode,
  };
  
  const useDifferentDeliveryAddress = guestForm.watch('useDifferentDeliveryAddress');
  
  const handlePaymentConfirmation = async (): Promise<string | null> => {
    let orderPayload;
    
    if (user) {
        const finalAddress = selectedAddress === 'billing' ? billingAddress : deliveryAddress;
        if (!finalAddress?.addressLine1) {
             toast({
                variant: "destructive",
                title: "Invalid Address",
                description: "Please select a valid address before proceeding."
            });
            return null;
        }
        orderPayload = {
            userId: user?.uid,
            customerName: user.name || 'N/A',
            customerEmail: user.email || 'N/A',
            items: cartItems,
            total: total,
            deliveryAddress: {
                addressLine1: finalAddress.addressLine1,
                addressLine2: finalAddress.addressLine2 || '',
                city: finalAddress.city || '',
                postcode: finalAddress.postcode || ''
            },
            subscribeToNewsletter: userDetails?.subscribeToNewsletter || false,
        };
    } else {
        const isGuestFormValid = await guestForm.trigger();
        if (!isGuestFormValid) {
            toast({
                variant: "destructive",
                title: "Invalid Details",
                description: "Please fill in all required fields correctly."
            });
            return null;
        }
        const guestData = guestForm.getValues();
        orderPayload = {
            customerName: guestData.customerName,
            customerEmail: guestData.customerEmail,
            items: cartItems,
            total: total,
            addressLine1: guestData.addressLine1 || '',
            addressLine2: guestData.addressLine2 || '',
            city: guestData.city || '',
            postcode: guestData.postcode || '',
            deliveryAddressLine1: guestData.deliveryAddressLine1 || '',
            deliveryAddressLine2: guestData.deliveryAddressLine2 || '',
            deliveryCity: guestData.deliveryCity || '',
            deliveryPostcode: guestData.deliveryPostcode || '',
            subscribeToNewsletter: guestData.subscribeToNewsletter
        }
    }

    try {
        const newOrderId = await createOrder(orderPayload);
        
        if (newOrderId) {
            toast({
                title: "Order Placed!",
                description: "Your order has been successfully processed."
            });
            clearCart();
            setCompletedOrderId(newOrderId); 
            return newOrderId;
        } else {
            throw new Error('Order creation failed to return an ID.');
        }
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Order Failed',
            description: 'There was a problem placing your order. Please try again.'
        });
        return null;
    }
  };

  const handleDialogClose = () => {
    setCompletedOrderId(null);
    router.push('/');
  }

  return (
    <>
    <OrderSuccessDialog orderId={completedOrderId} onOpenChange={(open) => !open && handleDialogClose()} />
    <div className="container mx-auto py-16 bg-background">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold">Checkout Details</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Please confirm your details to complete the order.
        </p>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="md:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="font-headline">{user ? "Delivery Address" : "Your Details"}</CardTitle>
                    {user && (
                        <ManageAddressDialog
                            currentUserDetails={userDetails ? {
                                addressLine1: userDetails.addressLine1,
                                addressLine2: userDetails.addressLine2,
                                city: userDetails.city,
                                postcode: userDetails.postcode,
                                useDifferentDeliveryAddress: !!userDetails.deliveryAddressLine1,
                                deliveryAddressLine1: userDetails.deliveryAddressLine1,
                                deliveryAddressLine2: userDetails.deliveryAddressLine2,
                                deliveryCity: userDetails.deliveryCity,
                                deliveryPostcode: userDetails.deliveryPostcode,
                            } : null}
                            onAddressUpdate={handleAddressUpdate}
                        />
                    )}
                </div>
                {!user && <CardDescription>Please enter your details and delivery address below.</CardDescription>}
                </CardHeader>
                <CardContent>
                {user ? (
                    <RadioGroup value={selectedAddress} onValueChange={(value) => setSelectedAddress(value as 'billing' | 'delivery')} className="space-y-4">
                    <div onClick={() => setSelectedAddress('billing')} className={cn("flex flex-col gap-2 rounded-md border p-4 transition-colors hover:bg-accent/50 cursor-pointer", selectedAddress === 'billing' && "bg-accent/10 border-primary")}>
                        <div className="flex items-center gap-4">
                            <RadioGroupItem value="billing" id="billing" />
                            <span className="font-semibold">Billing Address</span>
                        </div>
                        <AddressDisplay address={billingAddress} />
                    </div>
                    
                    <div onClick={() => setSelectedAddress('delivery')} className={cn("flex flex-col gap-2 rounded-md border p-4 transition-colors hover:bg-accent/50 cursor-pointer", selectedAddress === 'delivery' && "bg-accent/10 border-primary")}>
                        <div className="flex items-center gap-4">
                            <RadioGroupItem value="delivery" id="delivery" />
                            <span className="font-semibold">Delivery Address</span>
                        </div>
                        <AddressDisplay address={deliveryAddress} />
                    </div>
                    </RadioGroup>
                ) : (
                    <Form {...guestForm}>
                        <form id="guest-address-form" className="space-y-4">
                        <FormField control={guestForm.control} name="customerName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl><Input placeholder="Your Name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={guestForm.control} name="customerEmail" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl><Input placeholder="your@email.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={guestForm.control} name="contactNumber" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Number</FormLabel>
                                    <FormControl><Input placeholder="07123456789" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            <Separator />
                            <h4 className="font-semibold pt-2">Billing Address</h4>
                            
                            <FormField control={guestForm.control} name="addressLine1" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Street Address</FormLabel>
                                    <FormControl><Input placeholder="123 Baking Lane" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={guestForm.control} name="addressLine2" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Apt, suite, etc. (Optional)</FormLabel>
                                    <FormControl><Input placeholder="Apt, suite, etc." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={guestForm.control} name="city" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl><Input placeholder="Bread City" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={guestForm.control} name="postcode" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Postcode</FormLabel>
                                        <FormControl><Input placeholder="BR3 4AD" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <FormField control={guestForm.control} name="useDifferentDeliveryAddress" render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Use a different delivery address</FormLabel>
                                </div>
                                </FormItem>
                            )} />
                            
                            {useDifferentDeliveryAddress && (
                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="font-semibold text-foreground">Delivery Address</h4>
                                    <FormField control={guestForm.control} name="deliveryAddressLine1" render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Address Line 1</FormLabel>
                                        <FormControl><Input placeholder="123 Delivery Street" {...field} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={guestForm.control} name="deliveryAddressLine2" render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Address Line 2 (Optional)</FormLabel>
                                        <FormControl><Input placeholder="Apartment, suite, etc." {...field} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="grid grid-cols-2 gap-4">
                                    <FormField control={guestForm.control} name="deliveryCity" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City</FormLabel>
                                            <FormControl><Input placeholder="Shipmenton" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )} />
                                    <FormField control={guestForm.control} name="deliveryPostcode" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Postcode</FormLabel>
                                            <FormControl><Input placeholder="SH1 9PA" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )} />
                                    </div>
                                </div>
                            )}
                            <Separator />
                            <FormField
                                control={guestForm.control}
                                name="subscribeToNewsletter"
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
                                            I would like to receive news and offers via email.
                                        </FormLabel>
                                    </div>
                                    </FormItem>
                                )}
                            />

                        </form>
                    </Form>
                )}
                </CardContent>
            </Card>
            </div>
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                    <CardTitle className="font-headline">Payment</CardTitle>
                    <CardDescription>Click the button below to finalize your payment with PayPal.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 mb-4">
                            <h3 className="font-semibold">Order Summary</h3>
                             <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>£{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Delivery</span>
                                <span>£{deliveryFee.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>£{total.toFixed(2)}</span>
                            </div>
                        </div>
                        <PayPalDialog 
                            total={total}
                            onConfirm={handlePaymentConfirmation}
                            disabled={(user && !billingAddress.addressLine1) || (user && !deliveryAddress.addressLine1 && selectedAddress === 'delivery') || false}
                        />
                         <Button variant="link" className="w-full mt-2" onClick={() => router.push('/checkout')}>
                            Back to Basket
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
    </>
  );
}
