import { describe, it, expect } from 'vitest';
import starsJson from '../../src/data/sky/stars.json';
import constellationsJson from '../../src/data/sky/constellations.json';

const stars = starsJson as { ra: number; dec: number; mag: number; name?: string }[];
const constellations = constellationsJson as {
  abbr: string;
  fr: string;
  en: string;
  rank: number;
  label: [number, number] | null;
  lines: number[][][];
}[];

describe('sky catalog data', () => {
  it('has a non-trivial number of bright stars within valid bounds', () => {
    expect(Array.isArray(stars)).toBe(true);
    expect(stars.length).toBeGreaterThan(100);
    for (const s of stars.slice(0, 80)) {
      expect(s.ra).toBeGreaterThanOrEqual(0);
      expect(s.ra).toBeLessThan(360);
      expect(s.dec).toBeGreaterThanOrEqual(-90);
      expect(s.dec).toBeLessThanOrEqual(90);
      expect(typeof s.mag).toBe('number');
      expect(s.mag).toBeLessThanOrEqual(4.5);
    }
  });

  it('has constellation polylines of [ra,dec] points', () => {
    expect(Array.isArray(constellations)).toBe(true);
    expect(constellations.length).toBeGreaterThan(10);
    const c = constellations[0];
    expect(Array.isArray(c.lines)).toBe(true);
    expect(c.lines.length).toBeGreaterThan(0);
    const poly = c.lines[0];
    expect(Array.isArray(poly)).toBe(true);
    expect(poly[0]).toHaveLength(2);
  });

  it('gives every constellation a bilingual name and a label position', () => {
    for (const c of constellations) {
      expect(typeof c.fr).toBe('string');
      expect(c.fr.length).toBeGreaterThan(0);
      expect(typeof c.en).toBe('string');
      expect(c.en.length).toBeGreaterThan(0);
      if (c.label) {
        expect(c.label).toHaveLength(2);
        expect(c.label[0]).toBeGreaterThanOrEqual(0);
        expect(c.label[0]).toBeLessThan(360);
      }
    }
  });
});
