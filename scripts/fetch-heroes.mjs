// One-shot downloader for public-domain hero images via the NASA Images API.
// Run: node scripts/fetch-heroes.mjs   (network required; degrades gracefully)
import { mkdir, writeFile } from 'node:fs/promises';

const OUT = 'public/images/stations';

// fichier -> requête de recherche NASA
const SUBJECTS = {
  'moon.jpg': 'full moon',
  'jupiter.jpg': 'Jupiter planet',
  'milky-way.jpg': 'Milky Way',
  'orion.jpg': 'Orion Nebula',
  'andromeda.jpg': 'Andromeda Galaxy',
  'pleiades.jpg': 'Pleiades star cluster',
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchOne(file, query) {
  const search = await fetchJson(
    `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`,
  );
  const item = search.collection.items?.[0];
  if (!item) throw new Error('no search result');
  const nasaId = item.data?.[0]?.nasa_id;
  const assets = await fetchJson(
    `https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`,
  );
  const hrefs = (assets.collection.items || []).map((i) => i.href);
  const jpg =
    hrefs.find((h) => /~medium\.jpg$/i.test(h)) ||
    hrefs.find((h) => /~small\.jpg$/i.test(h)) ||
    hrefs.find((h) => /\.jpg$/i.test(h));
  if (!jpg) throw new Error('no jpg asset');
  const res = await fetch(jpg);
  if (!res.ok) throw new Error(`HTTP ${res.status} for asset`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 5000) throw new Error('asset too small / not a real image');
  await writeFile(`${OUT}/${file}`, buf);
  return { file, nasaId, bytes: buf.byteLength };
}

const results = [];
await mkdir(OUT, { recursive: true });
for (const [file, query] of Object.entries(SUBJECTS)) {
  try {
    const r = await fetchOne(file, query);
    console.log(`OK   ${file}  (${r.bytes} bytes, nasa_id=${r.nasaId})`);
    results.push(r);
  } catch (err) {
    console.warn(`SKIP ${file}: ${err.message} — station will use procedural background`);
  }
}
console.log(`\nDownloaded ${results.length}/${Object.keys(SUBJECTS).length} hero images.`);
