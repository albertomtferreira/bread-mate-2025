'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Home, XCircle } from 'lucide-react';

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }
    

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          const orderData = { id: orderSnap.id, ...orderSnap.data() } as Order;
          setOrder(orderData);
        } else {
          setError('Order not found. It may have been moved or deleted.');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('There was a problem retrieving your order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);
  
  if (loading) {
    return (
        <div className="container mx-auto flex min-h-[calc(100vh-11rem)] items-center justify-center py-16 text-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading your order confirmation...</p>
        </div>
      </div>
    );
  }

  if (error) {
     return (
        <div className="container mx-auto flex min-h-[calc(100vh-11rem)] flex-col items-center justify-center py-16 text-center bg-background">
            <XCircle className="h-24 w-24 text-destructive" />
            <h1 className="mt-8 text-4xl font-headline font-bold">
                Could Not Load Order
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{error}</p>
            <Button asChild className="mt-8">
            <Link href="/">Go to Homepage</Link>
            </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 bg-background">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center items-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <CardTitle className="text-3xl font-headline">Thank You For Your Order!</CardTitle>
            <CardDescription>
              Your order <span className="font-semibold text-primary">#{orderId.substring(0, 7)}...</span> has been placed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="my-4" />
            <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
            <div className="space-y-2">
                {order?.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                        <span>{item.name} <span className="text-muted-foreground">x {item.quantity}</span></span>
                        <span>£{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>£{order?.total.toFixed(2)}</span>
                </div>
            </div>
            <Separator className="my-4" />
             <div className="space-y-2">
                <h4 className="font-semibold">Shipping to:</h4>
                <address className="not-italic text-sm text-muted-foreground">
                    {order?.customerName} <br/>
                    {order?.deliveryAddress.addressLine1} <br/>
                    {order?.deliveryAddress.addressLine2 && <>{order.deliveryAddress.addressLine2}<br/></>}
                    {order?.deliveryAddress.city}, {order?.deliveryAddress.postcode}
                </address>
             </div>
             <Button asChild className="w-full mt-8">
                <Link href="/"><Home/> Go to Homepage</Link>
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
