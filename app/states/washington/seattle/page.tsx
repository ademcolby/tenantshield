import type { Metadata } from 'next';
import CityPage from '@/app/components/CityPage';
import { getCityByPath, buildCityMetadata } from '@/lib/cityHelpers';

const city = getCityByPath('washington', 'seattle')!;

export const metadata: Metadata = buildCityMetadata(city);

export default function SeattlePage() {
  return <CityPage city={city} />;
}
