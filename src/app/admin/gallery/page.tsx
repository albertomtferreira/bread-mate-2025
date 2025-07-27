'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ArrowLeft, Edit } from 'lucide-react';
import Image from 'next/image';
import { AddGalleryImageDialog } from '@/components/AddGalleryImageDialog';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { storage } from '@/lib/firebase';
import { ref, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { EditGalleryImageDialog } from '@/components/EditGalleryImageDialog';

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  hint: string;
}

export default function ManageGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const galleryCollection = collection(db, 'gallery');
      const gallerySnapshot = await getDocs(galleryCollection);
      const imageList = gallerySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
      } as GalleryImage)).sort((a, b) => (a.alt > b.alt) ? 1 : -1);
      setImages(imageList);
    } catch (error) {
      console.error("Error fetching gallery images: ", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);
  
  const handleImageDeleted = useCallback(async (imageId: string, imageUrl: string) => {
    try {
      // Delete image from storage
      if(imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef).catch((error) => {
          // It's okay if the object doesn't exist, we can still delete the DB record
          if(error.code !== 'storage/object-not-found') {
            throw error;
          }
        });
      }

      // Delete document from Firestore
      await deleteDoc(doc(db, 'gallery', imageId));
      
      toast({
        title: "Image Deleted",
        description: "The image has been successfully removed from the gallery."
      });

      // Refresh the list
      fetchImages();

    } catch (error) {
       console.error("Error deleting image: ", error);
       toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "There was an error deleting the image."
       });
    }
  }, [fetchImages, toast]);

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
                <CardTitle className="font-headline">Manage Gallery</CardTitle>
                <CardDescription>Add or remove images from your gallery.</CardDescription>
            </div>
            <AddGalleryImageDialog onImageAdded={fetchImages} />
        </div>
      </CardHeader>
      <CardContent>
         {loading ? (
            <div className="flex justify-center items-center h-64">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <Image
                src={image.src}
                alt={image.alt}
                width={200}
                height={200}
                className="rounded-md object-cover w-full h-full"
              />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <EditGalleryImageDialog image={image} onImageEdited={fetchImages} />
                 <DeleteConfirmationDialog 
                    onConfirm={() => handleImageDeleted(image.id, image.src)}
                    dialogTitle="Delete Image?"
                    dialogDescription="This action cannot be undone. This will permanently delete the image from your gallery."
                 >
                    <Button variant="destructive" size="icon">
                        <Trash2 />
                    </Button>
                 </DeleteConfirmationDialog>
              </div>
            </div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
}
