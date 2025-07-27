
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
import { Separator } from './ui/separator';

const passwordStrengthSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character.');

const accountSchema = z
  .object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    contactNumber: z.string().refine((value) => /^(?:\+44|0)7\d{9}$/.test(value), {
      message: 'Please enter a valid UK mobile number.',
    }),
    emailComms: z.boolean().default(false),
    textComms: z.boolean().default(false),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmNewPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword || data.confirmNewPassword) {
        return !!data.currentPassword;
      }
      return true;
    },
    {
      message: 'Current password is required to set a new one.',
      path: ['currentPassword'],
    }
  )
  .refine(
    (data) => {
      if (data.newPassword) {
        return passwordStrengthSchema.safeParse(data.newPassword).success;
      }
      return true;
    },
    {
      message:
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special characters.',
      path: ['newPassword'],
    }
  )
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match.",
    path: ['confirmNewPassword'],
  });

type AccountFormValues = z.infer<typeof accountSchema>;

interface UpdateAccountDialogProps {
  currentUserDetails: any; // Can be improved with a proper type
  onAccountUpdate: (newDetails: Partial<AccountFormValues>) => void;
}

export function UpdateAccountDialog({ currentUserDetails, onAccountUpdate }: UpdateAccountDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, updatePassword, reauthenticate, updateProfile } = useAuth();
  const { toast } = useToast();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      contactNumber: '',
      emailComms: false,
      textComms: false,
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  useEffect(() => {
    if (currentUserDetails && user) {
      form.reset({
        name: user.name || '',
        contactNumber: currentUserDetails.contactNumber || '',
        emailComms: currentUserDetails.emailComms || false,
        textComms: currentUserDetails.textComms || false,
      });
    }
  }, [currentUserDetails, user, form, isOpen]);

  async function onSubmit(values: AccountFormValues) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to update your details.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const detailsToSave: Partial<AccountFormValues> = {
        name: values.name,
        contactNumber: values.contactNumber,
        emailComms: values.emailComms,
        textComms: values.textComms,
      };

      // Update Firestore
      await updateUserDetails(user.uid, detailsToSave);
      
      // Update Auth display name if it has changed
      if (values.name !== user.name) {
        await updateProfile({ displayName: values.name });
      }

      // Update local state on account page
      onAccountUpdate(detailsToSave);
      toast({ title: 'Details Updated', description: 'Your account details have been updated.' });

      if (values.newPassword && values.currentPassword) {
        const isReauthenticated = await reauthenticate(values.currentPassword);
        if(isReauthenticated){
            await updatePassword(values.newPassword);
            toast({ title: 'Password Updated', description: 'Your password has been successfully changed.' });
        } else {
             toast({ variant: 'destructive', title: 'Authentication Failed', description: 'The current password you entered is incorrect.' });
        }
      }
      
      setIsOpen(false);
    } catch (error: any) {
      console.error('Failed to update account:', error);
      let description = "Could not update your account. Please try again.";
      if (error.code === 'auth/wrong-password') {
        description = "The current password you entered is incorrect.";
      }
       toast({ variant: 'destructive', title: 'Update Failed', description });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Pencil className="mr-2" /> Update Details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Your Details</DialogTitle>
          <DialogDescription>
            Make changes to your personal information here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <h4 className="font-semibold text-foreground">Personal Information</h4>
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

            <h4 className="font-semibold text-foreground pt-2">Communication Preferences</h4>
             <FormField
                control={form.control}
                name="emailComms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Receive marketing and promotional emails.</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="textComms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Receive marketing and promotional texts.</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            
            <Separator className="my-4"/>

            <h4 className="font-semibold text-foreground">Change Password</h4>
             <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
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
