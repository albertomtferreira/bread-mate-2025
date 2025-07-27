'use client';

import { ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartProvider';
import type { Product } from '@/types';

export function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleClick = () => {
    addToCart(product);
    toast({
      title: "Added to Basket!",
      description: `${product.name} has been added to your shopping basket.`,
    });
  };

  return (
    <Button
      className="w-full bg-accent hover:bg-accent/90"
      onClick={handleClick}
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      Add to Basket
    </Button>
  );
}
