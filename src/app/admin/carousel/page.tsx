'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { AddCarouselSlideDialog } from '@/components/AddCarouselSlideDialog';
import { EditCarouselSlideDialog } from '@/components/EditCarouselSlideDialog';
import { DeleteCarouselSlideDialog } from '@/components/DeleteCarouselSlideDialog';


export interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  hint: string;
}

export default function ManageCarouselPage() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSlides = useCallback(async () => {
    setLoading(true);
    try {
      const carouselCollection = collection(db, 'carousel');
      const carouselSnapshot = await getDocs(carouselCollection);
      const slideList = carouselSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
      } as CarouselSlide));
      setSlides(slideList);
    } catch (error) {
      console.error("Error fetching carousel slides: ", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const handleSlideChange = () => {
    fetchSlides();
  };

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
                <CardTitle className="font-headline">Manage Carousel</CardTitle>
                <CardDescription>Add, edit, or remove slides from your homepage carousel.</CardDescription>
            </div>
            <AddCarouselSlideDialog onSlideAdded={handleSlideChange} />
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
              <TableHead>Title</TableHead>
              <TableHead>Alt Text</TableHead>
              <TableHead>Hint</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slides.map((slide) => (
              <TableRow key={slide.id}>
                <TableCell>
                     <Image src={slide.image} alt={slide.title} width={100} height={50} className="rounded-md object-cover" />
                </TableCell>
                <TableCell>{slide.title}</TableCell>
                <TableCell>{slide.alt}</TableCell>
                <TableCell>{slide.hint}</TableCell>
                <TableCell className="text-right">
                  <EditCarouselSlideDialog slide={slide} onSlideEdited={handleSlideChange} />
                  <DeleteCarouselSlideDialog slideId={slide.id} imageUrl={slide.image} onSlideDeleted={handleSlideChange} />
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
