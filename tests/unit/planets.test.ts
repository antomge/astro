import { describe, it, expect } from 'vitest';
import { getPlanets } from '../../src/lib/planets';

describe('getPlanets', () => {
  it('returns the Sun, Moon and seven planets with valid coordinates', () => {
    const planets = getPlanets(new Date('2025-06-21T00:00:00Z'));
    expect(planets).toHaveLength(9);
    for (const p of planets) {
      expect(p.ra).toBeGreaterThanOrEqual(0);
      expect(p.ra).toBeLessThan(360);
      expect(p.dec).toBeGreaterThanOrEqual(-90);
      expect(p.dec).toBeLessThanOrEqual(90);
      expect(p.fr.length).toBeGreaterThan(0);
      expect(p.en.length).toBeGreaterThan(0);
    }
  });

  it('places the Sun near the vernal point at the March 2025 equinox', () => {
    const planets = getPlanets(new Date('2025-03-20T09:01:00Z'));
    const sun = planets.find((p) => p.id === 'sun');
    expect(sun).toBeDefined();
    expect(Math.abs(sun!.dec)).toBeLessThan(1);
    expect(sun!.ra < 5 || sun!.ra > 355).toBe(true);
  });
});
