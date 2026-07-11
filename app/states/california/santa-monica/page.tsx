import type { Metadata } from 'next';
import CityPage from '@/app/components/CityPage';
import { getCityByPath, buildCityMetadata } from '@/lib/cityHelpers';

const city = getCityByPath('california', 'santa-monica')!;

export const metadata: Metadata = buildCityMetadata(city);

export default function SantaMonicaPage() {
  return <CityPage city={city} />;
}
