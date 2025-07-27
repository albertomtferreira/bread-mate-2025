'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { db } from '@/lib/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

interface CarouselSlide {
  id: string;
  image: string;
  title: string;
  description: string;
  alt: string;
  hint: string;
}

const fallbackSlides = [
  {
    id: '1',
    image: 'https://placehold.co/1600x800.png',
    hint: 'artisan bread',
    title: 'Handcrafted Perfection',
    description: 'Experience the taste of tradition with our artisanal sourdough.',
    alt: 'A selection of artisanal bread on a wooden board'
  },
  {
    id: '2',
    image: 'https://placehold.co/1600x800.png',
    hint: 'baking process',
    title: 'Fresh From The Oven',
    description: 'Our breads are baked daily with the finest local ingredients.',
    alt: 'A baker taking fresh bread out of a brick oven'
  },
  {
    id: '3',
    image: 'https://placehold.co/1600x800.png',
    hint: 'wheat field',
    title: 'From Field to Loaf',
    description: 'We partner with local farmers to bring you wholesome goodness.',
    alt: 'A golden wheat field under a blue sky'
  },
];

export default function HeroCarousel() {
  const [slides, setSlides] = useState<CarouselSlide[]>(fallbackSlides);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const carouselCollection = collection(db, 'carousel');
        const carouselSnapshot = await getDocs(carouselCollection);
        if (carouselSnapshot.empty) {
          setSlides(fallbackSlides);
        } else {
          const slideList = carouselSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...doc.data(),
          } as CarouselSlide));
          setSlides(slideList);
        }
      } catch (error) {
        console.error("Error fetching carousel slides: ", error);
        setSlides(fallbackSlides); // On error, fallback to default slides
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, []);

  const currentSlides = loading ? fallbackSlides : slides;

  return (
    <section className="w-full">
      <Carousel
        className="w-full"
        plugins={[
          Autoplay({
            delay: 5000,
          }),
        ]}
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {currentSlides.map((slide, index) => (
            <CarouselItem key={slide.id}>
              <div className="relative h-[60vh] md:h-[80vh] w-full">
                {loading && index > 0 ? (
                   <div className="w-full h-full bg-muted animate-pulse" />
                ) : (
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    data-ai-hint={slide.hint}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                )}
                <div className="absolute inset-0 flex items-start justify-start text-left p-8 md:p-16">
                  <div className="text-white">
                    <h1 className="text-4xl md:text-6xl font-bold font-headline text-white drop-shadow-lg">
                      {slide.title}
                    </h1>
                    <p className="mt-4 text-base md:text-xl max-w-xl mr-auto drop-shadow-md">
                      {slide.description}
                    </p>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex" />
      </Carousel>
    </section>
  );
}
