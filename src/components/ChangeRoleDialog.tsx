'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { KeyRound, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { setUserAdminStatus } from '@/services/userService';
import { useAuth } from '@/contexts/AuthProvider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChangeRoleDialogProps {
  customer: {
    id: string;
    name: string;
    isAdmin?: boolean;
  };
  onRoleChange: () => void;
}

export function ChangeRoleDialog({ customer, onRoleChange }: ChangeRoleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth(); // Get the current authenticated user

  const isSelf = user?.uid === customer.id;

  const handleRoleChange = async () => {
    setIsSubmitting(true);
    const newIsAdmin = !customer.isAdmin;
    try {
      await setUserAdminStatus(customer.id, newIsAdmin);
      toast({
        title: 'Role Changed',
        description: `${customer.name}'s role has been successfully updated.`,
      });
      onRoleChange();
    } catch (error: any) {
      console.error('Failed to change role:', error);
      toast({
        variant: 'destructive',
        title: 'Change Failed',
        description:
          error.message ||
          'Could not update the user role. Please check your permissions and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If the user is viewing themselves, render a disabled button inside a tooltip.
  if (isSelf) {
    return (
       <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* The button is wrapped in a span so the tooltip can attach to it even when disabled */}
             <span tabIndex={0}>
                <Button
                    variant="ghost"
                    size="icon"
                    className='cursor-not-allowed text-muted-foreground'
                    disabled
                >
                    <KeyRound />
                </Button>
            </span>
          </TooltipTrigger>
           <TooltipContent>
              <p>You cannot change your own role.</p>
            </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Otherwise, render the fully functional AlertDialog.
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive">
          <KeyRound />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will {customer.isAdmin ? 'demote' : 'promote'}{' '}
            <strong>{customer.name}</strong>{' '}
            {customer.isAdmin
              ? 'from an Admin to a Customer'
              : 'to an Admin'}
            . They will {customer.isAdmin ? 'lose' : 'gain'} administrative
            privileges.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRoleChange} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
