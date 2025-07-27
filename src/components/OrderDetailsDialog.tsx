'use client';

import { useState } from 'react';
import type { Order } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Eye, Printer, Truck } from 'lucide-react';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { AllergenIcon } from './AllergenIcon';
import { formatDistanceToNow } from 'date-fns';


interface OrderDetailsDialogProps {
  order: Order;
  children?: React.ReactNode;
}

export function OrderDetailsDialog({ order, children }: OrderDetailsDialogProps) {
  const [showPrices, setShowPrices] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const handlePrint = () => {
    // Generate QR code URL just before printing
    const contactUrl = `${window.location.origin}/contact`;
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(contactUrl)}`);

    // Allow state to update before printing
    setTimeout(() => {
        window.print();
    }, 100);
  };
  
   const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Processing': return 'default';
        case 'Shipped': return 'secondary';
        case 'Delivered': return 'outline';
        case 'Cancelled': return 'destructive';
        default: return 'default';
    }
  }

  const renderStatus = (order: Order) => {
    const fromNow = (date: Date) => formatDistanceToNow(date, { addSuffix: true });
    
    switch (order.status) {
      case 'Delivered':
        return (
          <>
            <span className="font-semibold text-green-600">Delivered</span>
            {order.deliveredAt && (
              <span className="text-muted-foreground ml-2">
                {fromNow(order.deliveredAt.toDate())}
              </span>
            )}
          </>
        );
      case 'Shipped':
        return (
          <>
            <span className="font-semibold text-blue-600">Shipped</span>
            {order.shippedAt && (
              <span className="text-muted-foreground ml-2">
                {fromNow(order.shippedAt.toDate())}
              </span>
            )}
          </>
        );
       case 'Processing':
        return (
           <>
            <span className="font-semibold">Processing</span>
            <span className="text-muted-foreground ml-2">
                {fromNow(order.createdAt.toDate())}
            </span>
           </>
        );
      case 'Cancelled':
        return <span className="font-semibold text-destructive">Cancelled</span>;
      default:
        return <span className="font-semibold">{order.status}</span>
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || <Button variant="ghost" size="icon"><Eye /></Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl print:max-w-full print:border-none print:shadow-none print:p-0">
        <div className="printable-area p-6 pt-0">

            {/* --- Print-Only Header --- */}
            <div className="hidden print:block mb-8 pt-0">
                <div className="flex justify-between items-center pb-4 border-b">
                    <Logo className="h-16" />
                    <div className="text-right">
                        <h2 className="text-2xl font-bold font-headline">Packing Slip</h2>
                        <p className="text-muted-foreground">Order ID: {order.id}</p>
                    </div>
                </div>
            </div>

            {/* --- Screen-Only Header --- */}
            <DialogHeader className="print:hidden pt-6">
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription>
                Order ID: <span className="font-semibold text-primary">{order.id}</span>
                </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                <div>
                <h3 className="font-semibold mb-2">Customer Details</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                    <p><span className="font-medium text-foreground">Name:</span> {order.customerName}</p>
                    <p><span className="font-medium text-foreground">Email:</span> {order.customerEmail}</p>
                    <p>
                        <span className="font-medium text-foreground">Ordered on:</span>{' '}
                        {new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-GB')}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">Status:</span>
                        <div className="text-sm">
                            {renderStatus(order)}
                        </div>
                    </div>
                </div>
                </div>
                <div>
                <h3 className="font-semibold mb-2">Delivery Address</h3>
                <address className="not-italic text-sm text-muted-foreground">
                    {order.deliveryAddress.addressLine1} <br />
                    {order.deliveryAddress.addressLine2 && <>{order.deliveryAddress.addressLine2}<br /></>}
                    {order.deliveryAddress.city}, {order.deliveryAddress.postcode}
                </address>
                </div>
            </div>

            {order.trackingProvider && order.trackingNumber && (
                <>
                <Separator />
                 <div className="my-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2"><Truck/> Tracking Information</h3>
                    <div className="text-sm text-muted-foreground">
                        <p><span className="font-medium text-foreground">Provider:</span> {order.trackingProvider}</p>
                        <p><span className="font-medium text-foreground">Number:</span> {order.trackingNumber}</p>
                    </div>
                 </div>
                </>
            )}

            <Separator />
          
             <div className="my-6">
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="space-y-2 text-sm">
                {order.items.map(item => (
                    <div key={item.id} className="flex items-center">
                        <div className="w-8 text-center text-muted-foreground">{item.quantity}x</div>
                        <div className="flex-grow font-medium text-foreground flex items-center gap-2">
                           <span>{item.name}</span>
                           {item.allergens && item.allergens.length > 0 && (
                                <div className="flex gap-1">
                                {item.allergens.map(allergen => (
                                    <AllergenIcon key={allergen} allergen={allergen} />
                                ))}
                                </div>
                            )}
                        </div>
                        <div className={cn("w-20 text-right text-muted-foreground", !showPrices && "print:opacity-0")}>
                            £{item.price.toFixed(2)}
                        </div>
                        <div className={cn("w-20 text-right font-semibold text-foreground", !showPrices && "print:opacity-0")}>
                           £{(item.price * item.quantity).toFixed(2)}
                        </div>
                    </div>
                ))}
                </div>
            </div>


            <Separator />

            <div className={cn("flex justify-end mt-6", !showPrices && "print:opacity-0")}>
                <div className="w-full max-w-xs space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>£{(order.total - 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery</span>
                        <span>£2.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-base">
                        <span className="text-foreground">Total</span>
                        <span>£{order.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* --- Print-Only Footer --- */}
            <div className="hidden print:block mt-12 pt-4 border-t text-center">
                <div className="flex justify-center items-center gap-4">
                    {qrCodeUrl && (
                        <img src={qrCodeUrl} alt="QR Code for feedback" width={120} height={120} />
                    )}
                    <div>
                        <p className="font-semibold">Have feedback?</p>
                        <p className="text-sm text-muted-foreground">Scan the QR code to visit our contact page.</p>
                        <p className="text-xs text-muted-foreground mt-2">bread mate | {window.location.host}</p>
                    </div>
                </div>
            </div>
        </div>

        <DialogFooter className="mt-6 print:hidden flex-col-reverse gap-y-2 sm:flex-row sm:justify-between sm:items-center p-6">
          <div className="flex items-center space-x-2">
            <Checkbox id="show-prices" checked={showPrices} onCheckedChange={(checked) => setShowPrices(Boolean(checked))} />
            <Label htmlFor="show-prices">Show Prices on Print</Label>
          </div>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2" />
            Print Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
