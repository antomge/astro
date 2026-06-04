// One-shot generator for the bright-star sky catalog used by the Sky Map.
// Source: d3-celestial by Olaf Frohn (BSD-2-Clause). https://github.com/ofrohn/d3-celestial
// Run: node scripts/fetch-sky.mjs   (network required; the JSON output is COMMITTED to the repo)
import { mkdir, writeFile } from 'node:fs/promises';

const OUT = 'src/data/sky';
const MAG_LIMIT = 4.5;
const STARS_URL = 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/stars.6.json';
const LINES_URL = 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json';

const norm = (lon) => ((lon % 360) + 360) % 360;

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

const starsGeo = await getJson(STARS_URL);
const stars = starsGeo.features
  .map((f) => ({
    ra: norm(f.geometry.coordinates[0]),
    dec: f.geometry.coordinates[1],
    mag: f.properties.mag,
    name: f.properties.name || undefined,
  }))
  .filter((s) => typeof s.mag === 'number' && s.mag <= MAG_LIMIT);

const linesGeo = await getJson(LINES_URL);
const constellations = linesGeo.features.map((f) => {
  const polys =
    f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates];
  return {
    name: f.properties?.name || f.id || 'unknown',
    lines: polys.map((poly) => poly.map(([lon, lat]) => [norm(lon), lat])),
  };
});

await mkdir(OUT, { recursive: true });
await writeFile(`${OUT}/stars.json`, JSON.stringify(stars));
await writeFile(`${OUT}/constellations.json`, JSON.stringify(constellations));
console.log(`Wrote ${stars.length} stars and ${constellations.length} constellations to ${OUT}/`);
