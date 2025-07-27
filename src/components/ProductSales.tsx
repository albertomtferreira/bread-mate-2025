'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AddToCartButton } from './AddToCartButton';
import type { Product } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { AllergenIcon } from './AllergenIcon';

export default function ProductSales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, where("isAvailable", "==", true));
    
    // onSnapshot returns an unsubscribe function that we can use for cleanup
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products in real-time: ", error);
      setLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
       <section className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto">
           <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground">Order Our Daily Bread</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Baked fresh every morning, just for you. Discover our selection of artisanal breads.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="flex flex-col overflow-hidden rounded-lg shadow-lg">
                 <div className="relative h-64 w-full bg-muted animate-pulse" />
                <CardHeader>
                  <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-full mt-2 rounded bg-muted animate-pulse" />
                </CardHeader>
                <CardContent>
                    <div className="h-8 w-1/4 rounded bg-muted animate-pulse" />
                </CardContent>
                <CardFooter>
                  <div className="h-10 w-full rounded bg-muted animate-pulse" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground">Order Our Daily Bread</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Baked fresh every morning, just for you. Discover our selection of artisanal breads.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Card key={product.id} className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-transform duration-300 ease-in-out hover:-translate-y-2">
              <div className="relative h-64 w-full">
                 <Image src={product.image} alt={product.alt} data-ai-hint={product.hint} fill className="object-cover" />
              </div>
              <CardHeader>
                <CardTitle className="font-headline">{product.name}</CardTitle>
                <CardDescription className="pt-2">{product.description}</CardDescription>
                {product.allergens && Array.isArray(product.allergens) && product.allergens.length > 0 && (
                   <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="text-sm font-semibold">Allergens:</span>
                     {product.allergens.map(allergen => (
                      <AllergenIcon key={allergen} allergen={allergen} />
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-2xl font-bold text-primary">£{product.price.toFixed(2)}</p>
              </CardContent>
              <CardFooter>
                <AddToCartButton product={product} />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
