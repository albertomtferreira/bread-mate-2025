
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData, doc, getDoc } from 'firebase/firestore';

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  hint: string;
  colSpan?: number;
  rowSpan?: number;
  mdColSpan?: number;
  mdRowSpan?: number;
}

export default function Gallery() {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [content, setContent] = useState({
    title: 'From Our Bakery',
    description: 'A glimpse into our passion for baking and the community we serve.',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dynamic content
     const fetchContent = async () => {
        try {
            const contentRef = doc(db, 'siteContent', 'text');
            const contentSnap = await getDoc(contentRef);
            if(contentSnap.exists()) {
                const data = contentSnap.data();
                setContent({
                    title: data.galleryTitle,
                    description: data.galleryDescription,
                });
            }
        } catch (error) {
            console.error("Failed to fetch gallery content:", error);
        }
    };
    
    fetchContent();

    // Fetch images
    const fetchGalleryImages = async () => {
      try {
        const galleryCollection = collection(db, 'gallery');
        const gallerySnapshot = await getDocs(galleryCollection);
        const imageList = gallerySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
        } as GalleryImage));
        setGalleryImages(imageList);
      } catch (error) {
        console.error("Error fetching gallery images: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, []);

  if (loading) {
    return (
      <section className="py-16 sm:py-24 bg-card">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground">{content.title}</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {content.description}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="col-span-1 row-span-1 overflow-hidden rounded-lg shadow-lg">
                <Card className="h-full w-full">
                  <div className="relative h-full min-h-64 w-full bg-muted animate-pulse" />
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const getGridClasses = (image: GalleryImage) => {
    const colSpan = image.colSpan || 1;
    const rowSpan = image.rowSpan || 1;
    const mdColSpan = image.mdColSpan || colSpan;
    const mdRowSpan = image.mdRowSpan || rowSpan;
    return `col-span-${colSpan} row-span-${rowSpan} md:col-span-${mdColSpan} md:row-span-${mdRowSpan}`;
  }
  
  return (
    <section className="py-16 sm:py-24 bg-card">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground">{content.title}</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {content.description}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {galleryImages.map((image) => (
            <div key={image.id} className={`${getGridClasses(image)} overflow-hidden rounded-lg shadow-lg`}>
              <Card className="h-full w-full">
                <div className="relative h-full min-h-64 w-full">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    data-ai-hint={image.hint}
                    fill
                    className="object-cover transition-transform duration-300 ease-in-out hover:scale-105"
                  />
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
