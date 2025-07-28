'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { Product } from '@/types';
import Image from 'next/image';
import { AllergenIcon } from './AllergenIcon';
import { NutritionalDisplay } from './NutritionalDisplay';
import { AddToCartButton } from './AddToCartButton';
import { FavoriteButton } from './FavoriteButton';

interface ProductDetailDialogProps {
  children: React.ReactNode;
  product: Product;
}


export function ProductDetailDialog({ children, product }: ProductDetailDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="relative h-64 w-full mb-4">
             <Image src={product.image} alt={product.alt} fill className="object-cover rounded-lg" />
          </div>
          <DialogTitle className="font-headline text-2xl">{product.name}</DialogTitle>
           <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-primary">£{product.price.toFixed(2)}</p>
            <FavoriteButton product={product} />
          </div>
          <DialogDescription className="text-base pt-2">{product.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto pr-2">
          {product.allergens && product.allergens.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Allergens</h4>
              <div className="flex flex-wrap items-center gap-2">
                {product.allergens.map(allergen => (
                  <AllergenIcon key={allergen} allergen={allergen} />
                ))}
              </div>
            </div>
          )}

          {product.nutritionalInfo && (
            <div>
                <Separator className="my-4" />
                <h4 className="font-semibold mb-2">Nutrition</h4>
                <NutritionalDisplay 
                    nutritionalInfo={product.nutritionalInfo} 
                    ingredients={product.ingredients}
                    productName={product.name}
                />
            </div>
           )}

            {product.ingredients && (
                <div>
                    <Separator className="my-4" />
                    <h4 className="font-semibold mb-2">Ingredients</h4>
                    <p className="text-sm text-muted-foreground">
                        {product.ingredients}
                    </p>
                </div>
            )}
        </div>
         <Separator className="mt-auto" />
        <div className="pt-4 flex justify-center">
            <AddToCartButton product={product} />
        </div>

      </DialogContent>
    </Dialog>
  );
}
