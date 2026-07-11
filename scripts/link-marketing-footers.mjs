// scripts/link-marketing-footers.mjs
//
// Adds /states, /blog, /about to the footer nav of the last four pages that
// still linked to nothing: /generate (via SiteChrome), /terms, /privacy, /refund.
// Also adds About to SiteChrome's header nav.
//
// WHY: a live crawl on July 11, 2026 found these four pages linked to no
// marketing page at all — not the /states hub, not /about, not /blog.
//
// ⚠️ ROOT CAUSE, NOT FIXED HERE: this codebase has TEN hand-maintained copies of
// the footer (HomeClient, SiteChrome, terms, privacy, refund, blog, StatePage,
// CityPage, /states, /about). Every new page means remembering to add these links
// again — and that has already failed once. The durable fix is ONE shared
// <SiteFooter /> component. Logged to the backlog; this script is the stopgap.
//
// Dry run:   node scripts/link-marketing-footers.mjs
// Apply:     node scripts/link-marketing-footers.mjs --apply

import fs from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');

const FILES = [
  'app/components/SiteChrome.tsx',
  'app/terms/page.tsx',
  'app/privacy/page.tsx',
  'app/refund/page.tsx',
];

// The footer nav opening + first link — identical across all four files.
const FOOTER_ANCHOR = `          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <Link href="/terms" className="transition hover:text-slate-900">
              Terms
            </Link>`;

const FOOTER_NEW = `          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <Link href="/states" className="transition hover:text-slate-900">
              All states
            </Link>
            <Link href="/blog" className="transition hover:text-slate-900">
              Blog
            </Link>
            <Link href="/about" className="transition hover:text-slate-900">
              About
            </Link>
            <Link href="/terms" className="transition hover:text-slate-900">
              Terms
            </Link>`;

// SiteChrome only: add About to the primary header nav.
const HEADER_ANCHOR = `            <a href={sectionLink('#faq')} className="transition hover:text-slate-900">
              FAQ
            </a>`;

const HEADER_NEW = `            <a href={sectionLink('#faq')} className="transition hover:text-slate-900">
              FAQ
            </a>
            <Link href="/about" className="transition hover:text-slate-900">
              About
            </Link>`;

let changed = 0;
const problems = [];

for (const rel of FILES) {
  const file = path.join(process.cwd(), rel);
  if (!fs.existsSync(file)) {
    problems.push(`${rel} — file not found`);
    continue;
  }

  const src = fs.readFileSync(file, 'utf8');

  if (src.includes('href="/states"')) {
    problems.push(`${rel} — already links /states (skipped)`);
    continue;
  }
  if (!src.includes(FOOTER_ANCHOR)) {
    problems.push(`${rel} — footer nav block did not match exactly`);
    continue;
  }

  let out = src.replace(FOOTER_ANCHOR, FOOTER_NEW);
  const notes = ['footer'];

  if (rel.endsWith('SiteChrome.tsx')) {
    if (!out.includes(HEADER_ANCHOR)) {
      problems.push(`${rel} — header nav block did not match`);
      continue;
    }
    out = out.replace(HEADER_ANCHOR, HEADER_NEW);
    notes.push('header');
  }

  if (APPLY) fs.writeFileSync(file, out, 'utf8');
  changed++;
  console.log(`OK   ${rel.padEnd(34)} (${notes.join(' + ')})`);
}

console.log('\n' + '-'.repeat(60));
console.log(`${APPLY ? 'PATCHED' : 'WOULD PATCH'}: ${changed} files`);
if (problems.length) {
  console.log(`PROBLEMS: ${problems.length}`);
  for (const p of problems) console.log('  !! ' + p);
  process.exitCode = 1;
} else {
  console.log('PROBLEMS: none');
}
if (!APPLY) console.log('\nDry run — nothing written. Re-run with --apply to write.');
