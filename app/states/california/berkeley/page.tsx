import type { Metadata } from 'next';
import CityPage from '@/app/components/CityPage';
import { getCityByPath, buildCityMetadata } from '@/lib/cityHelpers';

const city = getCityByPath('california', 'berkeley')!;

export const metadata: Metadata = buildCityMetadata(city);

export default function BerkeleyPage() {
  return <CityPage city={city} />;
}
