'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthProvider';
import { updateUserDetails } from '@/services/userService';

const formSchema = z.object({
  contactNumber: z.string().refine((value) => /^(?:\+44|0)7\d{9}$/.test(value), {
    message: 'Please enter a valid UK mobile number (e.g., +447... or 07...).'
  }),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().regex(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, {
    message: 'Please enter a valid UK postcode.',
  }),
  emailComms: z.boolean().default(false),
  textComms: z.boolean().default(false),
  subscribeToNewsletter: z.boolean().default(false),
});

export type UserDetailsForm = z.infer<typeof formSchema>;

export default function SignUpDetailsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<UserDetailsForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactNumber: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postcode: '',
      emailComms: false,
      textComms: false,
    },
  });

  async function onSubmit(values: UserDetailsForm) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to save your details.',
      });
      router.push('/signup');
      return;
    }

    try {
      await updateUserDetails(user.uid, values);
      toast({
        title: 'Details Saved!',
        description: 'Your information has been successfully saved.',
      });
      router.push('/account');
    } catch (error) {
      console.error('Failed to save user details:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'There was a problem saving your details. Please try again.',
      });
    }
  }
  
    if (!user) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-11rem)] items-center justify-center py-16 text-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Loading user...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex min-h-[calc(100vh-11rem)] items-center justify-center py-12 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Tell Us More</CardTitle>
          <CardDescription>We need a few more details to complete your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+447123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Baking Lane" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2 (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Apartment, suite, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                        <Input placeholder="Bread City" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="postcode"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                        <Input placeholder="BR3 4AD" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

               <FormField
                control={form.control}
                name="emailComms"
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
                        I authorise you to send me communications via email.
                      </FormLabel>
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
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I authorise you to send me communications via text.
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
             
              <Button type="submit" className="w-full">
                Save & Continue
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
