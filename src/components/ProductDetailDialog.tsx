'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import type { Product } from '@/types';
import Image from 'next/image';
import { AllergenIcon } from './AllergenIcon';
import { NutritionalDisplay } from './NutritionalDisplay';
import { AddToCartButton } from './AddToCartButton';
import { FavoriteButton } from './FavoriteButton';

interface ProductDetailSheetProps {
  children: React.ReactNode;
  product: Product;
}


export function ProductDetailSheet({ children, product }: ProductDetailSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-lg flex flex-col">
        <SheetHeader>
          <div className="relative h-64 w-full mb-4">
             <Image src={product.image} alt={product.alt} fill className="object-cover rounded-lg" />
          </div>
          <SheetTitle className="font-headline text-2xl">{product.name}</SheetTitle>
           <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-primary">£{product.price.toFixed(2)}</p>
            <FavoriteButton product={product} />
          </div>
          <SheetDescription className="text-base pt-2">{product.description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4 overflow-y-auto pr-2 flex-grow">
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

      </SheetContent>
    </Sheet>
  );
}
