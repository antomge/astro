import { MoonPhase, Illumination, Body } from 'astronomy-engine';

export const PHASE_KEYS = [
  'new',
  'waxingCrescent',
  'firstQuarter',
  'waxingGibbous',
  'full',
  'waningGibbous',
  'lastQuarter',
  'waningCrescent',
] as const;

export type PhaseKey = (typeof PHASE_KEYS)[number];

export interface MoonInfo {
  /** Fraction illuminée, 0..1 */
  illumination: number;
  /** Angle de phase écliptique en degrés : 0 = nouvelle, 90 = 1er quartier, 180 = pleine, 270 = dernier quartier */
  phaseAngle: number;
  phaseKey: PhaseKey;
}

function phaseKeyFromAngle(angle: number): PhaseKey {
  const a = ((angle % 360) + 360) % 360;
  if (a < 22.5 || a >= 337.5) return 'new';
  if (a < 67.5) return 'waxingCrescent';
  if (a < 112.5) return 'firstQuarter';
  if (a < 157.5) return 'waxingGibbous';
  if (a < 202.5) return 'full';
  if (a < 247.5) return 'waningGibbous';
  if (a < 292.5) return 'lastQuarter';
  return 'waningCrescent';
}

export function getMoonInfo(date: Date = new Date()): MoonInfo {
  const phaseAngle = MoonPhase(date); // degrés, 0..360
  const illum = Illumination(Body.Moon, date);
  return {
    illumination: illum.phase_fraction, // 0..1
    phaseAngle,
    phaseKey: phaseKeyFromAngle(phaseAngle),
  };
}
