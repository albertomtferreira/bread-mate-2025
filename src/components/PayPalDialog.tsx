'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PayPalDialogProps {
  total: number;
  onConfirm: () => Promise<string | null>;
  disabled?: boolean;
}

const PayPalIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
        <path fill="#003087" d="M10.25 18.271H6.046c-.52 0-.963-.343-1.066-.853L2.94 5.345c-.09-.434.26-.826.702-.826h4.37c.39 0 .73.25.866.623l.797 2.145c.13.352.454.58.818.58h.003c.48 0 .88-.37.92-.85l.21-2.493c.04-.48.45-.84.93-.84H16.5c.41 0 .76.29.85.69l.79 3.553c.09.432-.26.825-.7.825h-3.32c-.41 0-.76-.29-.85-.69l-.79-3.553c-.09-.432.26-.825.7-.825h.41c.52 0 .963.343 1.066.853l.79 3.553c.09.432-.26.825-.7.825h-.003c-.48 0-.88-.37-.92-.85l-.21 2.493c-.04.48-.45-.84-.93-.84H8.48c-.41 0-.76-.29-.85-.69L6.84 9.173c-.09-.434.26-.826.7-.826h3.32c.41 0 .76.29.85.69l.79 3.553c.09.432-.26.825-.7.825h-.41c-.52 0-.963-.343-1.066-.853L9.15 9.173c-.09-.434.26-.826.7-.826h.003c.48 0 .88-.37.92-.85l.21 2.493c.04.48.45-.84.93-.84h1.79c.52 0 .963.343 1.066-.853l.21-2.493c.04-.48-.35-.88-.81-.88h-4.37c-.39 0-.73-.25-.866-.623l-.797-2.145c-.13-.352-.454-.58-.818-.58H6.746c-.52 0-.963-.343-1.066-.853L3.64 8.878c-.09.434.26.826.7.826h3.32c.41 0 .76.29.85.69l.79 3.553c.09.432-.26.825-.7.825h-.003c-.48 0-.88-.37-.92-.85L7.41 9.173c-.04-.48-.45-.84-.93-.84H2.11c-1.11 0-1.99.89-1.99 2l2.09 9.43c.24 1.07 1.2 1.83 2.33 1.83h4.37c.39 0 .73.25.866.623l.797 2.145c.13.352.454.58.818.58h.003c.48 0 .88-.37.92-.85l.21-2.493c.04-.48.45-.84.93-.84h4.37c.39 0 .73.25.866.623l.797 2.145c.13.352.454.58.818.58h.003c.48 0 .88-.37.92-.85l.21-2.493c.04-.48.45-.84.93-.84h4.37c.39 0 .73.25.866.623l.797-2.145c.13-.352-.18-.73-.58-.73h-2.11c-.52 0-.963-.343-1.066-.853L18.84 5.345c-.09-.434.26-.826.7-.826h2.11c.52 0 .963.343 1.066.853l.79 3.553c.09.432-.26.825-.7.825h-3.32c-.41 0-.76-.29-.85-.69l-.79-3.553c-.09-.432.26-.825.7-.825h.41c.52 0 .963.343 1.066.853l.79 3.553c.09.432-.26.825-.7.825h-.003c-.48 0-.88-.37-.92-.85l-.21-2.493c-.04-.48-.45-.84-.93-.84H14.5c-.41 0-.76-.29-.85-.69L12.86 5.345c-.09-.434.26-.826.7-.826h4.37c1.11 0 1.99.89 1.99 2l-2.09 9.43c-.24 1.07-1.2 1.83-2.33 1.83h-4.37c-.39 0-.73.25-.866-.623l-.797-2.145c-.13-.352-.454-.58-.818-.58h-.003c-.48 0-.88-.37-.92-.85l-.21-2.493c.04-.48-.45-.84-.93-.84H6.74c-.39 0-.73.25-.866-.623l-.797 2.145c-.13.352.18.73.58.73h2.11c.52 0 .963.343 1.066.853l.79 3.553c.09.432-.26.825-.7.825z"/>
        <path fill="#009cde" d="M10.25 18.271H6.046c-.52 0-.963-.343-1.066-.853L2.94 5.345c-.09-.434.26-.826.702-.826h4.37c.39 0 .73.25.866.623l.797 2.145c.13.352.454.58.818.58h.003c.48 0 .88-.37.92-.85l.21-2.493c.04-.48.45-.84.93-.84H16.5c.41 0 .76.29.85.69l.79 3.553c.09.432-.26.825-.7.825h-3.32c-.41 0-.76-.29-.85-.69l-.79-3.553c-.09-.432.26-.825.7-.825h.41c.52 0 .963.343 1.066.853l.79 3.553c.09.432-.26.825-.7.825h-.003c-.48 0-.88-.37-.92-.85l-.21 2.493c-.04.48-.45-.84-.93-.84H8.48c-.41 0-.76-.29-.85-.69L6.84 9.173c-.09-.434.26-.826.7-.826h3.32c.41 0 .76.29.85.69l.79 3.553c.09.432-.26.825-.7.825h-.41c-.52 0-.963-.343-1.066-.853L9.15 9.173c-.09-.434.26-.826.7-.826h.003c.48 0 .88-.37.92-.85l.21 2.493c.04.48.45-.84.93-.84h1.79c.52 0 .963.343 1.066-.853l.21-2.493c.04-.48-.35-.88-.81-.88h-4.37c-.39 0-.73-.25-.866-.623l-.797-2.145c-.13-.352-.454-.58-.818-.58H6.746c-.52 0-.963-.343-1.066-.853L3.64 8.878c-.09.434.26.826.7.826h3.32c.41 0 .76.29.85.69l.79 3.553c.09.432-.26.825-.7.825h-.003c-.48 0-.88-.37-.92-.85L7.41 9.173c-.04-.48-.45-.84-.93-.84H2.11c-1.11 0-1.99.89-1.99 2l2.09 9.43c.24 1.07 1.2 1.83 2.33 1.83h4.37c.39 0 .73.25.866.623l.797 2.145c.13.352.454.58.818.58h.003c.48 0 .88-.37.92-.85l.21-2.493c.04-.48.45-.84.93-.84h4.37c.39 0 .73.25.866.623l.797 2.145c.13.352.454.58.818.58h.003c.48 0 .88-.37.92-.85l.21-2.493c.04-.48.45-.84.93-.84h4.37c.39 0 .73.25.866.623l.797-2.145c.13-.352-.18-.73-.58-.73h-2.11c-.52 0-.963-.343-1.066-.853L18.84 5.345c-.09-.434.26-.826.7-.826h2.11c.52 0 .963.343 1.066.853l.79 3.553c.09.432-.26.825-.7.825h-3.32c-.41 0-.76-.29-.85-.69l-.79-3.553c-.09-.432.26-.825.7-.825h.41c.52 0 .963.343 1.066.853l.79 3.553c.09.432-.26.825-.7.825h-.003c-.48 0-.88-.37-.92-.85l-.21-2.493c-.04-.48-.45-.84-.93-.84H14.5c-.41 0-.76-.29-.85-.69L12.86 5.345c-.09-.434.26-.826.7-.826h4.37c1.11 0 1.99.89 1.99 2l-2.09 9.43c-.24 1.07-1.2 1.83-2.33 1.83h-4.37c-.39 0-.73.25-.866-.623l-.797-2.145c-.13-.352-.454-.58-.818-.58h-.003c-.48 0-.88-.37-.92-.85l-.21-2.493c.04-.48-.45-.84-.93-.84H6.74c-.39 0-.73.25-.866-.623l-.797 2.145c-.13.352.18.73.58.73h2.11c.52 0 .963.343 1.066.853l.79 3.553c.09.432-.26.825-.7.825z"/>
    </svg>
);


export function PayPalDialog({ total, onConfirm, disabled = false }: PayPalDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const orderId = await onConfirm();
      if (!orderId) {
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Payment confirmation failed:", error);
      setIsOpen(false); 
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
            className="w-full bg-paypal-blue hover:bg-paypal-blue/90 text-white"
            disabled={disabled}
        >
          Checkout with PayPal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
            <PayPalIcon />
          <DialogTitle className="text-2xl font-bold">bread mate</DialogTitle>
          <DialogDescription>Paying bread mate</DialogDescription>
          <p className="text-4xl font-bold tracking-tight">£{total.toFixed(2)}</p>
        </DialogHeader>
        <div className="text-center text-sm text-muted-foreground">
            This is a simulated payment. No real transaction will occur.
        </div>
        <DialogFooter className="gap-2 sm:justify-center">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isProcessing}
            >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm}
            disabled={isProcessing}
            className="bg-paypal-blue hover:bg-paypal-blue/90 text-white"
            >
            {isProcessing ? <Loader2 className="animate-spin" /> : `Pay Now`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
