import { describe, it, expect } from 'vitest';
import { objectSchema, glossarySchema } from '../../src/content/schemas';

const validMoon = {
  type: 'moon',
  title: { fr: 'La Lune', en: 'The Moon' },
  summary: { fr: 'Notre satellite naturel.', en: 'Our natural satellite.' },
  deepDive: { fr: 'Détails…', en: 'Details…' },
  image: '/images/objects/moon.jpg',
  imageCredit: 'NASA',
};

describe('content schemas', () => {
  it('accepts a valid object entry and defaults featuredOnSkyMap to false', () => {
    const parsed = objectSchema.safeParse(validMoon);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.featuredOnSkyMap).toBe(false);
  });

  it('rejects an object with an unknown type', () => {
    const parsed = objectSchema.safeParse({ ...validMoon, type: 'comet' });
    expect(parsed.success).toBe(false);
  });

  it('rejects a localized field missing the English value', () => {
    const parsed = objectSchema.safeParse({
      ...validMoon,
      title: { fr: 'La Lune' },
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts a valid glossary entry', () => {
    const parsed = glossarySchema.safeParse({
      term: { fr: 'Magnitude', en: 'Magnitude' },
      definition: { fr: 'Mesure de l’éclat.', en: 'A measure of brightness.' },
    });
    expect(parsed.success).toBe(true);
  });
});
