// One-shot downloader for public-domain hero images via the NASA Images API.
// Among the first few search results, picks the HIGHEST-resolution JPEG, then
// re-encodes it to a crisp, web-sized JPEG with sharp. A few subjects are pinned
// to a specific NASA id when the top search result isn't the cleanest image.
// Run: node scripts/fetch-heroes.mjs   (network required; degrades gracefully)
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const OUT = 'public/images/stations';
const MAX_WIDTH = 2000; // cap so full-res NASA originals stay web-friendly
const JPEG_QUALITY = 85;
const GOOD_ENOUGH_WIDTH = 1800; // stop scanning results once we find one this wide
const CANDIDATES = 6; // how many search results to consider per subject

// fichier -> requête de recherche NASA
const SUBJECTS = {
  'moon.jpg': 'full moon',
  'jupiter.jpg': 'Jupiter planet',
  'milky-way.jpg': 'Milky Way',
  'orion.jpg': 'Orion Nebula',
  'andromeda.jpg': 'Andromeda Galaxy',
  'pleiades.jpg': 'Pleiades star cluster',
  'saturn.jpg': 'Saturn rings Cassini',
};

// Pinned NASA ids that override the search, for subjects where the top result
// isn't the cleanest image. e001861 = a clean full-disc Moon (NASA Goddard SVS
// "Phases of the Moon" series), preferred over dramatic ground-based moonrises.
const PINS = {
  'moon.jpg': 'GSFC_20171208_Archive_e001861',
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// Largest reasonable JPEG variant in a NASA asset manifest.
function pickBestJpg(hrefs) {
  return (
    hrefs.find((h) => /~orig\.jpg$/i.test(h)) ||
    hrefs.find((h) => /~large\.jpg$/i.test(h)) ||
    hrefs.find((h) => /~medium\.jpg$/i.test(h)) ||
    hrefs.find((h) => /\.jpg$/i.test(h))
  );
}

// Download the best JPEG for one NASA id and measure its real pixel width.
async function candidateForId(nasaId) {
  const assets = await fetchJson(
    `https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`,
  );
  const hrefs = (assets.collection.items || []).map((i) => i.href);
  const jpg = pickBestJpg(hrefs);
  if (!jpg) return null;
  const res = await fetch(jpg);
  if (!res.ok) return null;
  const src = Buffer.from(await res.arrayBuffer());
  if (src.byteLength < 5000) return null;
  const meta = await sharp(src).metadata();
  return { src, width: meta.width ?? 0, nasaId };
}

// Re-encode to a crisp, web-sized JPEG and write it out.
async function encodeAndWrite(file, cand) {
  const out = await sharp(cand.src)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
  const meta = await sharp(out).metadata();
  await writeFile(`${OUT}/${file}`, out);
  return { file, nasaId: cand.nasaId, bytes: out.byteLength, width: meta.width };
}

async function fetchOne(file, query) {
  // Pinned override first.
  if (PINS[file]) {
    try {
      const cand = await candidateForId(PINS[file]);
      if (cand) return encodeAndWrite(file, cand);
    } catch {
      // fall through to search
    }
  }

  const search = await fetchJson(
    `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`,
  );
  const items = (search.collection.items || []).slice(0, CANDIDATES);
  if (!items.length) throw new Error('no search result');

  let best = null;
  for (const item of items) {
    const nasaId = item.data?.[0]?.nasa_id;
    if (!nasaId) continue;
    let cand = null;
    try {
      cand = await candidateForId(nasaId);
    } catch {
      cand = null;
    }
    if (!cand) continue;
    if (!best || cand.width > best.width) best = cand;
    if (best.width >= GOOD_ENOUGH_WIDTH) break;
  }
  if (!best) throw new Error('no usable image found');
  return encodeAndWrite(file, best);
}

const results = [];
await mkdir(OUT, { recursive: true });
for (const [file, query] of Object.entries(SUBJECTS)) {
  try {
    const r = await fetchOne(file, query);
    console.log(`OK   ${file}  (${r.width}px, ${Math.round(r.bytes / 1024)} KB, nasa_id=${r.nasaId})`);
    results.push(r);
  } catch (err) {
    console.warn(`SKIP ${file}: ${err.message} — station will use procedural background`);
  }
}
console.log(`\nDownloaded ${results.length}/${Object.keys(SUBJECTS).length} hero images.`);
