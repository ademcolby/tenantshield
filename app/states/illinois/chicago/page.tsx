import type { Metadata } from 'next';
import CityPage from '@/app/components/CityPage';
import { getCityByPath, buildCityMetadata } from '@/lib/cityHelpers';

const city = getCityByPath('illinois', 'chicago')!;

export const metadata: Metadata = buildCityMetadata(city);

export default function ChicagoPage() {
  return <CityPage city={city} />;
}
