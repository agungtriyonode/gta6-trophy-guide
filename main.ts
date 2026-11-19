// Leonida Legend — the hand-in program for the GTA 6 trophy guide entry.
//
// What this entry is: a folder of plain static files under app/ (one page, one
// script, one stylesheet and the trophy data) that a browser opens at
// app/index.html with no build step and no network at runtime. The guide
// itself is the data file app/data/trophies.json: all 55 trophies, each with
// its own unlock guide, sources, kind, missable flag and roadmap stage.
//
// What this program does: it gathers app/ and screenshots/ from beside this
// file into the output directory and writes dossier.json there — the summary
// the judge reads (first-load files and bytes, screenshots, sources) — using
// the vendored make.fun library, which must stay untouched so the scorer's
// own copy produces byte-for-byte the same dossier.
//
// Run it locally with:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The grader runs it with /output instead. It is deterministic: same input,
// same bytes out, every run.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Start from a clean output directory so a second run cannot inherit stale
// files from the first — that is what keeps two runs byte-identical.
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Caps from the competition's gate: at most 4 screenshots of 256 KiB each,
// at most 993 entries and 48 MiB under app/. Only text_max_bytes changes
// the dossier bytes; the rest make this program refuse what the scorer
// would refuse.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
