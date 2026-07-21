import type { Metadata } from 'next';
import CityPage from '@/app/components/CityPage';
import { getCityByPath, buildCityMetadata } from '@/lib/cityHelpers';

const city = getCityByPath('new-york', 'new-york-city')!;

export const metadata: Metadata = buildCityMetadata(city);

export default function NewYorkCityPage() {
  return <CityPage city={city} />;
}
