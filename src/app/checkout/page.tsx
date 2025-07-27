'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartProvider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const router = useRouter();

  const deliveryFee = cartItems.length > 0 ? 2.0 : 0;
  const subtotal = getCartTotal();
  const total = subtotal + deliveryFee;

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-11rem)] flex-col items-center justify-center py-16 text-center bg-background">
        <ShoppingCart className="h-24 w-24 text-muted-foreground" />
        <h1 className="mt-8 text-4xl font-headline font-bold">
          Your Basket is Empty
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Looks like you haven&apos;t added any delicious bread yet.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-16 bg-background">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold">Your Basket</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Review your items and proceed to checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Items in your basket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Price: £{item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                     <p className="w-20 text-right font-bold">
                        £{(item.price * item.quantity).toFixed(2)}
                      </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <Separator className="my-6" />
              <div className="flex justify-end">
                <Button variant="outline" onClick={clearCart}>Clear Basket</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <Button className="w-full mt-4" onClick={() => router.push('/checkout/details')}>
                Proceed to Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
