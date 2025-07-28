
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
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { AllergenIcon } from './AllergenIcon';
import { NutritionalDisplay } from './NutritionalDisplay';
import { ProductDetailSheet } from './ProductDetailDialog';
import { FavoriteButton } from './FavoriteButton';

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <Card className="flex flex-col rounded-lg shadow-lg transition-transform duration-300 ease-in-out hover:-translate-y-2">
      <ProductDetailSheet product={product}>
        <div className="cursor-pointer">
          <div className="relative h-64 w-full">
            <Image
              src={product.image}
              alt={product.alt}
              data-ai-hint={product.hint}
              fill
              className="object-cover rounded-t-lg"
            />
          </div>
        </div>
      </ProductDetailSheet>
      <CardHeader className="flex-grow">
        <div className="flex justify-between items-start gap-4">
          <ProductDetailSheet product={product}>
            <div className="cursor-pointer flex-grow">
              <CardTitle className="font-headline hover:underline">
                {product.name}
              </CardTitle>
            </div>
          </ProductDetailSheet>
          <FavoriteButton product={product} />
        </div>
        <CardDescription className="pt-2">{product.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {product.allergens &&
          Array.isArray(product.allergens) &&
          product.allergens.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pb-4">
              <span className="text-sm font-semibold">Allergens:</span>
              {product.allergens.map((allergen) => (
                <AllergenIcon key={allergen} allergen={allergen} />
              ))}
            </div>
          )}
        {product.nutritionalInfo && (
          <NutritionalDisplay
            nutritionalInfo={product.nutritionalInfo}
            ingredients={product.ingredients}
            productName={product.name}
          />
        )}
        <p className="text-2xl font-bold text-primary mt-4">
          £{product.price.toFixed(2)}
        </p>
      </CardContent>
      <CardFooter className="justify-center">
        <AddToCartButton product={product} />
      </CardFooter>
    </Card>
  );
};


export default function ProductSales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [content, setContent] = useState({
    title: 'Order Our Daily Bread',
    description: 'Baked fresh every morning, just for you. Discover our selection of artisanal breads.',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for dynamic content in real-time
    const contentRef = doc(db, 'siteContent', 'text');
    const unsubscribeContent = onSnapshot(contentRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setContent({
          title: data.productSalesTitle,
          description: data.productSalesDescription,
        });
      }
    }, (error) => {
      console.error("Failed to fetch product sales content in real-time:", error);
    });

    // Listen for products in real-time
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, where("isAvailable", "==", true));
    
    const unsubscribeProducts = onSnapshot(q, (querySnapshot) => {
      const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products in real-time: ", error);
      setLoading(false);
    });

    return () => {
      unsubscribeContent();
      unsubscribeProducts();
    };
  }, []);

  if (loading) {
    return (
       <section className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto">
           <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground">{content.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {content.description}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="flex flex-col rounded-lg shadow-lg">
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
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground">{content.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {content.description}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
