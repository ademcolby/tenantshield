import type { Metadata } from 'next';
import CityPage from '@/app/components/CityPage';
import { getCityByPath, buildCityMetadata } from '@/lib/cityHelpers';

const city = getCityByPath('california', 'san-francisco')!;

export const metadata: Metadata = buildCityMetadata(city);

export default function SanFranciscoPage() {
  return <CityPage city={city} />;
}
