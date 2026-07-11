// scripts/migrate-state-metadata.mjs
//
// One-shot migration: rewrite each app/states/{slug}/page.tsx metadata block to
// use buildStateMetadata() from lib/stateMetadata.ts, so every state page emits
// its OWN openGraph/twitter tags instead of inheriting the layout's generic ones.
//
// Run a DRY RUN first (writes nothing):
//     node scripts/migrate-state-metadata.mjs
// Then apply:
//     node scripts/migrate-state-metadata.mjs --apply
//
// Safe to delete after the migration lands.

import fs from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const ROOT = path.join(process.cwd(), 'app', 'states');

const RE_META = /export const metadata: Metadata = \{[\s\S]*?\n\};/;
const RE_TITLE = /^\s*title:\s*'((?:[^'\\]|\\.)*)',/m;
const RE_DESC = /^\s*description:\s*'((?:[^'\\]|\\.)*)',/m;
const RE_CANON = /canonical:\s*'([^']*)'/;
const RE_IMPORT_ANCHOR = /^import \{ getJurisdiction \} from '@\/lib\/stateLawData';$/m;
const NEW_IMPORT = "import { buildStateMetadata } from '@/lib/stateMetadata';";

let ok = 0;
const problems = [];

for (const dir of fs.readdirSync(ROOT).sort()) {
  const file = path.join(ROOT, dir, 'page.tsx');
  if (!fs.existsSync(file)) continue;

  const src = fs.readFileSync(file, 'utf8');
  const fail = (why) => problems.push(`${dir.padEnd(22)} ${why}`);

  const mMeta = src.match(RE_META);
  const mTitle = src.match(RE_TITLE);
  const mDesc = src.match(RE_DESC);
  const mCanon = src.match(RE_CANON);

  if (!mMeta) { fail('no metadata block matched'); continue; }
  if (!mTitle) { fail('no title literal matched'); continue; }
  if (!mDesc) { fail('no description literal matched'); continue; }
  if (!RE_IMPORT_ANCHOR.test(src)) { fail('stateLawData import anchor not found'); continue; }
  if (src.includes('buildStateMetadata')) { fail('already migrated — skipping'); continue; }

  // Guard: title must not carry the suffix (layout template appends it).
  if (/\|\s*TenantShield/.test(mTitle[1])) { fail('title still has "| TenantShield" suffix'); continue; }

  // Guard: canonical must match the directory slug, or our derived URL would be wrong.
  const expected = `https://gettenantshield.com/states/${dir}`;
  if (!mCanon) { fail('no canonical found'); continue; }
  if (mCanon[1] !== expected) { fail(`canonical mismatch: ${mCanon[1]} != ${expected}`); continue; }

  const block =
    `export const metadata: Metadata = buildStateMetadata({\n` +
    `  slug: '${dir}',\n` +
    `  title: '${mTitle[1]}',\n` +
    `  description: '${mDesc[1]}',\n` +
    `});`;

  let out = src.replace(RE_META, block);
  out = out.replace(RE_IMPORT_ANCHOR, (m) => `${m}\n${NEW_IMPORT}`);

  if (APPLY) fs.writeFileSync(file, out, 'utf8');
  ok++;
  console.log(`OK   ${dir.padEnd(22)} ${mTitle[1]}`);
}

console.log('\n' + '-'.repeat(60));
console.log(`${APPLY ? 'MIGRATED' : 'WOULD MIGRATE'}: ${ok} files`);
if (problems.length) {
  console.log(`PROBLEMS: ${problems.length}`);
  for (const p of problems) console.log('  !! ' + p);
  process.exitCode = 1;
} else {
  console.log('PROBLEMS: none');
}
if (!APPLY) console.log('\nDry run — nothing written. Re-run with --apply to write.');
