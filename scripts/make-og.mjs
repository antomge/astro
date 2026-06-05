// Generates the Open Graph share card public/og.png (1200x630) with sharp (no fonts needed).
// Run once: node scripts/make-og.mjs   (output is committed to the repo)
import sharp from 'sharp';

const W = 1200;
const H = 630;

function stars(n) {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = Math.round(rnd() * W);
    const y = Math.round(rnd() * H);
    const r = (rnd() * 1.6 + 0.4).toFixed(1);
    const o = (rnd() * 0.7 + 0.3).toFixed(2);
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#e8edf7" opacity="${o}"/>`;
  }
  return s;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#05070d"/><stop offset="0.6" stop-color="#0a0e1a"/><stop offset="1" stop-color="#10131f"/>
    </linearGradient>
    <radialGradient id="glow" cx="78%" cy="32%" r="42%">
      <stop offset="0" stop-color="#7fd8ff" stop-opacity="0.35"/><stop offset="1" stop-color="#7fd8ff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  ${stars(150)}
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g transform="translate(950,205)">
    <circle r="120" fill="#f4f1e8"/>
    <circle cx="46" cy="-32" r="120" fill="#0a0e1a"/>
  </g>
  <rect x="0" y="566" width="${W}" height="6" fill="#7fd8ff" opacity="0.55"/>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/og.png');
console.log('Wrote public/og.png');
