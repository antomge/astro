export interface Star {
  /** position normalisée 0..1 */
  x: number;
  y: number;
  /** rayon en pixels (à l'échelle 1x) */
  r: number;
  /** profondeur de couche 1..layers (plus grand = plus proche = plus de parallax) */
  depth: number;
  /** opacité de base 0..1 */
  alpha: number;
}

/** PRNG déterministe (mulberry32) */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateStars(count: number, seed = 1, layers = 3): Star[] {
  const rand = mulberry32(seed);
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const depth = 1 + Math.floor(rand() * layers); // 1..layers
    const near = depth === layers;
    stars.push({
      x: rand(),
      y: rand(),
      r: 0.4 + rand() * (near ? 1.6 : 0.8),
      depth,
      alpha: 0.3 + rand() * 0.7,
    });
  }
  return stars;
}
