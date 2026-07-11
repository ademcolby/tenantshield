import type { Metadata } from 'next';
import CityPage from '@/app/components/CityPage';
import { getCityByPath, buildCityMetadata } from '@/lib/cityHelpers';

const city = getCityByPath('illinois', 'cook-county')!;

export const metadata: Metadata = buildCityMetadata(city);

export default function CookCountyPage() {
  return <CityPage city={city} />;
}
