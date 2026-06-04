import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  objectSchema,
  equipmentSchema,
  factSchema,
  glossarySchema,
} from './content/schemas';

const md = (dir: string) => glob({ pattern: '**/*.md', base: `./src/content/${dir}` });

export const collections = {
  objects: defineCollection({ loader: md('objects'), schema: objectSchema }),
  equipment: defineCollection({ loader: md('equipment'), schema: equipmentSchema }),
  facts: defineCollection({ loader: md('facts'), schema: factSchema }),
  glossary: defineCollection({ loader: md('glossary'), schema: glossarySchema }),
};
