import type { Metadata } from 'next';
import CityPage from '@/app/components/CityPage';
import { getCityByPath, buildCityMetadata } from '@/lib/cityHelpers';

const city = getCityByPath('pennsylvania', 'philadelphia')!;

export const metadata: Metadata = buildCityMetadata(city);

export default function PhiladelphiaPage() {
  return <CityPage city={city} />;
}
