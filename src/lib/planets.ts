import { Body, GeoVector, EquatorFromVector } from 'astronomy-engine';

export interface PlanetPos {
  id: string;
  fr: string;
  en: string;
  color: string;
  /** ascension droite, degrés 0..360 */
  ra: number;
  /** déclinaison, degrés -90..90 */
  dec: number;
}

const BODIES = [
  { body: Body.Sun, fr: 'Soleil', en: 'Sun', color: '#ffd166' },
  { body: Body.Moon, fr: 'Lune', en: 'Moon', color: '#e8edf7' },
  { body: Body.Mercury, fr: 'Mercure', en: 'Mercury', color: '#c9c0b0' },
  { body: Body.Venus, fr: 'Vénus', en: 'Venus', color: '#f5e7c0' },
  { body: Body.Mars, fr: 'Mars', en: 'Mars', color: '#ff7043' },
  { body: Body.Jupiter, fr: 'Jupiter', en: 'Jupiter', color: '#e3c9a0' },
  { body: Body.Saturn, fr: 'Saturne', en: 'Saturn', color: '#e8d39a' },
  { body: Body.Uranus, fr: 'Uranus', en: 'Uranus', color: '#9fe3e0' },
  { body: Body.Neptune, fr: 'Neptune', en: 'Neptune', color: '#7f9fff' },
] as const;

/** Positions géocentriques (J2000, cohérentes avec le catalogue d'étoiles) à une date donnée. */
export function getPlanets(date: Date = new Date()): PlanetPos[] {
  return BODIES.map((b) => {
    const eq = EquatorFromVector(GeoVector(b.body, date, true));
    return {
      id: b.en.toLowerCase(),
      fr: b.fr,
      en: b.en,
      color: b.color,
      ra: (((eq.ra * 15) % 360) + 360) % 360,
      dec: eq.dec,
    };
  });
}
