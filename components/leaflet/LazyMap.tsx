import { lazy, Suspense } from 'react';
import { ListingData } from '@/lib/elements';

const LazyMap = lazy(() => import('@/components/leaflet/Map'));

export const Map: React.FC<{ elements: ListingData[]; className: string }> = ({ elements, className }) => (
  <Suspense fallback={<p className="w-full h-full flex items-center justify-center">Loading...</p>}>
    <LazyMap elements={elements} className={className} />
  </Suspense>
);

export default Map;
