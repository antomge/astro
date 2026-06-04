# Nocturne — Phase 2 : « Le Voyage » (scrollytelling cosmic-zoom) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer la page d'accueil statique en un voyage immersif en scrollytelling « cosmic zoom » à 6 stations (Décollage → Lune → Système solaire → Étoiles & constellations → Nébuleuses → Galaxies), avec un champ d'étoiles procédural en parallax, une image héros NASA par station, des encarts « Le saviez-vous ? », et un fallback `prefers-reduced-motion` solide.

**Architecture :** Le contenu narratif des stations vit dans un module de données typé bilingue (`src/data/journey.ts`). Un îlot React Canvas (`Starfield.tsx`) dessine un champ d'étoiles en parallax derrière tout le voyage. Un composant `Station.astro` réutilisable rend chaque section plein écran (fond procédural + photo héros optionnelle + contenu + encart fact + widget Lune sur la station 1). Un script client GSAP (`src/scripts/journey.ts`) ajoute l'effet cosmic-zoom (sections épinglées + scrub) et une barre de progression, **désactivé sous `prefers-reduced-motion`** (les stations s'empilent alors normalement, toutes visibles). Les photos héros sont récupérées via l'API NASA Images (domaine public) avec **dégradation gracieuse** vers le fond procédural si absentes.

**Tech Stack :** Astro 6 · TypeScript · Tailwind v4 · React 19 (îlots) · GSAP + ScrollTrigger · Canvas 2D · `astronomy-engine` (widget Lune existant) · Vitest · Playwright.

**Référence :** spec `docs/superpowers/specs/2026-06-04-nocturne-astronomy-site-design.md` (§4.1 Le Voyage). S'appuie sur la Phase 1 (déjà mergée sur `main`).

> **Convention de commit :** chaque message se termine par `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` (via un second `-m`).
>
> **Quirk environnement :** `npm`/`npx`/`node` ne sont disponibles que via l'outil **PowerShell**, après rafraîchissement du PATH :
> `$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')`
> L'outil Bash n'a pas npm. git fonctionne dans les deux.

---

## Décisions de design (validées avec l'utilisateur)
- **Visuels : hybride (C)** — fond procédural vivant partout + une photo NASA héros par station.
- **Animation : « cosmic zoom »** — sections épinglées, transitions liées au scroll (scrub), parallax.

## Structure des fichiers

```
src/
  data/journey.ts             # NEW — stations typées bilingues (source unique du contenu du Voyage)
  lib/starfield.ts            # NEW — génération déterministe d'étoiles (logique pure, testée)
  components/
    Starfield.tsx             # NEW — îlot React Canvas, champ d'étoiles parallax (fixe, derrière tout)
    Station.astro             # NEW — section plein écran réutilisable (fond + héros + contenu + fact + widget)
    HomeJourney.astro         # MODIFY — rend Starfield + stations depuis journey.ts + script GSAP
    sections/Liftoff.astro    # DELETE (remplacé par Station.astro)
    sections/LunarSection.astro # DELETE (remplacé par Station.astro + widget:'moon')
  scripts/journey.ts          # NEW — orchestration GSAP ScrollTrigger (cosmic zoom + progress), guardée reduced-motion
  i18n/ui.ts                  # MODIFY — retrait des clés station.* (le contenu passe dans journey.ts) ; garde nav.*, site.name, moon.*, phase.*
scripts/fetch-heroes.mjs      # NEW — télécharge les photos héros via l'API NASA Images (one-shot, gracieux)
public/images/stations/       # NEW — photos héros téléchargées (git-ignorées si volumineuses ? -> voir Task 7)
tests/
  unit/journey.test.ts        # NEW — validité bilingue + ordres des stations
  unit/starfield.test.ts      # NEW — génération déterministe & bornes
  e2e/voyage.spec.ts          # NEW — 6 stations présentes ; fallback reduced-motion
  e2e/smoke.spec.ts           # MODIFY si nécessaire (les titres station 0/1 sont préservés)
```

---

## Task 1 : Module de données du Voyage (TDD)

**Files:**
- Create: `src/data/journey.ts`
- Test: `tests/unit/journey.test.ts`

- [ ] **Step 1: Write `src/data/journey.ts`** with EXACTLY:
```ts
import type { Lang } from '../i18n/ui';

export interface Localized {
  fr: string;
  en: string;
}

export interface Station {
  /** slug stable, sert d'ancre et de data-attribute */
  id: string;
  /** 0..5, ordre dans le voyage */
  order: number;
  kicker: Localized;
  title: Localized;
  body: Localized;
  /** dégradé procédural [haut, bas] (toujours présent : fond garanti) */
  gradient: [string, string];
  /** nom de fichier dans /images/stations/ (photo héros optionnelle) */
  hero?: string;
  heroCredit?: string;
  /** encart « Le saviez-vous ? » */
  fact?: Localized;
  /** contenu interactif spécial ; seule la Lune l'utilise pour l'instant */
  widget?: 'moon';
}

export function localize(value: Localized, lang: Lang): string {
  return value[lang];
}

export const stations: Station[] = [
  {
    id: 'liftoff',
    order: 0,
    kicker: { fr: 'Station 0 — Décollage', en: 'Station 0 — Lift-off' },
    title: { fr: 'Levez les yeux', en: 'Look up' },
    body: {
      fr: "Au-dessus des lumières de la ville, un océan d'étoiles attend. Faites défiler pour décoller.",
      en: 'Above the city lights, an ocean of stars is waiting. Scroll to lift off.',
    },
    gradient: ['#05070d', '#0a0e1a'],
    fact: {
      fr: "Loin des villes, l'œil humain peut percevoir près de 3 000 étoiles à la fois.",
      en: 'Far from cities, the human eye can perceive nearly 3,000 stars at once.',
    },
  },
  {
    id: 'moon',
    order: 1,
    kicker: { fr: 'Station 1 — La Lune', en: 'Station 1 — The Moon' },
    title: { fr: 'Notre voisine', en: 'Our neighbour' },
    body: {
      fr: "La Lune change de visage chaque nuit. Voici sa phase, telle qu'elle apparaît aujourd'hui.",
      en: 'The Moon changes face every night. Here is its phase, as it appears today.',
    },
    gradient: ['#0a0e1a', '#10131f'],
    hero: 'moon.jpg',
    heroCredit: 'NASA',
    widget: 'moon',
    fact: {
      fr: 'La Lune s’éloigne de la Terre d’environ 3,8 cm par an.',
      en: 'The Moon drifts away from Earth by about 3.8 cm per year.',
    },
  },
  {
    id: 'solar-system',
    order: 2,
    kicker: { fr: 'Station 2 — Le Système solaire', en: 'Station 2 — The Solar System' },
    title: { fr: 'Les mondes errants', en: 'The wandering worlds' },
    body: {
      fr: "Jupiter et Saturne sont visibles à l'œil nu et spectaculaires aux jumelles : on devine les anneaux et les lunes galiléennes.",
      en: 'Jupiter and Saturn are visible to the naked eye and spectacular through binoculars: you can make out the rings and the Galilean moons.',
    },
    gradient: ['#10131f', '#1a1320'],
    hero: 'jupiter.jpg',
    heroCredit: 'NASA',
    fact: {
      fr: 'Une tempête fait rage sur Jupiter depuis au moins 350 ans : la Grande Tache rouge.',
      en: 'A storm has raged on Jupiter for at least 350 years: the Great Red Spot.',
    },
  },
  {
    id: 'stars',
    order: 3,
    kicker: { fr: 'Station 3 — Étoiles & constellations', en: 'Station 3 — Stars & constellations' },
    title: { fr: 'Se repérer dans la nuit', en: 'Finding your way in the night' },
    body: {
      fr: "Les constellations sont des repères tracés par l'humanité. En suivant la Grande Ourse, on retrouve l'étoile Polaire — et le nord.",
      en: 'Constellations are landmarks drawn by humankind. Following the Big Dipper leads to Polaris — and to true north.',
    },
    gradient: ['#1a1320', '#0d1622'],
    hero: 'milky-way.jpg',
    heroCredit: 'NASA',
    fact: {
      fr: 'La lumière de l’étoile Polaire que vous voyez ce soir est partie il y a environ 430 ans.',
      en: 'The light from Polaris you see tonight left the star about 430 years ago.',
    },
  },
  {
    id: 'nebulae',
    order: 4,
    kicker: { fr: 'Station 4 — Les Nébuleuses', en: 'Station 4 — Nebulae' },
    title: { fr: "Les pouponnières d'étoiles", en: 'Stellar nurseries' },
    body: {
      fr: "La nébuleuse d'Orion est un immense nuage de gaz où naissent des étoiles. Ses couleurs viennent de l'hydrogène et de l'oxygène ionisés.",
      en: 'The Orion Nebula is a vast cloud of gas where stars are born. Its colours come from ionised hydrogen and oxygen.',
    },
    gradient: ['#0d1622', '#181024'],
    hero: 'orion.jpg',
    heroCredit: 'NASA',
    fact: {
      fr: 'La nébuleuse d’Orion est visible à l’œil nu : c’est la « tache » floue sous les trois étoiles du baudrier.',
      en: 'The Orion Nebula is visible to the naked eye: the fuzzy "patch" below the three belt stars.',
    },
  },
  {
    id: 'galaxies',
    order: 5,
    kicker: { fr: 'Station 5 — Galaxies & ciel profond', en: 'Station 5 — Galaxies & deep sky' },
    title: { fr: 'Le vertige du cosmos', en: 'The vertigo of the cosmos' },
    body: {
      fr: "La galaxie d'Andromède, à 2,5 millions d'années-lumière, est l'objet le plus lointain visible à l'œil nu. Vous regardez le passé profond.",
      en: 'The Andromeda Galaxy, 2.5 million light-years away, is the most distant object visible to the naked eye. You are looking deep into the past.',
    },
    gradient: ['#181024', '#05070d'],
    hero: 'andromeda.jpg',
    heroCredit: 'NASA',
    fact: {
      fr: 'Andromède contient environ mille milliards d’étoiles — quatre fois plus que notre Voie lactée.',
      en: 'Andromeda holds about a trillion stars — four times more than our Milky Way.',
    },
  },
];
```

- [ ] **Step 2: Write the FAILING test `tests/unit/journey.test.ts`** with EXACTLY:
```ts
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
```

- [ ] **Step 3: Run the test** (PowerShell, PATH refreshed): `npm test -- tests/unit/journey.test.ts`
  Expected: PASS (5 tests). If `src/data/journey.ts` already exists, they pass immediately; if any assertion fails, fix the data until green.

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "feat: add typed bilingual journey station data" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 1)
- ONLY create the two files. Do NOT yet touch `ui.ts`, components, or pages (later tasks). The station 0/1 titles ("Levez les yeux"/"Look up", "Notre voisine"/"Our neighbour") MUST stay exactly as written — Phase-1 Playwright tests assert them.
- Files end with trailing newlines. After commit: `git status` clean, `git rev-parse HEAD`/`HEAD~1`.

---

## Task 2 : Logique du champ d'étoiles (TDD)

**Files:**
- Create: `src/lib/starfield.ts`
- Test: `tests/unit/starfield.test.ts`

- [ ] **Step 1: Write the FAILING test `tests/unit/starfield.test.ts`** with EXACTLY:
```ts
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
```

- [ ] **Step 2: Run the test, verify it FAILS:** `npm test -- tests/unit/starfield.test.ts`
  Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/lib/starfield.ts`** with EXACTLY:
```ts
export interface Star {
  /** position normalisée 0..1 */
  x: number;
  y: number;
  /** rayon en pixels (à l'échelle 1x) */
  r: number;
  /** profondeur de couche 1..layers (plus grand = plus proche = plus de parallax) */
  depth: number;
  /** opacité de base 0..1 */
  alpha: number;
}

/** PRNG déterministe (mulberry32) */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateStars(count: number, seed = 1, layers = 3): Star[] {
  const rand = mulberry32(seed);
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const depth = 1 + Math.floor(rand() * layers); // 1..layers
    const near = depth === layers;
    stars.push({
      x: rand(),
      y: rand(),
      r: 0.4 + rand() * (near ? 1.6 : 0.8),
      depth,
      alpha: 0.3 + rand() * 0.7,
    });
  }
  return stars;
}
```

- [ ] **Step 4: Run the test, verify it PASSES:** `npm test -- tests/unit/starfield.test.ts`
  Expected: PASS (4 tests).

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: add deterministic starfield generation with tests" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 2)
- ONLY the two files. Keep exported names `Star`, `generateStars` exactly (Task 3 imports them). Trailing newlines. Clean tree after commit.

---

## Task 3 : Îlot Canvas du champ d'étoiles

**Files:**
- Create: `src/components/Starfield.tsx`

- [ ] **Step 1: Write `src/components/Starfield.tsx`** with EXACTLY:
```tsx
import { useEffect, useRef } from 'react';
import { generateStars, type Star } from '../lib/starfield';

interface Props {
  /** nombre d'étoiles (défaut 240) */
  count?: number;
  seed?: number;
}

const LAYERS = 3;

export default function Starfield({ count = 240, seed = 7 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stars: Star[] = generateStars(count, seed, LAYERS);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      // décalage parallax basé sur le scroll : couches proches bougent plus
      const scrollY = reduce ? 0 : window.scrollY;
      for (const s of stars) {
        const parallax = (s.depth / LAYERS) * 0.15;
        const y = (s.y * height - scrollY * parallax) % height;
        const yy = y < 0 ? y + height : y;
        ctx.globalAlpha = s.alpha;
        ctx.beginPath();
        ctx.arc(s.x * width, yy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = '#e8edf7';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const onScrollOrResize = () => {
      if (reduce) {
        draw();
        return;
      }
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', () => {
      resize();
      onScrollOrResize();
    });
    if (!reduce) window.addEventListener('scroll', onScrollOrResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScrollOrResize);
    };
  }, [count, seed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
```

- [ ] **Step 2: Verify types:** PowerShell (PATH refreshed) `npx astro check`
  Expected: 0 errors attributable to `Starfield.tsx` (component is type-checked even if not yet mounted). Report the final counts.

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat: add parallax starfield canvas island" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 3)
- ONLY `Starfield.tsx`. Default export `Starfield`. The canvas is `fixed inset-0 -z-10` (behind content) and `aria-hidden`. Respect `prefers-reduced-motion` (no scroll listener, single static draw). Trailing newline. Clean tree.

---

## Task 4 : Composant `Station.astro`

**Files:**
- Create: `src/components/Station.astro`

- [ ] **Step 1: Write `src/components/Station.astro`** with EXACTLY:
```astro
---
import { useTranslations } from '../i18n/utils';
import { localize, type Station } from '../data/journey';
import type { Lang } from '../i18n/ui';
import type { PhaseKey } from '../lib/astronomy';
import MoonPhase from './MoonPhase.tsx';

interface Props {
  station: Station;
  lang: Lang;
}

const { station, lang } = Astro.props;
const t = useTranslations(lang);

const isFirst = station.order === 0;
const heroSrc = station.hero ? `/images/stations/${station.hero}` : undefined;

// Libellés du widget Lune (uniquement si la station l'utilise)
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

<section
  data-station={station.id}
  id={station.id}
  class="station relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24"
>
  <!-- Fond procédural (toujours présent) + photo héros optionnelle par-dessus -->
  <div
    data-anim="bg"
    class="absolute inset-0 -z-[1]"
    style={`background: linear-gradient(to bottom, ${station.gradient[0]}, ${station.gradient[1]});`}
  >
    {heroSrc && (
      <img
        src={heroSrc}
        alt=""
        aria-hidden="true"
        loading="lazy"
        class="h-full w-full object-cover opacity-40 mix-blend-screen"
      />
    )}
  </div>

  <div data-anim="content" class="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
    <div class="max-w-xl">
      <p class="mb-4 text-sm uppercase tracking-[0.3em] text-stellar">
        {localize(station.kicker, lang)}
      </p>
      {isFirst ? (
        <h1 class="text-5xl text-starlight md:text-7xl">{localize(station.title, lang)}</h1>
      ) : (
        <h2 class="text-4xl text-starlight md:text-5xl">{localize(station.title, lang)}</h2>
      )}
      <p class="mt-6 text-lg text-muted">{localize(station.body, lang)}</p>

      {station.fact && (
        <aside class="mt-8 border-l-2 border-ember/60 pl-4 text-left">
          <p class="text-xs uppercase tracking-widest text-ember">{lang === 'fr' ? 'Le saviez-vous ?' : 'Did you know?'}</p>
          <p class="mt-1 text-sm text-starlight/90">{localize(station.fact, lang)}</p>
        </aside>
      )}
    </div>

    {station.widget === 'moon' && (
      <MoonPhase
        client:load
        title={t('moon.title')}
        illuminationLabel={t('moon.illumination')}
        phaseLabels={phaseLabels}
      />
    )}
  </div>

  {station.heroCredit && (
    <p class="absolute bottom-3 right-4 text-[10px] text-muted/60">© {station.heroCredit}</p>
  )}
</section>
```

- [ ] **Step 2: Verify types:** `npx astro check`
  Expected: 0 errors attributable to `Station.astro`. (It imports `MoonPhase`, `journey`, `astronomy` types — all exist.) Report counts.

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat: add reusable Station section component" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 4)
- ONLY `Station.astro`. Use the existing `MoonPhase` island unchanged (props `title`, `illuminationLabel`, `phaseLabels`). The `data-station`, `data-anim="bg"`, `data-anim="content"` attributes are REQUIRED — Task 6's GSAP script targets them; keep them exactly. The procedural gradient must render even when `hero` is absent (graceful degradation). Trailing newline. Clean tree.

---

## Task 5 : Recâbler la page d'accueil sur le Voyage

**Files:**
- Modify: `src/components/HomeJourney.astro`
- Modify: `src/i18n/ui.ts` (retrait des clés `station.*`)
- Delete: `src/components/sections/Liftoff.astro`, `src/components/sections/LunarSection.astro`

- [ ] **Step 1: Replace `src/components/HomeJourney.astro`** with EXACTLY:
```astro
---
import Layout from './Layout.astro';
import Starfield from './Starfield.tsx';
import Station from './Station.astro';
import { stations } from '../data/journey';
import { useTranslations } from '../i18n/utils';
import type { Lang } from '../i18n/ui';

const { lang } = Astro.props as { lang: Lang };
const t = useTranslations(lang);
const ordered = [...stations].sort((a, b) => a.order - b.order);
---

<Layout lang={lang} title={`${t('site.name')} — ${t('nav.home')}`}>
  <Starfield client:idle />

  <!-- Barre de progression du voyage -->
  <div class="fixed left-0 top-0 z-40 h-0.5 w-full bg-transparent">
    <div data-progress class="h-full origin-left scale-x-0 bg-stellar"></div>
  </div>

  <div class="journey">
    {ordered.map((station) => <Station station={station} lang={lang} />)}
  </div>
</Layout>

<script>
  import '../scripts/journey';
</script>
```

- [ ] **Step 2: Delete the now-unused section components**
  PowerShell: `Remove-Item src/components/sections/Liftoff.astro, src/components/sections/LunarSection.astro`
  (The `src/components/sections/` folder may be left empty or removed — either is fine.)

- [ ] **Step 3: Remove the superseded `station.*` keys from `src/i18n/ui.ts`**
  In BOTH the `fr` and `en` blocks, delete these six keys (they now live in `journey.ts`):
  `station.liftoff.kicker`, `station.liftoff.title`, `station.liftoff.body`, `station.moon.kicker`, `station.moon.title`, `station.moon.body`.
  KEEP everything else (`site.name`, `nav.*`, `moon.title`, `moon.illumination`, `phase.*`). After editing, the `fr` and `en` blocks must still have identical key sets.

- [ ] **Step 4: Verify build + types + unit tests** (PowerShell, PATH refreshed):
  - `npx astro check` → 0 errors (no dangling `t('station.*')` references; Liftoff/LunarSection are gone).
  - `npm run build` → success; `dist/index.html` (FR) + `dist/en/index.html` (EN) contain all 6 station kickers.
  - `npm test` → all unit tests pass (i18n, schemas, astronomy, journey, starfield).
  Confirm `dist/index.html` contains "Station 5" and `dist/en/index.html` contains "Station 5 —" (proves all stations render server-side).

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: render the full 6-station journey from data" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 5)
- The GSAP `<script>` import is intentional — Astro bundles it (the file is created in Task 6; until then the import will fail the build, SO do Task 6's file first OR temporarily comment the script import and uncomment in Task 6). To keep this task's build green, create a minimal placeholder `src/scripts/journey.ts` containing `export {};` now and flesh it out in Task 6. (Document which you did.)
- Do NOT remove `moon.*`/`phase.*` keys. Keep station 0/1 titles intact (already in journey.ts). Clean tree after commit.

---

## Task 6 : Orchestration GSAP « cosmic zoom » + progression

**Files:**
- Create/replace: `src/scripts/journey.ts`

- [ ] **Step 1: Write `src/scripts/journey.ts`** with EXACTLY:
```ts
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initJourney() {
  if (reduce) return; // fallback : stations empilées, toutes visibles, aucune animation

  const sections = gsap.utils.toArray<HTMLElement>('[data-station]');

  sections.forEach((section, i) => {
    const bg = section.querySelector('[data-anim="bg"]');
    const content = section.querySelector('[data-anim="content"]');

    // Cosmic zoom : le fond se rapproche pendant qu'on traverse la station (scrub + pin)
    if (bg) {
      gsap.fromTo(
        bg,
        { scale: 1.18 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
    }

    // Révélation du contenu à l'entrée (one-shot, pour qu'il reste lisible)
    if (content && i > 0) {
      gsap.from(content, {
        autoAlpha: 0,
        y: 48,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 65%' },
      });
    }
  });

  // Barre de progression globale
  gsap.to('[data-progress]', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    },
  });
}

if (document.readyState !== 'loading') initJourney();
else document.addEventListener('DOMContentLoaded', initJourney);
```

> NOTE (visual tuning, not a placeholder): the `scale`, `start/end`, and `duration` values above are a working, runnable starting point for the cosmic-zoom feel. The implementer MAY adjust these numeric values during visual verification — but must keep: the reduced-motion early-return, the `[data-anim]`/`[data-progress]`/`[data-station]` selectors, and the one-shot (non-scrub) content reveal for stations after the first (so content never gets stuck invisible).

- [ ] **Step 2: Verify build + a quick visual pass** (PowerShell, PATH refreshed):
  - `npx astro check` → 0 errors.
  - `npm run build` → success.
  - Start `npm run dev`, open `http://localhost:4321/`, scroll through all 6 stations: confirm (a) the starfield drifts with parallax, (b) backgrounds gently zoom, (c) each station's content is readable (never stuck hidden), (d) the top progress bar fills as you scroll. Then STOP the server.
  Report what you observed. If content gets stuck invisible or a station is unreachable, FIX the GSAP values (do not leave a broken scroll).

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat: add GSAP cosmic-zoom scroll choreography and progress bar" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 6)
- ONLY `src/scripts/journey.ts`. No new dependencies (gsap is installed). The reduced-motion early-return is mandatory. Do NOT pin in a way that can hide content or trap scroll; the provided non-pinned scrub+reveal approach is intentionally robust. Clean tree after commit.

---

## Task 7 : Photos héros NASA (API NASA Images, gracieux)

**Files:**
- Create: `scripts/fetch-heroes.mjs`
- Modify: `.gitignore` (decision below)
- Add (runtime artifacts): `public/images/stations/*.jpg`

- [ ] **Step 1: Write `scripts/fetch-heroes.mjs`** with EXACTLY:
```js
// One-shot downloader for public-domain hero images via the NASA Images API.
// Run: node scripts/fetch-heroes.mjs   (network required; degrades gracefully)
import { mkdir, writeFile } from 'node:fs/promises';

const OUT = 'public/images/stations';

// fichier -> requête de recherche NASA
const SUBJECTS = {
  'moon.jpg': 'full moon',
  'jupiter.jpg': 'Jupiter planet',
  'milky-way.jpg': 'Milky Way',
  'orion.jpg': 'Orion Nebula',
  'andromeda.jpg': 'Andromeda Galaxy',
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchOne(file, query) {
  const search = await fetchJson(
    `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`,
  );
  const item = search.collection.items?.[0];
  if (!item) throw new Error('no search result');
  const nasaId = item.data?.[0]?.nasa_id;
  const assets = await fetchJson(
    `https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`,
  );
  const hrefs = (assets.collection.items || []).map((i) => i.href);
  const jpg =
    hrefs.find((h) => /~medium\.jpg$/i.test(h)) ||
    hrefs.find((h) => /~small\.jpg$/i.test(h)) ||
    hrefs.find((h) => /\.jpg$/i.test(h));
  if (!jpg) throw new Error('no jpg asset');
  const res = await fetch(jpg);
  if (!res.ok) throw new Error(`HTTP ${res.status} for asset`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 5000) throw new Error('asset too small / not a real image');
  await writeFile(`${OUT}/${file}`, buf);
  return { file, nasaId, bytes: buf.byteLength };
}

const results = [];
await mkdir(OUT, { recursive: true });
for (const [file, query] of Object.entries(SUBJECTS)) {
  try {
    const r = await fetchOne(file, query);
    console.log(`OK   ${file}  (${r.bytes} bytes, nasa_id=${r.nasaId})`);
    results.push(r);
  } catch (err) {
    console.warn(`SKIP ${file}: ${err.message} — station will use procedural background`);
  }
}
console.log(`\nDownloaded ${results.length}/${Object.keys(SUBJECTS).length} hero images.`);
```

- [ ] **Step 2: Decide image tracking in `.gitignore`**
  Hero photos are downloadable artifacts, not source. To keep the repo light and the build reproducible from the script, ADD to `.gitignore` (append, don't clobber):
  ```
  # Downloaded hero images (regenerate via: node scripts/fetch-heroes.mjs)
  public/images/stations/
  ```
  (Cloudflare Pages build will run `node scripts/fetch-heroes.mjs` before `npm run build` — see Step 5. The procedural gradients guarantee the site looks right even if a download fails.)

- [ ] **Step 3: Run the downloader** (PowerShell, PATH refreshed): `node scripts/fetch-heroes.mjs`
  Expected: it reports `OK`/`SKIP` per subject and a final count. Network access required. If ALL downloads fail (e.g., no network in this environment), that is acceptable — the journey still renders procedurally; note it in your report and continue. Do NOT hardcode fragile fixed URLs as a workaround.

- [ ] **Step 4: Verify graceful behavior** (PowerShell):
  - `npm run build` → success regardless of how many heroes downloaded.
  - If at least one image downloaded, confirm `dist/` references `/images/stations/<file>`; if none, confirm the build still succeeds and stations show gradients.

- [ ] **Step 5: Wire the fetch into the build for deployment**
  In `package.json` `"scripts"`, add a `prebuild` hook so Cloudflare regenerates images on deploy:
  ```json
  "prebuild": "node scripts/fetch-heroes.mjs || exit 0"
  ```
  (The `|| exit 0` makes a failed/again-offline fetch non-fatal — the build proceeds with procedural backgrounds.)
  Re-run `npm run build` once to confirm the `prebuild` hook runs and the build still succeeds.

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat: fetch public-domain NASA hero images with graceful fallback" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 7)
- Commit the SCRIPT and the `.gitignore`/`package.json` changes, NOT the downloaded `.jpg` files (they're git-ignored). Confirm `git status` shows no `public/images/stations/*.jpg` staged.
- Image credits are recorded in `journey.ts` (`heroCredit: 'NASA'`) and shown by `Station.astro`. NASA Images API content is public domain.
- Clean tree after commit (ignoring the untracked downloaded images).

---

## Task 8 : Reduced-motion & tests e2e du Voyage

**Files:**
- Create: `tests/e2e/voyage.spec.ts`
- Verify (no change expected): `tests/e2e/smoke.spec.ts` still passes

- [ ] **Step 1: Write `tests/e2e/voyage.spec.ts`** with EXACTLY:
```ts
import { test, expect } from '@playwright/test';

test('all six station kickers are present on the French journey', async ({ page }) => {
  await page.goto('/');
  for (const n of [0, 1, 2, 3, 4, 5]) {
    await expect(page.getByText(`Station ${n}`, { exact: false }).first()).toBeVisible();
  }
});

test('reduced-motion shows every station statically (no stuck content)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  // Le contenu doit être lisible sans animation : les 6 kickers visibles.
  for (const n of [0, 1, 2, 3, 4, 5]) {
    await expect(page.getByText(`Station ${n}`, { exact: false }).first()).toBeVisible();
  }
  // La dernière station est atteignable et son titre est rendu.
  await expect(page.getByRole('heading', { name: 'Le vertige du cosmos' })).toBeVisible();
});

test('English journey renders the deep-sky station', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.getByRole('heading', { name: 'The vertigo of the cosmos' })).toBeVisible();
});
```

- [ ] **Step 2: Run the e2e suite** (PowerShell, PATH refreshed): `npm run test:e2e`
  Expected: all tests pass — the new `voyage.spec.ts` (3 tests) AND the existing `smoke.spec.ts` (2 tests). The smoke tests still pass because station 0/1 titles ("Levez les yeux", "Look up") and the moon widget are preserved.
  If `getByText('Station n')` is ambiguous because a kicker text matches multiple nodes, the `.first()` already handles it. If reduced-motion content is NOT visible, the GSAP guard in Task 6 is broken — fix it (do not weaken the test).

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "test: add Playwright coverage for the six-station journey and reduced-motion" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 8)
- ONLY add `voyage.spec.ts` (and only touch `smoke.spec.ts` if a real selector broke — report if so). Do NOT modify app code to pass tests; if the app misbehaves, fix the app and explain. Clean tree after commit.

---

## Task 9 : Finalisation (gates complets)

**Files:** none (verification + final commit if anything pending)

- [ ] **Step 1: Run all gates** (PowerShell, PATH refreshed):
  - `npm test` → all unit tests pass (i18n, schemas, astronomy, journey, starfield).
  - `npx astro check` → 0 errors, 0 warnings.
  - `npm run test:e2e` → all e2e pass (smoke + voyage).
  - `npm run build` → success; `dist/index.html` + `dist/en/index.html` present.
  Report the exact counts/output for each.

- [ ] **Step 2: Confirm clean tree & history**
  `git status` (clean, no stray tracked artifacts), `git --no-pager log --oneline -10`.
  If everything was committed per-task, there is nothing to commit here — just confirm.

## Definition of Done (phase 2)
- 6 stations rendered from `journey.ts`, bilingual, server-side (visible in `dist`).
- Procedural parallax starfield behind the journey; cosmic-zoom backgrounds; readable content reveals; progress bar.
- One NASA hero per station where the download succeeded; procedural gradient fallback otherwise — build never depends on the network.
- `prefers-reduced-motion`: all stations static and fully visible (verified by Playwright).
- All gates green: unit (incl. journey + starfield), `astro check`, e2e (smoke + voyage), static build.

---

## Roadmap (phases suivantes — plans à venir)
- **Phase 3 — La Carte du ciel** (Canvas, catalogue d'étoiles, constellations dorées, objets cliquables → fiches).
- **Phase 4 — Atlas & modules** (`atlas/[slug]`, Coin Matériel, facts browser, glossaire ; le bouton « Approfondir » des stations y pointera).
- **Phase 5 — Finitions** (SEO/OG, sitemap/hreflang, perf Lighthouse 90+, couture `getTonightData()` pour le temps réel).
