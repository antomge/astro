# Nocturne — Phase 1 : Fondations & première tranche verticale — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en ligne un squelette de site Astro bilingue (FR/EN), avec le design system, le routage i18n, les schémas de contenu typés, une librairie de phase de Lune calculée côté navigateur et testée, et une première page d'accueil (station « Décollage » + section Lune avec widget réel) — buildée et prête pour Cloudflare Pages.

**Architecture :** Site statique Astro. Le contenu est typé via les *content collections* (schémas zod partagés et testables). La logique pure (i18n, astronomie) vit dans `src/lib` / `src/i18n` et est testée avec Vitest. Les morceaux interactifs sont des îlots React hydratés à la demande. Aucun back-end ; la phase de Lune se calcule dans le navigateur avec `astronomy-engine`.

**Tech Stack :** Astro · TypeScript (strict) · Tailwind CSS v4 (`@tailwindcss/vite`) · `@astrojs/react` (React) · `astronomy-engine` · Vitest · Playwright · GSAP (installé ici, exploité en phase 2).

**Référence :** spec validée dans `docs/superpowers/specs/2026-06-04-nocturne-astronomy-site-design.md`.

> **Convention de commit :** chaque message de commit se termine par la ligne
> `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
> (ajoutée via un second `-m` dans les commandes ci-dessous).

---

## Structure des fichiers (vue d'ensemble)

```
astro.config.mjs            # config Astro : i18n FR/EN, React, Tailwind (vite)
vitest.config.ts            # config Vitest via getViteConfig (résolution Astro)
playwright.config.ts        # config Playwright (smoke e2e)
tsconfig.json               # TS strict (généré par Astro)
src/
  styles/global.css         # @import tailwindcss + @theme (design tokens)
  i18n/
    ui.ts                   # dictionnaires FR/EN + langues
    utils.ts                # getLangFromUrl, useTranslations, localizedPath
  lib/
    astronomy.ts            # getMoonInfo (phase de Lune côté navigateur)
  content/
    schemas.ts              # schémas zod partagés (testables hors Astro)
    config.ts               # content collections (réutilise schemas.ts)
    objects/la-lune.md       # 1re fiche atlas (seed), bilingue
    facts/andromede.md       # 1 fact (seed)
    glossary/magnitude.md    # 1 terme (seed)
    equipment/jumelles.md    # 1 entrée matériel (seed)
  components/
    Layout.astro            # <html>, head, polices, global.css, lang
    Header.astro            # logo + nav + sélecteur de langue
    MoonPhase.tsx           # îlot React : phase de Lune du jour
    HomeJourney.astro       # composition de la page d'accueil (prend lang)
    sections/
      Liftoff.astro         # station 0 « Décollage »
      LunarSection.astro    # section Lune (intègre <MoonPhase/>)
  pages/
    index.astro             # accueil FR (/)
    en/index.astro          # accueil EN (/en/)
tests/
  unit/
    i18n.test.ts
    astronomy.test.ts
    schemas.test.ts
  e2e/
    smoke.spec.ts
DEPLOY.md                   # étapes de déploiement Cloudflare Pages
```

---

## Task 1 : Échafaudage du projet (Astro + Tailwind + React + outils de test)

**Files:**
- Create: `astro.config.mjs`, `tsconfig.json`, `package.json`, `src/styles/global.css` (générés/ajustés par les commandes), `vitest.config.ts`
- Note : on échafaude **dans le dépôt existant** (qui contient déjà `CV.pdf`, `.gitignore`, `docs/`).

- [ ] **Step 1 : Échafauder Astro dans le dossier courant**

Run :
```bash
npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git --yes
```
Expected : un projet Astro minimal est créé dans le dossier courant (la CLI prévient que le dossier n'est pas vide puis continue grâce à `--yes`). `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro` apparaissent. `CV.pdf`, `.gitignore` et `docs/` sont préservés.

- [ ] **Step 2 : Installer les dépendances de base**

Run :
```bash
npm install
```
Expected : `node_modules/` créé, aucune erreur. (`node_modules/` est déjà ignoré par `.gitignore`.)

- [ ] **Step 3 : Ajouter Tailwind v4 et React**

Run :
```bash
npx astro add tailwind react --yes
```
Expected : installe `@tailwindcss/vite`, `@astrojs/react`, `react`, `react-dom` ; met à jour `astro.config.mjs` (plugin Vite Tailwind + intégration React) ; crée/branche un fichier CSS global.

- [ ] **Step 4 : Installer les librairies métier et de test**

Run :
```bash
npm install astronomy-engine gsap @fontsource-variable/inter @fontsource/cormorant-garamond
npm install -D vitest @playwright/test @astrojs/check
```
Expected : dépendances ajoutées à `package.json` sans erreur.

- [ ] **Step 5 : Écrire `astro.config.mjs` (i18n + intégrations)**

Remplacer le contenu de `astro.config.mjs` par :
```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://nocturne.pages.dev',
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 6 : Créer `vitest.config.ts`**

```ts
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
```

- [ ] **Step 7 : Ajouter les scripts npm**

Dans `package.json`, dans `"scripts"`, ajouter (conserver les scripts `dev`/`build`/`preview` existants) :
```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test"
```

- [ ] **Step 8 : Vérifier que le serveur de dev démarre**

Run :
```bash
npm run dev
```
Expected : Astro démarre sur `http://localhost:4321/` sans erreur. Arrêter le serveur (Ctrl+C) après vérification.

- [ ] **Step 9 : Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro project with Tailwind, React and test tooling" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2 : Design system (tokens, polices, styles globaux)

**Files:**
- Modify/Create: `src/styles/global.css`
- Modify: `src/components/Layout.astro` (créé en Task 7 — ici on prépare seulement le CSS ; l'import se fait en Task 7)

- [ ] **Step 1 : Écrire les tokens du design system dans `src/styles/global.css`**

Remplacer le contenu par :
```css
@import "tailwindcss";

@theme {
  /* Palette espace profond */
  --color-space: #05070d;
  --color-space-800: #0a0e1a;
  --color-space-700: #121829;
  --color-starlight: #e8edf7;
  --color-muted: #9aa6bf;

  /* Accents lumineux */
  --color-stellar: #7fd8ff; /* cyan stellaire */
  --color-ember: #ffb673;   /* ambre chaud */

  /* Typographies */
  --font-display: "Cormorant Garamond", Georgia, serif;
  --font-sans: "Inter Variable", "Inter", system-ui, sans-serif;
}

:root {
  color-scheme: dark;
}

body {
  background-color: var(--color-space);
  color: var(--color-starlight);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: 0.01em;
}

/* Respect de l'accessibilité : animations réduites */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2 : Vérifier que Tailwind compile les tokens**

Run :
```bash
npm run dev
```
Expected : démarre sans erreur de compilation CSS. Les utilitaires `bg-space`, `text-stellar`, `font-display` seront disponibles (vérifiés visuellement en Task 8). Arrêter le serveur.

- [ ] **Step 3 : Commit**

```bash
git add -A
git commit -m "feat: add deep-space design tokens and global styles" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3 : Helpers i18n (TDD)

**Files:**
- Create: `src/i18n/ui.ts`, `src/i18n/utils.ts`
- Test: `tests/unit/i18n.test.ts`

- [ ] **Step 1 : Écrire le dictionnaire `src/i18n/ui.ts`**

```ts
export const languages = { fr: 'Français', en: 'English' } as const;
export const defaultLang = 'fr';

export const ui = {
  fr: {
    'site.name': 'Nocturne',
    'nav.home': 'Le Voyage',
    'nav.skymap': 'La Carte du ciel',
    'nav.atlas': "L'Atlas",
    'nav.gear': 'Le Coin Matériel',
    'nav.glossary': 'Glossaire',
    'station.liftoff.kicker': 'Station 0 — Décollage',
    'station.liftoff.title': 'Levez les yeux',
    'station.liftoff.body':
      "Au-dessus des lumières de la ville, un océan d'étoiles attend. Faites défiler pour décoller.",
    'station.moon.kicker': 'Station 1 — La Lune',
    'station.moon.title': 'Notre voisine',
    'station.moon.body':
      "La Lune change de visage chaque nuit. Voici sa phase, telle qu'elle apparaît aujourd'hui.",
    'moon.title': 'Phase de la Lune aujourd’hui',
    'moon.illumination': 'Illumination',
    'phase.new': 'Nouvelle Lune',
    'phase.waxingCrescent': 'Premier croissant',
    'phase.firstQuarter': 'Premier quartier',
    'phase.waxingGibbous': 'Gibbeuse croissante',
    'phase.full': 'Pleine Lune',
    'phase.waningGibbous': 'Gibbeuse décroissante',
    'phase.lastQuarter': 'Dernier quartier',
    'phase.waningCrescent': 'Dernier croissant',
  },
  en: {
    'site.name': 'Nocturne',
    'nav.home': 'The Journey',
    'nav.skymap': 'The Sky Map',
    'nav.atlas': 'The Atlas',
    'nav.gear': 'Gear Corner',
    'nav.glossary': 'Glossary',
    'station.liftoff.kicker': 'Station 0 — Lift-off',
    'station.liftoff.title': 'Look up',
    'station.liftoff.body':
      'Above the city lights, an ocean of stars is waiting. Scroll to lift off.',
    'station.moon.kicker': 'Station 1 — The Moon',
    'station.moon.title': 'Our neighbour',
    'station.moon.body':
      'The Moon changes face every night. Here is its phase, as it appears today.',
    'moon.title': "Today's Moon phase",
    'moon.illumination': 'Illumination',
    'phase.new': 'New Moon',
    'phase.waxingCrescent': 'Waxing Crescent',
    'phase.firstQuarter': 'First Quarter',
    'phase.waxingGibbous': 'Waxing Gibbous',
    'phase.full': 'Full Moon',
    'phase.waningGibbous': 'Waning Gibbous',
    'phase.lastQuarter': 'Last Quarter',
    'phase.waningCrescent': 'Waning Crescent',
  },
} as const;

export type Lang = keyof typeof ui;
export type UIKey = keyof (typeof ui)['fr'];
```

- [ ] **Step 2 : Écrire le test qui échoue `tests/unit/i18n.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { getLangFromUrl, useTranslations, localizedPath } from '../../src/i18n/utils';

describe('i18n utils', () => {
  it('detects "en" from the URL path', () => {
    expect(getLangFromUrl(new URL('https://nocturne.pages.dev/en/atlas'))).toBe('en');
  });

  it('defaults to "fr" when there is no locale prefix', () => {
    expect(getLangFromUrl(new URL('https://nocturne.pages.dev/atlas'))).toBe('fr');
  });

  it('translates a key for the requested language', () => {
    const t = useTranslations('en');
    expect(t('nav.home')).toBe('The Journey');
  });

  it('builds the FR -> EN path preserving the current page', () => {
    expect(localizedPath('/atlas/la-lune', 'en')).toBe('/en/atlas/la-lune');
  });

  it('builds the EN -> FR path by stripping the prefix', () => {
    expect(localizedPath('/en/atlas/la-lune', 'fr')).toBe('/atlas/la-lune');
  });

  it('maps the FR home "/" to "/en/" and back', () => {
    expect(localizedPath('/', 'en')).toBe('/en/');
    expect(localizedPath('/en/', 'fr')).toBe('/');
  });
});
```

- [ ] **Step 3 : Lancer le test pour vérifier qu'il échoue**

Run :
```bash
npm test -- tests/unit/i18n.test.ts
```
Expected : FAIL — `src/i18n/utils` n'existe pas encore (erreur de résolution de module).

- [ ] **Step 4 : Écrire `src/i18n/utils.ts`**

```ts
import { ui, defaultLang, type Lang, type UIKey } from './ui';

export function getLangFromUrl(url: URL): Lang {
  const segment = url.pathname.split('/')[1];
  if (segment in ui) return segment as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: UIKey): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

/**
 * Renvoie le chemin équivalent dans la langue cible.
 * FR est sans préfixe ("/atlas"), EN est préfixé ("/en/atlas").
 */
export function localizedPath(pathname: string, target: Lang): string {
  // Retire un éventuel préfixe de langue existant
  let path = pathname.replace(/^\/(fr|en)(?=\/|$)/, '');
  if (path === '') path = '/';

  if (target === defaultLang) {
    return path;
  }
  // Cible non par défaut : préfixe avec la langue
  if (path === '/') return `/${target}/`;
  return `/${target}${path}`;
}
```

- [ ] **Step 5 : Lancer le test pour vérifier qu'il passe**

Run :
```bash
npm test -- tests/unit/i18n.test.ts
```
Expected : PASS (6 tests verts).

- [ ] **Step 6 : Commit**

```bash
git add -A
git commit -m "feat: add bilingual i18n dictionary and helpers with tests" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4 : Schémas de contenu (TDD) + contenu seed

**Files:**
- Create: `src/content/schemas.ts`, `src/content/config.ts`
- Create (seed): `src/content/objects/la-lune.md`, `src/content/facts/andromede.md`, `src/content/glossary/magnitude.md`, `src/content/equipment/jumelles.md`
- Test: `tests/unit/schemas.test.ts`

- [ ] **Step 1 : Écrire `src/content/schemas.ts` (zod pur, testable hors Astro)**

```ts
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
```

> Note : `astro/zod` réexporte la même instance de zod qu'Astro utilise, ce qui évite les soucis de version entre `src/content/config.ts` et les tests.

- [ ] **Step 2 : Écrire le test qui échoue `tests/unit/schemas.test.ts`**

```ts
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
```

- [ ] **Step 3 : Lancer le test pour vérifier qu'il échoue**

Run :
```bash
npm test -- tests/unit/schemas.test.ts
```
Expected : FAIL — `src/content/schemas` n'existe pas (si Step 1 non encore enregistré) **ou**, une fois `schemas.ts` créé, les tests passent directement. Si Step 1 est déjà fait, exécuter quand même pour confirmer l'état vert ; sinon créer le fichier puis relancer.

> (Schémas = données pures : le « test qui échoue » sert surtout à figer le comportement attendu — types rejetés, défaut `featuredOnSkyMap`, bilingue obligatoire.)

- [ ] **Step 4 : Brancher les collections dans `src/content/config.ts`**

```ts
import { defineCollection } from 'astro:content';
import {
  objectSchema,
  equipmentSchema,
  factSchema,
  glossarySchema,
} from './schemas';

export const collections = {
  objects: defineCollection({ type: 'content', schema: objectSchema }),
  equipment: defineCollection({ type: 'content', schema: equipmentSchema }),
  facts: defineCollection({ type: 'content', schema: factSchema }),
  glossary: defineCollection({ type: 'content', schema: glossarySchema }),
};
```

- [ ] **Step 5 : Créer le contenu seed**

`src/content/objects/la-lune.md` :
```md
---
type: moon
title: { fr: "La Lune", en: "The Moon" }
summary:
  fr: "La Lune est le seul satellite naturel de la Terre, et l'astre le plus facile à observer : à l'œil nu, aux jumelles ou au télescope."
  en: "The Moon is Earth's only natural satellite, and the easiest target to observe — with the naked eye, binoculars or a telescope."
deepDive:
  fr: "Ses « mers » sombres sont d'anciennes coulées de lave. Le meilleur moment pour la photographier n'est pas la pleine Lune (trop éblouissante et plate) mais près du terminateur, où les cratères projettent de longues ombres."
  en: "Its dark 'seas' are ancient lava plains. The best time to photograph it is not the full Moon (too bright and flat) but near the terminator, where craters cast long shadows."
observingTips:
  fr: "Un téléobjectif de 200 mm suffit pour un premier gros plan. Baissez l'ISO et augmentez la vitesse : la Lune est très lumineuse."
  en: "A 200 mm telephoto lens is enough for a first close-up. Lower the ISO and raise the shutter speed: the Moon is very bright."
image: "/images/objects/moon.jpg"
imageCredit: "NASA / GSFC / Arizona State University"
featuredOnSkyMap: true
---
```

`src/content/facts/andromede.md` :
```md
---
text:
  fr: "La galaxie d'Andromède fonce vers la nôtre à 110 km/s : dans ~4,5 milliards d'années, elles fusionneront."
  en: "The Andromeda Galaxy is racing toward ours at 110 km/s: in ~4.5 billion years, they will merge."
source: "NASA"
relatedObject: "andromede"
---
```

`src/content/glossary/magnitude.md` :
```md
---
term: { fr: "Magnitude", en: "Magnitude" }
definition:
  fr: "Mesure de l'éclat d'un astre. Contre-intuitif : plus le nombre est petit (voire négatif), plus l'objet est brillant."
  en: "A measure of a celestial object's brightness. Counter-intuitively, the smaller the number (even negative), the brighter the object."
---
```

`src/content/equipment/jumelles.md` :
```md
---
category: binoculars
level: beginner
budgetEur: 80
title: { fr: "Des jumelles, pour commencer", en: "Binoculars, to start" }
body:
  fr: "Avant tout télescope, une paire de jumelles 10x50 révèle déjà les cratères de la Lune, les lunes de Jupiter et la Voie lactée. Le meilleur premier achat."
  en: "Before any telescope, a pair of 10x50 binoculars already reveals the Moon's craters, Jupiter's moons and the Milky Way. The best first purchase."
---
```

- [ ] **Step 6 : Créer le dossier d'images et un placeholder**

Run :
```bash
mkdir -p public/images/objects
```
Puis déposer une image **libre de droits** de la Lune dans `public/images/objects/moon.jpg` (source NASA, créditée dans le frontmatter ci-dessus). Si aucune image n'est disponible à cette étape, créer un fichier vide temporaire pour ne pas casser le build :
```bash
node -e "require('fs').writeFileSync('public/images/objects/moon.jpg','')"
```
Expected : le chemin `public/images/objects/moon.jpg` existe. *(Remplacer par une vraie image avant la mise en ligne — voir Task 10.)*

- [ ] **Step 7 : Vérifier le typage du contenu + relancer les tests**

Run :
```bash
npm run build
npm test -- tests/unit/schemas.test.ts
```
Expected : le build valide les collections sans erreur de schéma ; les 4 tests de schéma passent.

- [ ] **Step 8 : Commit**

```bash
git add -A
git commit -m "feat: add typed content collections, schemas and seed content" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5 : Librairie de phase de Lune (TDD)

**Files:**
- Create: `src/lib/astronomy.ts`
- Test: `tests/unit/astronomy.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue `tests/unit/astronomy.test.ts`**

Ancrage sur deux événements **documentés** de mars 2025 : éclipse **totale de Lune** du 13–14 mars (pleine Lune) et éclipse **partielle de Soleil** du 29 mars (nouvelle Lune).

```ts
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
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run :
```bash
npm test -- tests/unit/astronomy.test.ts
```
Expected : FAIL — `src/lib/astronomy` n'existe pas.

- [ ] **Step 3 : Écrire `src/lib/astronomy.ts`**

```ts
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
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

Run :
```bash
npm test -- tests/unit/astronomy.test.ts
```
Expected : PASS (4 tests verts). Si un seuil d'illumination échoue de peu, vérifier que `astronomy-engine` est bien à jour ; les angles/éphémérides sont déterministes.

- [ ] **Step 5 : Commit**

```bash
git add -A
git commit -m "feat: add client-side moon phase computation with tests" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6 : Îlot React « Phase de la Lune »

**Files:**
- Create: `src/components/MoonPhase.tsx`

- [ ] **Step 1 : Écrire `src/components/MoonPhase.tsx`**

L'îlot calcule la phase du **jour du visiteur** (côté client) et reçoit ses libellés traduits en props (les traductions restent centralisées dans `src/i18n/ui.ts`).

```tsx
import { useMemo } from 'react';
import { getMoonInfo, type PhaseKey } from '../lib/astronomy';

interface Props {
  title: string;
  illuminationLabel: string;
  phaseLabels: Record<PhaseKey, string>;
}

export default function MoonPhase({ title, illuminationLabel, phaseLabels }: Props) {
  const info = useMemo(() => getMoonInfo(new Date()), []);
  const pct = Math.round(info.illumination * 100);

  // Décalage du disque d'ombre pour suggérer la phase (0 = pleine ombre à gauche).
  // Approximation visuelle ; le rendu fin du terminateur viendra plus tard.
  const waxing = info.phaseAngle < 180;
  const offset = (info.illumination * 2 - 1) * 100 * (waxing ? 1 : -1);

  return (
    <figure className="flex flex-col items-center gap-4">
      <svg
        viewBox="0 0 200 200"
        width="180"
        height="180"
        role="img"
        aria-label={`${phaseLabels[info.phaseKey]} — ${pct}%`}
      >
        <defs>
          <clipPath id="moon-clip">
            <circle cx="100" cy="100" r="90" />
          </clipPath>
          <radialGradient id="moon-surface" cx="40%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#f4f1e8" />
            <stop offset="100%" stopColor="#c9c4b4" />
          </radialGradient>
        </defs>
        <g clipPath="url(#moon-clip)">
          <circle cx="100" cy="100" r="90" fill="url(#moon-surface)" />
          {/* Ombre de phase */}
          <circle cx={100 + offset} cy="100" r="90" fill="#05070d" opacity="0.92" />
        </g>
        <circle cx="100" cy="100" r="90" fill="none" stroke="#7fd8ff" strokeOpacity="0.25" />
      </svg>
      <figcaption className="text-center">
        <p className="font-display text-2xl text-starlight">{title}</p>
        <p className="mt-1 text-stellar">{phaseLabels[info.phaseKey]}</p>
        <p className="text-sm text-muted">
          {illuminationLabel} : {pct}%
        </p>
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 2 : Vérifier la compilation TypeScript**

Run :
```bash
npx astro check
```
Expected : aucune erreur de type sur `MoonPhase.tsx`. *(Si `astro check` signale des dépendances manquantes pour le check, c'est attendu et sans rapport ; cibler l'absence d'erreurs dans nos fichiers.)*

- [ ] **Step 3 : Commit**

```bash
git add -A
git commit -m "feat: add MoonPhase React island with SVG rendering" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7 : Layout de base + Header avec sélecteur de langue

**Files:**
- Create: `src/components/Layout.astro`, `src/components/Header.astro`

- [ ] **Step 1 : Écrire `src/components/Layout.astro`**

```astro
---
import '@fontsource-variable/inter';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '../styles/global.css';
import Header from './Header.astro';
import type { Lang } from '../i18n/ui';

interface Props {
  lang: Lang;
  title: string;
  description?: string;
}

const { lang, title, description } = Astro.props;
---

<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body class="min-h-screen bg-space text-starlight">
    <Header lang={lang} />
    <main>
      <slot />
    </main>
  </body>
</html>
```

- [ ] **Step 2 : Écrire `src/components/Header.astro`**

```astro
---
import { useTranslations, localizedPath } from '../i18n/utils';
import type { Lang } from '../i18n/ui';

interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const t = useTranslations(lang);
const pathname = Astro.url.pathname;

const otherLang: Lang = lang === 'fr' ? 'en' : 'fr';
const switchHref = localizedPath(pathname, otherLang);
const homeHref = lang === 'fr' ? '/' : '/en/';
---

<header class="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-sm">
  <a href={homeHref} class="font-display text-xl tracking-wide text-starlight">
    {t('site.name')}
  </a>
  <nav class="flex items-center gap-6 text-sm text-muted">
    <a href={homeHref} class="hover:text-stellar">{t('nav.home')}</a>
    <a
      href={switchHref}
      class="rounded border border-white/15 px-2 py-1 text-starlight hover:border-stellar hover:text-stellar"
      hreflang={otherLang}
    >
      {otherLang.toUpperCase()}
    </a>
  </nav>
</header>
```

> Les liens Carte / Atlas / Matériel / Glossaire seront ajoutés à la nav quand ces pages existeront (phases 3–4). On garde le header minimal et honnête pour la phase 1.

- [ ] **Step 3 : Ajouter un favicon SVG simple `public/favicon.svg`**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#05070d"/>
  <circle cx="16" cy="16" r="9" fill="#e8edf7"/>
  <circle cx="20" cy="13" r="9" fill="#05070d"/>
</svg>
```

- [ ] **Step 4 : Commit**

```bash
git add -A
git commit -m "feat: add base layout, header and language switcher" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8 : Page d'accueil — coquille du Voyage (FR + EN)

**Files:**
- Create: `src/components/sections/Liftoff.astro`, `src/components/sections/LunarSection.astro`, `src/components/HomeJourney.astro`
- Create: `src/pages/index.astro` (remplace le placeholder Astro), `src/pages/en/index.astro`

- [ ] **Step 1 : Écrire `src/components/sections/Liftoff.astro`**

```astro
---
import { useTranslations } from '../../i18n/utils';
import type { Lang } from '../../i18n/ui';

const { lang } = Astro.props as { lang: Lang };
const t = useTranslations(lang);
---

<section class="flex min-h-screen flex-col items-center justify-center px-6 text-center">
  <p class="mb-4 text-sm uppercase tracking-[0.3em] text-stellar">
    {t('station.liftoff.kicker')}
  </p>
  <h1 class="max-w-3xl text-5xl text-starlight md:text-7xl">
    {t('station.liftoff.title')}
  </h1>
  <p class="mt-6 max-w-xl text-lg text-muted">
    {t('station.liftoff.body')}
  </p>
</section>
```

- [ ] **Step 2 : Écrire `src/components/sections/LunarSection.astro`**

```astro
---
import { useTranslations } from '../../i18n/utils';
import type { Lang } from '../../i18n/ui';
import type { PhaseKey } from '../../lib/astronomy';
import MoonPhase from '../MoonPhase.tsx';

const { lang } = Astro.props as { lang: Lang };
const t = useTranslations(lang);

const phaseLabels: Record<PhaseKey, string> = {
  new: t('phase.new'),
  waxingCrescent: t('phase.waxingCrescent'),
  firstQuarter: t('phase.firstQuarter'),
  waxingGibbous: t('phase.waxingGibbous'),
  full: t('phase.full'),
  waningGibbous: t('phase.waningGibbous'),
  lastQuarter: t('phase.lastQuarter'),
  waningCrescent: t('phase.waningCrescent'),
};
---

<section class="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-24 text-center md:flex-row md:gap-20 md:text-left">
  <div class="max-w-md">
    <p class="mb-4 text-sm uppercase tracking-[0.3em] text-stellar">
      {t('station.moon.kicker')}
    </p>
    <h2 class="text-4xl text-starlight md:text-5xl">{t('station.moon.title')}</h2>
    <p class="mt-6 text-lg text-muted">{t('station.moon.body')}</p>
  </div>
  <MoonPhase
    client:load
    title={t('moon.title')}
    illuminationLabel={t('moon.illumination')}
    phaseLabels={phaseLabels}
  />
</section>
```

- [ ] **Step 3 : Écrire `src/components/HomeJourney.astro` (composition DRY)**

```astro
---
import Layout from './Layout.astro';
import Liftoff from './sections/Liftoff.astro';
import LunarSection from './sections/LunarSection.astro';
import { useTranslations } from '../i18n/utils';
import type { Lang } from '../i18n/ui';

const { lang } = Astro.props as { lang: Lang };
const t = useTranslations(lang);
---

<Layout lang={lang} title={`${t('site.name')} — ${t('nav.home')}`}>
  <Liftoff lang={lang} />
  <LunarSection lang={lang} />
</Layout>
```

- [ ] **Step 4 : Écrire les pages `src/pages/index.astro` et `src/pages/en/index.astro`**

`src/pages/index.astro` :
```astro
---
import HomeJourney from '../components/HomeJourney.astro';
---
<HomeJourney lang="fr" />
```

`src/pages/en/index.astro` :
```astro
---
import HomeJourney from '../../components/HomeJourney.astro';
---
<HomeJourney lang="en" />
```

- [ ] **Step 5 : Vérifier visuellement dans le navigateur**

Run :
```bash
npm run dev
```
Then : ouvrir `http://localhost:4321/` (FR) puis `http://localhost:4321/en/` (EN).
Expected :
- fond espace profond, titres en serif ;
- station « Décollage » plein écran ;
- section Lune avec le **disque de Lune SVG** et le pourcentage d'illumination du jour ;
- le bouton **FR/EN** du header bascule la langue en conservant la page.
Arrêter le serveur.

- [ ] **Step 6 : Commit**

```bash
git add -A
git commit -m "feat: add bilingual home journey with liftoff and lunar sections" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9 : Test e2e fumée (Playwright)

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`

- [ ] **Step 1 : Installer les navigateurs Playwright**

Run :
```bash
npx playwright install chromium
```
Expected : Chromium téléchargé pour Playwright.

- [ ] **Step 2 : Écrire `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 3 : Écrire le test fumée `tests/e2e/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('French home shows the liftoff station and the moon widget', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Levez les yeux' })).toBeVisible();
  await expect(page.getByText('Phase de la Lune')).toBeVisible();
});

test('language switch navigates to the English home', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'EN' }).click();
  await expect(page).toHaveURL(/\/en\/?$/);
  await expect(page.getByRole('heading', { name: 'Look up' })).toBeVisible();
});
```

- [ ] **Step 4 : Lancer le test e2e**

Run :
```bash
npm run test:e2e
```
Expected : PASS (2 tests). Playwright démarre le serveur de dev, charge les pages, vérifie le contenu FR/EN.

- [ ] **Step 5 : Commit**

```bash
git add -A
git commit -m "test: add Playwright smoke tests for home and language switch" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10 : Build de production + déploiement Cloudflare Pages

**Files:**
- Create: `DEPLOY.md`

- [ ] **Step 1 : Vérifier le build de production complet**

Run :
```bash
npm run build
```
Expected : `npm run build` réussit, génère `dist/` avec `index.html` (FR) et `en/index.html` (EN). Aucune erreur de schéma de contenu ni de type.

- [ ] **Step 2 : Vérifier l'aperçu de production**

Run :
```bash
npm run preview
```
Then : ouvrir l'URL affichée et confirmer que le site statique fonctionne (FR, EN, widget Lune). Arrêter le serveur.

- [ ] **Step 3 : Lancer la suite de tests complète**

Run :
```bash
npm test
```
Expected : tous les tests unitaires (i18n, schémas, astronomie) passent.

- [ ] **Step 4 : Écrire `DEPLOY.md`**

````md
# Déploiement — Cloudflare Pages

Le site est **statique** (`output: 'static'`, build dans `dist/`).

## Pré-requis
- Le dépôt poussé sur GitHub (public ou privé).
- Un compte Cloudflare (gratuit).

## Étapes (interface Cloudflare Pages)
1. Pousser le dépôt sur GitHub :
   ```bash
   git remote add origin https://github.com/<ton-compte>/nocturne.git
   git push -u origin main
   ```
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Sélectionner le dépôt `nocturne`.
4. Réglages de build :
   - **Framework preset :** Astro
   - **Build command :** `npm run build`
   - **Build output directory :** `dist`
5. **Save and Deploy**. Le site sera publié sur `https://nocturne.pages.dev`
   (ou un sous-domaine voisin si `nocturne` est pris :
   `nocturne-astro.pages.dev` / `astre-nocturne.pages.dev`).

## Domaine personnalisé (gratuit, plus tard)
Via le **GitHub Student Developer Pack** (Antoine est étudiant à l'ESIEA) :
réclamer un domaine gratuit 1 an (ex. `.me` chez Namecheap), puis dans
Cloudflare Pages → **Custom domains** → ajouter le domaine et suivre les
instructions DNS. Aucune modification du code n'est nécessaire.

## Avant la première mise en ligne
- Remplacer `public/images/objects/moon.jpg` par une **vraie image libre de
  droits** (NASA), créditée (déjà renseigné dans le frontmatter).
````

- [ ] **Step 5 : Commit**

```bash
git add -A
git commit -m "docs: add Cloudflare Pages deployment guide" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Definition of Done (phase 1)

- `npm test` vert (i18n, schémas, astronomie) ; `npm run test:e2e` vert (fumée FR/EN).
- `npm run build` produit un `dist/` statique avec pages FR (`/`) et EN (`/en/`).
- Page d'accueil : station « Décollage » + section Lune avec **phase réelle du jour** ; bascule de langue fonctionnelle.
- `DEPLOY.md` documente la mise en ligne Cloudflare Pages.
- Design tokens espace profond + polices serif/sans en place.
- Architecture prête pour les phases suivantes (Voyage GSAP, Carte du ciel, Atlas).

---

## Roadmap des phases suivantes (plans à écrire le moment venu)

- **Phase 2 — Le Voyage :** GSAP + ScrollTrigger ; stations 2→5 (Système solaire, Étoiles & constellations, Nébuleuses, Galaxies) ; champs d'étoiles parallax ; encarts « Le saviez-vous ? » ; fallback reduced-motion soigné.
- **Phase 3 — La Carte du ciel :** chargement d'un catalogue d'étoiles brillantes (licence à vérifier) + lignes de constellations dorées ; rendu Canvas 2D ; pan/zoom ; objets cliquables → fiches ; alternative clavier.
- **Phase 4 — Atlas & modules :** pages `atlas/[slug]` (lecture en couches) ; Le Coin Matériel ; collection de facts ; glossaire ; enrichissement du contenu bilingue.
- **Phase 5 — Finitions :** SEO + Open Graph (cartes de partage), sitemap, hreflang ; passes d'accessibilité ; perf (Lighthouse 90+) ; couture `getTonightData()` pour les futures APIs temps réel (ISS, météo du ciel).
