import { describe, it, expect } from 'vitest';
import { stations, localize } from '../../src/data/journey';

describe('journey stations', () => {
  it('has exactly 6 stations ordered 0..5 with unique ids', () => {
    expect(stations).toHaveLength(6);
    const orders = stations.map((s) => s.order).sort((a, b) => a - b);
    expect(orders).toEqual([0, 1, 2, 3, 4, 5]);
    const ids = new Set(stations.map((s) => s.id));
    expect(ids.size).toBe(6);
  });

  it('provides both FR and EN for every text field', () => {
    for (const s of stations) {
      for (const field of [s.kicker, s.title, s.body]) {
        expect(field.fr.length).toBeGreaterThan(0);
        expect(field.en.length).toBeGreaterThan(0);
      }
      if (s.fact) {
        expect(s.fact.fr.length).toBeGreaterThan(0);
        expect(s.fact.en.length).toBeGreaterThan(0);
      }
    }
  });

  it('gives every station a two-stop gradient', () => {
    for (const s of stations) {
      expect(s.gradient).toHaveLength(2);
      for (const c of s.gradient) expect(c).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('marks only the moon station as the moon widget', () => {
    const widgets = stations.filter((s) => s.widget === 'moon');
    expect(widgets).toHaveLength(1);
    expect(widgets[0].id).toBe('moon');
  });

  it('localize() returns the requested language', () => {
    expect(localize({ fr: 'Lune', en: 'Moon' }, 'en')).toBe('Moon');
    expect(localize({ fr: 'Lune', en: 'Moon' }, 'fr')).toBe('Lune');
  });
});
