// scripts/generate-city-pages.mjs
//
// Creates the 11 city pages that get their own route, nested under their parent
// state: app/states/{state}/{city}/page.tsx
//
// Only 'augments' + 'replaces' cities are listed here. The 4 'defers' cities
// (Boston, Cambridge, Baltimore, Evanston) deliberately get NO page — they
// surface in the "Local ordinances" section of their parent state page instead.
// See the eligibility rule in lib/cityHelpers.ts before adding anything here.
//
// ⚠️ UPDATED July 22, 2026 (post-Batch-31 retypes): Evanston was retyped
// ReplacingCity→DeferringCity (its route directory was DELETED and must never
// be regenerated — the letter path is blocked and /states/illinois/evanston
// intentionally 404s); Philadelphia and New York City were retyped
// DeferringCity→AugmentingCity and their route files created. If a city's
// overlay type ever changes again, remember: the route-directory set changes
// BY HAND (Batch 31 lesson) — update this list AND the directories together.
//
// Dry run (writes nothing):
//     node scripts/generate-city-pages.mjs
// Apply:
//     node scripts/generate-city-pages.mjs --apply

import fs from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');

// [parentStateSlug, urlSegment, overlayType] — verified against stateLawData.ts
const CITIES = [
  // augments (9) — city duties stack ON TOP of state law
  ['california', 'berkeley', 'augments'],
  ['california', 'los-angeles', 'augments'],
  ['california', 'san-francisco', 'augments'],
  ['california', 'santa-monica', 'augments'],
  ['california', 'west-hollywood', 'augments'],
  ['new-york', 'new-york-city', 'augments'],
  ['oregon', 'portland', 'augments'],
  ['pennsylvania', 'philadelphia', 'augments'],
  ['washington', 'seattle', 'augments'],
  // replaces (2) — city ordinance governs instead of the state default
  ['illinois', 'chicago', 'replaces'],
  ['illinois', 'cook-county', 'replaces'],
  // ⚠️ Evanston deliberately NOT listed — DeferringCity, letters blocked,
  // route deleted in Batch 31. Do not re-add without a product decision.
];

const pascal = (seg) =>
  seg.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('');

const template = (stateSlug, seg) => `import type { Metadata } from 'next';
import CityPage from '@/app/components/CityPage';
import { getCityByPath, buildCityMetadata } from '@/lib/cityHelpers';

const city = getCityByPath('${stateSlug}', '${seg}')!;

export const metadata: Metadata = buildCityMetadata(city);

export default function ${pascal(seg)}Page() {
  return <CityPage city={city} />;
}
`;

let created = 0;
const problems = [];

for (const [stateSlug, seg, type] of CITIES) {
  const stateDir = path.join(process.cwd(), 'app', 'states', stateSlug);
  if (!fs.existsSync(stateDir)) {
    problems.push(`${stateSlug}/${seg} — parent state dir missing: app/states/${stateSlug}`);
    continue;
  }

  const dir = path.join(stateDir, seg);
  const file = path.join(dir, 'page.tsx');

  if (fs.existsSync(file)) {
    problems.push(`${stateSlug}/${seg} — page.tsx already exists (skipped)`);
    continue;
  }

  if (APPLY) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, template(stateSlug, seg), 'utf8');
  }
  created++;
  console.log(`OK   ${type.padEnd(9)} /states/${stateSlug}/${seg}`);
}

console.log('\n' + '-'.repeat(60));
console.log(`${APPLY ? 'CREATED' : 'WOULD CREATE'}: ${created} pages`);
if (problems.length) {
  console.log(`PROBLEMS: ${problems.length}`);
  for (const p of problems) console.log('  !! ' + p);
  process.exitCode = 1;
} else {
  console.log('PROBLEMS: none');
}
if (!APPLY) console.log('\nDry run — nothing written. Re-run with --apply to write.');
