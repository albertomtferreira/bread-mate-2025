import HeroCarousel from '@/components/HeroCarousel';
import ProductSales from '@/components/ProductSales';
import Gallery from '@/components/Gallery';
import { ImageBanner } from '@/components/ImageBanner';

export default function Home() {
  return (
    <div className="flex flex-col bg-background">
      <ImageBanner />
      <HeroCarousel />
      <ProductSales />
      <Gallery />
    </div>
  );
}
