import { describe, it, expect } from 'vitest';
import { getMoonInfo, PHASE_KEYS } from '../../src/lib/astronomy';

describe('getMoonInfo', () => {
  it('reports a full Moon during the 14 March 2025 total lunar eclipse', () => {
    const info = getMoonInfo(new Date('2025-03-14T06:00:00Z'));
    expect(info.illumination).toBeGreaterThan(0.98);
    expect(info.phaseKey).toBe('full');
  });

  it('reports a new Moon during the 29 March 2025 partial solar eclipse', () => {
    const info = getMoonInfo(new Date('2025-03-29T10:00:00Z'));
    expect(info.illumination).toBeLessThan(0.02);
    expect(info.phaseKey).toBe('new');
  });

  it('always returns illumination within [0,1] and a known phase key', () => {
    const info = getMoonInfo(new Date('2025-07-01T00:00:00Z'));
    expect(info.illumination).toBeGreaterThanOrEqual(0);
    expect(info.illumination).toBeLessThanOrEqual(1);
    expect(PHASE_KEYS).toContain(info.phaseKey);
  });

  it('defaults to the current date when none is given', () => {
    const info = getMoonInfo();
    expect(PHASE_KEYS).toContain(info.phaseKey);
  });
});
