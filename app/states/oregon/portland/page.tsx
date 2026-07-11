import type { Metadata } from 'next';
import CityPage from '@/app/components/CityPage';
import { getCityByPath, buildCityMetadata } from '@/lib/cityHelpers';

const city = getCityByPath('oregon', 'portland')!;

export const metadata: Metadata = buildCityMetadata(city);

export default function PortlandPage() {
  return <CityPage city={city} />;
}
