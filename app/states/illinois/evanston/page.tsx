import type { Metadata } from 'next';
import CityPage from '@/app/components/CityPage';
import { getCityByPath, buildCityMetadata } from '@/lib/cityHelpers';

const city = getCityByPath('illinois', 'evanston')!;

export const metadata: Metadata = buildCityMetadata(city);

export default function EvanstonPage() {
  return <CityPage city={city} />;
}
