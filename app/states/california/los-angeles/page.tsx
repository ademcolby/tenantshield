import type { Metadata } from 'next';
import CityPage from '@/app/components/CityPage';
import { getCityByPath, buildCityMetadata } from '@/lib/cityHelpers';

const city = getCityByPath('california', 'los-angeles')!;

export const metadata: Metadata = buildCityMetadata(city);

export default function LosAngelesPage() {
  return <CityPage city={city} />;
}
