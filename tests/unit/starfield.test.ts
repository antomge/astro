import { describe, it, expect } from 'vitest';
import { generateStars } from '../../src/lib/starfield';

describe('generateStars', () => {
  it('returns the requested number of stars', () => {
    expect(generateStars(50)).toHaveLength(50);
  });

  it('is deterministic for a given seed', () => {
    const a = generateStars(20, 42);
    const b = generateStars(20, 42);
    expect(a).toEqual(b);
  });

  it('produces different fields for different seeds', () => {
    const a = generateStars(20, 1);
    const b = generateStars(20, 2);
    expect(a).not.toEqual(b);
  });

  it('keeps every star within normalized bounds', () => {
    for (const s of generateStars(200, 7, 3)) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThan(1);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThan(1);
      expect(s.r).toBeGreaterThan(0);
      expect(s.alpha).toBeGreaterThan(0);
      expect(s.alpha).toBeLessThanOrEqual(1);
      expect(s.depth).toBeGreaterThanOrEqual(1);
      expect(s.depth).toBeLessThanOrEqual(3);
    }
  });
});
