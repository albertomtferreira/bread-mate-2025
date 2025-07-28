'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData, doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import type { Product } from '@/types';
import { AddProductDialog } from '@/components/AddProductDialog';
import { AllergenIcon } from '@/components/AllergenIcon';
import { EditProductDialog } from '@/components/EditProductDialog';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';


export default function ManageProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const productsCollection = collection(db, 'products');
      const productSnapshot = await getDocs(productsCollection);
      const productList = productSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
      } as Product));
      setProducts(productList);
    } catch (error) {
      console.error("Error fetching products: ", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleProductChange = () => {
    fetchProducts();
  };
  
  const handleProductDeleted = useCallback(async (product: Product) => {
    try {
      if (product.image) {
        const imageRef = ref(storage, product.image);
        await deleteObject(imageRef).catch((error) => {
          if (error.code !== 'storage/object-not-found') {
            throw error;
          }
        });
      }
      
      await deleteDoc(doc(db, 'products', product.id));
      
      toast({
        title: "Product Deleted",
        description: `${product.name} has been successfully removed.`
      });

      fetchProducts();
    } catch (error) {
      console.error("Error deleting product: ", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "There was an error deleting the product."
      });
    }
  }, [fetchProducts, toast]);


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
            <Button variant="outline" asChild>
                <Link href="/admin">
                    <ArrowLeft className="mr-2" />
                    Back to Dashboard
                </Link>
            </Button>
        </div>
        <div className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="font-headline">Manage Products</CardTitle>
                <CardDescription>Add, edit, or remove products for sale.</CardDescription>
            </div>
            <AddProductDialog onProductAdded={handleProductChange} />
        </div>
      </CardHeader>
      <CardContent>
         {loading ? (
            <div className="flex justify-center items-center h-64">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Allergens</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                 <TableCell>
                     <Image src={product.image} alt={product.alt} width={80} height={80} className="rounded-md object-cover" />
                </TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>£{product.price.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={product.isAvailable ? 'default' : 'secondary'}>
                    {product.isAvailable ? 'Available' : 'Hidden'}
                  </Badge>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        {(product.allergens && Array.isArray(product.allergens) && product.allergens.length > 0) ? (
                            product.allergens.map(allergen => (
                                <AllergenIcon key={allergen} allergen={allergen} />
                            ))
                        ) : (
                            'N/A'
                        )}
                    </div>
                </TableCell>
                <TableCell className="text-right">
                  <EditProductDialog product={product} onProductEdited={handleProductChange} />
                   <DeleteConfirmationDialog 
                    onConfirm={() => handleProductDeleted(product)}
                    dialogTitle={`Delete ${product.name}?`}
                    dialogDescription="This action cannot be undone. This will permanently delete the product and its image from your store."
                 >
                    <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 />
                    </Button>
                 </DeleteConfirmationDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}
