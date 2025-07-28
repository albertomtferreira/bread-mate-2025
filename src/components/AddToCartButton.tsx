'use client';

import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartProvider';
import type { Product } from '@/types';
import { useState, useEffect } from 'react';

export function AddToCartButton({ product }: { product: Product }) {
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const { toast } = useToast();
  const [isInCart, setIsInCart] = useState(false);
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    const itemInCart = cartItems.find(item => item.id === product.id);
    if (itemInCart) {
      setIsInCart(true);
      setQuantity(itemInCart.quantity);
    } else {
      setIsInCart(false);
      setQuantity(0);
    }
  }, [cartItems, product.id]);

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Added to Basket!",
      description: `${product.name} has been added to your shopping basket.`,
    });
  };
  
  const handleRemove = () => {
    removeFromCart(product.id);
     toast({
      variant: 'destructive',
      title: "Item Removed",
      description: `${product.name} has been removed from your basket.`,
    });
  }

  if (isInCart) {
    return (
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => updateQuantity(product.id, quantity - 1)}
        >
          <Minus />
        </Button>
        <span className="text-lg font-bold text-center w-28">{quantity} in basket</span>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => updateQuantity(product.id, quantity + 1)}
        >
          <Plus />
        </Button>
      </div>
    );
  }

  return (
    <Button
      className="bg-accent hover:bg-accent/90"
      onClick={handleAddToCart}
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      Add to Basket
    </Button>
  );
}
