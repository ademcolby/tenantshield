import type { Metadata } from 'next';
import CityPage from '@/app/components/CityPage';
import { getCityByPath, buildCityMetadata } from '@/lib/cityHelpers';

const city = getCityByPath('california', 'west-hollywood')!;

export const metadata: Metadata = buildCityMetadata(city);

export default function WestHollywoodPage() {
  return <CityPage city={city} />;
}
