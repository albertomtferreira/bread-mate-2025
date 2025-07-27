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
import { Loader2, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { updateUserDetails } from '@/services/userService';
import Link from 'next/link';

// Extended UserDetails for the form, including delivery address fields
type UserDetails = z.infer<typeof addressSchema>;

const addressSchema = z.object({
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
        return !!data.deliveryAddressLine1 && !!data.deliveryCity && !!data.deliveryPostcode;
    }
    return true;
}, {
    message: "Delivery address fields are required.",
    path: ['deliveryAddressLine1'] // Path to show error message on
});


interface UpdateAddressDialogProps {
  currentUserDetails: UserDetails | null;
  onAddressUpdate: (newDetails: UserDetails) => void;
}

export function UpdateAddressDialog({ currentUserDetails, onAddressUpdate }: UpdateAddressDialogProps) {

  return (
    <Button asChild variant="outline">
        <Link href="/account">
            <Pencil className="mr-2" /> Update Address
        </Link>
    </Button>
  );
}
