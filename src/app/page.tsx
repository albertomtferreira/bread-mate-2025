import HeroCarousel from '@/components/HeroCarousel';
import ProductSales from '@/components/ProductSales';
import Gallery from '@/components/Gallery';

export default function Home() {
  return (
    <div className="flex flex-col bg-background">
      <HeroCarousel />
      <ProductSales />
      <Gallery />
    </div>
  );
}
