import { z } from 'astro/zod';

/** Champ bilingue FR/EN */
export const localized = z.object({ fr: z.string(), en: z.string() });

export const objectSchema = z.object({
  type: z.enum(['moon', 'planet', 'nebula', 'galaxy', 'star']),
  title: localized,
  summary: localized, // vulgarisation
  deepDive: localized, // pour aller plus loin
  observingTips: localized.optional(),
  image: z.string(), // chemin relatif dans /public (image() viendra plus tard)
  imageCredit: z.string(),
  constellation: z.string().optional(),
  magnitude: z.number().optional(),
  featuredOnSkyMap: z.boolean().default(false),
  skyCoords: z.object({ raHours: z.number(), decDeg: z.number() }).optional(),
});

export const equipmentSchema = z.object({
  category: z.enum(['binoculars', 'refractor', 'telescope', 'mount', 'camera', 'filter']),
  level: z.enum(['beginner', 'intermediate']),
  budgetEur: z.number().optional(),
  title: localized,
  body: localized,
});

export const factSchema = z.object({
  text: localized,
  source: z.string().optional(),
  relatedObject: z.string().optional(),
});

export const glossarySchema = z.object({
  term: localized,
  definition: localized,
});
