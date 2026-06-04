import { describe, it, expect } from 'vitest';
import { project, type Viewport } from '../../src/lib/skymap';

const v: Viewport = { centerRa: 0, centerDec: 0, scale: 100, width: 800, height: 600 };

describe('project (stereographic)', () => {
  it('maps the view center to the canvas centre', () => {
    const p = project(0, 0, v);
    expect(p.x).toBeCloseTo(400);
    expect(p.y).toBeCloseTo(300);
    expect(p.visible).toBe(true);
  });

  it('places higher declination above the centre (smaller y)', () => {
    const p = project(0, 20, v);
    expect(p.y).toBeLessThan(300);
    expect(p.x).toBeCloseTo(400);
  });

  it('places increasing RA to the left (smaller x) under the flipped projection', () => {
    const p = project(20, 0, v);
    expect(p.x).toBeLessThan(400);
  });

  it('marks the antipode of the centre as not visible', () => {
    const p = project(180, 0, v);
    expect(p.visible).toBe(false);
  });
});
