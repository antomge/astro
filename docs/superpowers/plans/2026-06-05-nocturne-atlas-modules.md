# Nocturne — Phase 4 : « Atlas & modules de référence » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner leurs pages à toutes les collections de contenu : un Atlas (index `/atlas` + fiches `/atlas/[slug]`), une page Coin Matériel et une page Glossaire — bilingues — et câbler le lien « fiche complète » du panneau de la Carte du ciel ainsi qu'un lien « Approfondir » sur les stations du Voyage.

**Architecture :** Pages Astro statiques (SSG, pas d'îlots) qui lisent les *content collections* existantes (`objects`, `equipment`, `facts`, `glossary`) et les rendent avec lecture en couches (vulgarisation + « pour aller plus loin » + conseils d'observation). On enrichit d'abord le contenu (carte blanche), puis on construit les pages. Le panneau de la carte (Phase 3) et les stations (Phase 2) reçoivent des liens vers les fiches de l'Atlas.

**Tech Stack :** Astro 6 (content collections, `getStaticPaths`) · TypeScript · Tailwind v4 · Vitest · Playwright.

**Référence :** spec §4.3 (Atlas) + §4.4 (modules) — `docs/superpowers/specs/2026-06-04-nocturne-astronomy-site-design.md`. S'appuie sur Phases 1–3 (mergées sur `main`).

> **Décisions validées :** tout en une phase ; carte blanche sur le contenu (jeu de départ bilingue modeste mais réel, images NASA créditées). Le clic carte → panneau d'info (Phase 3) gagne un lien « fiche complète » vers l'Atlas ; les stations du Voyage gagnent un lien « Approfondir ».
>
> **Convention de commit :** terminer chaque message par `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` (second `-m`).
>
> **Quirk env :** `npm`/`npx`/`node` seulement via **PowerShell**, après :
> `$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')`
> Bash n'a pas npm. git marche dans les deux.

---

## Slugs de routes (identiques FR/EN pour que le sélecteur de langue fonctionne)
- Atlas : `/atlas`, `/atlas/[slug]` (EN : `/en/atlas`, `/en/atlas/[slug]`)
- Matériel : `/gear` (EN : `/en/gear`)
- Glossaire : `/glossary` (EN : `/en/glossary`)

## Structure des fichiers

```
src/content/objects/jupiter.md, saturne.md         # NEW (seed) — 2 planètes
src/content/equipment/lunette.md, telescope.md,
  monture.md, appareil-photo.md                    # NEW (seed) — 4 entrées matériel
src/content/glossary/focale.md, temps-de-pose.md,
  pollution-lumineuse.md, echantillonnage.md       # NEW (seed) — 4 termes
src/content/facts/vitesse-lumiere.md,
  saturne-anneaux.md, etoile-filante.md            # NEW (seed) — 3 facts
scripts/fetch-heroes.mjs                           # MODIFY — ajoute saturn.jpg
src/pages/atlas/[slug].astro                       # NEW — fiche FR
src/pages/en/atlas/[slug].astro                    # NEW — fiche EN
src/pages/atlas/index.astro                        # NEW — index FR (grille objets + facts)
src/pages/en/atlas/index.astro                     # NEW — index EN
src/pages/gear.astro, src/pages/en/gear.astro      # NEW — Coin Matériel FR/EN
src/pages/glossary.astro, src/pages/en/glossary.astro # NEW — Glossaire FR/EN
src/lib/skymap.ts                                  # MODIFY — SkyLabels gagne atlasBase + viewFull
src/components/SkyInfoPanel.tsx                     # MODIFY — lien « fiche complète »
src/pages/sky.astro, src/pages/en/sky.astro        # MODIFY — passe atlasBase + viewFull
src/data/journey.ts                                # MODIFY — Station gagne atlasSlug?
src/components/Station.astro                        # MODIFY — lien « Approfondir »
src/components/Header.astro                         # MODIFY — liens Atlas / Matériel / Glossaire
src/i18n/ui.ts                                     # MODIFY — clés atlas.*/type.*/gear.*/glossary.*/station.more/sky.viewFull
tests/e2e/atlas.spec.ts                            # NEW — Atlas / Matériel / Glossaire
```

---

## Task 1 : Enrichir le contenu (objets, matériel, glossaire, facts)

**Files:** create the 13 markdown files below; modify `scripts/fetch-heroes.mjs`.

- [ ] **Step 1: Add 2 planet objects.**

`src/content/objects/jupiter.md`:
```md
---
type: planet
title: { fr: "Jupiter", en: "Jupiter" }
summary:
  fr: "Jupiter est la plus grande planète du Système solaire, et l'une des plus brillantes du ciel nocturne."
  en: "Jupiter is the largest planet in the Solar System and one of the brightest objects in the night sky."
deepDive:
  fr: "Aux jumelles, on devine déjà ses quatre lunes galiléennes alignées ; une petite lunette révèle ses bandes nuageuses et la Grande Tache rouge, une tempête plus large que la Terre."
  en: "With binoculars you can already spot its four Galilean moons in a line; a small refractor reveals its cloud bands and the Great Red Spot, a storm wider than Earth."
observingTips:
  fr: "Visible une bonne partie de l'année. Pose courte et faible ISO : Jupiter est lumineuse. Empilez de nombreuses images pour gagner en détail."
  en: "Visible for much of the year. Short exposure and low ISO: Jupiter is bright. Stack many frames to gain detail."
image: "/images/stations/jupiter.jpg"
imageCredit: "NASA"
featuredOnSkyMap: false
---
```

`src/content/objects/saturne.md`:
```md
---
type: planet
title: { fr: "Saturne", en: "Saturn" }
summary:
  fr: "Saturne et ses anneaux sont sans doute le plus beau spectacle qu'offre un télescope d'amateur."
  en: "Saturn and its rings are arguably the finest sight a small telescope can offer."
deepDive:
  fr: "Les anneaux sont faits de milliards de morceaux de glace et de roche. Leur inclinaison change au fil des années : parfois grands ouverts, parfois vus par la tranche."
  en: "The rings are made of billions of pieces of ice and rock. Their tilt changes over the years: sometimes wide open, sometimes seen edge-on."
observingTips:
  fr: "Un grossissement de 50x suffit à distinguer les anneaux. Cherchez aussi Titan, sa plus grande lune, comme un point voisin."
  en: "A magnification of 50x is enough to make out the rings. Look for Titan, its largest moon, as a nearby point of light."
image: "/images/stations/saturn.jpg"
imageCredit: "NASA"
featuredOnSkyMap: false
---
```

- [ ] **Step 2: Add 4 equipment entries.**

`src/content/equipment/lunette.md`:
```md
---
category: refractor
level: intermediate
budgetEur: 250
title: { fr: "La lunette astronomique", en: "The refractor telescope" }
body:
  fr: "Compacte et sans entretien, une lunette de 70 à 90 mm excelle sur la Lune et les planètes. Idéale comme premier instrument après les jumelles."
  en: "Compact and maintenance-free, a 70–90 mm refractor excels on the Moon and planets. An ideal first instrument after binoculars."
---
```

`src/content/equipment/telescope.md`:
```md
---
category: telescope
level: intermediate
budgetEur: 350
title: { fr: "Le télescope (Dobson)", en: "The (Dobsonian) telescope" }
body:
  fr: "Un Dobson de 150 à 200 mm offre le meilleur rapport diamètre/prix : il capte assez de lumière pour révéler nébuleuses et galaxies. Encombrant mais simple à utiliser."
  en: "A 150–200 mm Dobsonian gives the best aperture-per-euro: it gathers enough light to reveal nebulae and galaxies. Bulky but simple to use."
---
```

`src/content/equipment/monture.md`:
```md
---
category: mount
level: intermediate
budgetEur: 400
title: { fr: "La monture équatoriale", en: "The equatorial mount" }
body:
  fr: "Pour la photo du ciel profond, la monture compte plus que le tube : une monture motorisée qui suit la rotation du ciel permet de longues poses sans filé d'étoiles."
  en: "For deep-sky photography the mount matters more than the tube: a motorised mount that tracks the sky's rotation enables long exposures without star trails."
---
```

`src/content/equipment/appareil-photo.md`:
```md
---
category: camera
level: beginner
budgetEur: 0
title: { fr: "L'appareil photo (que vous avez déjà)", en: "The camera (you already own)" }
body:
  fr: "Un simple reflex ou hybride sur trépied suffit pour débuter : la Voie lactée, les constellations et les filés d'étoiles ne demandent qu'un objectif lumineux et la règle des 500."
  en: "A basic DSLR or mirrorless on a tripod is enough to start: the Milky Way, constellations and star trails only need a fast lens and the 500 rule."
---
```

- [ ] **Step 3: Add 4 glossary terms.**

`src/content/glossary/focale.md`:
```md
---
term: { fr: "Focale", en: "Focal length" }
definition:
  fr: "Distance (en mm) qui détermine le grossissement et le champ : plus elle est longue, plus l'image est grande mais le champ étroit."
  en: "A distance (in mm) that sets magnification and field of view: the longer it is, the larger the image but the narrower the field."
---
```

`src/content/glossary/temps-de-pose.md`:
```md
---
term: { fr: "Temps de pose", en: "Exposure time" }
definition:
  fr: "Durée pendant laquelle le capteur collecte la lumière. Trop long sans suivi, les étoiles deviennent des traînées (voir la règle des 500)."
  en: "How long the sensor collects light. Too long without tracking and stars become trails (see the 500 rule)."
---
```

`src/content/glossary/pollution-lumineuse.md`:
```md
---
term: { fr: "Pollution lumineuse", en: "Light pollution" }
definition:
  fr: "Halo lumineux des villes qui masque les étoiles faibles. S'éloigner de quelques dizaines de kilomètres change tout."
  en: "The glow of cities that hides faint stars. Driving a few dozen kilometres away changes everything."
---
```

`src/content/glossary/echantillonnage.md`:
```md
---
term: { fr: "Échantillonnage", en: "Sampling" }
definition:
  fr: "Rapport entre la focale et la taille des pixels (en secondes d'arc par pixel) : il fixe le niveau de détail qu'un capteur peut enregistrer."
  en: "The ratio between focal length and pixel size (in arcseconds per pixel): it sets how much sky detail a sensor can record."
---
```

- [ ] **Step 4: Add 3 facts.**

`src/content/facts/vitesse-lumiere.md`:
```md
---
text:
  fr: "Quand vous regardez le Soleil, vous le voyez tel qu'il était il y a 8 minutes — le temps que sa lumière nous parvienne."
  en: "When you look at the Sun, you see it as it was 8 minutes ago — the time its light takes to reach us."
source: "NASA"
---
```

`src/content/facts/saturne-anneaux.md`:
```md
---
text:
  fr: "Les anneaux de Saturne sont immenses mais incroyablement fins : quelques dizaines de mètres d'épaisseur pour 280 000 km de large."
  en: "Saturn's rings are vast yet incredibly thin: a few tens of metres thick across 280,000 km wide."
source: "NASA"
relatedObject: "saturne"
---
```

`src/content/facts/etoile-filante.md`:
```md
---
text:
  fr: "Une « étoile filante » n'est pas une étoile : c'est un grain de poussière, souvent plus petit qu'un grain de riz, qui brûle dans l'atmosphère."
  en: "A 'shooting star' is not a star: it is a speck of dust, often smaller than a grain of rice, burning up in the atmosphere."
source: "NASA"
---
```

- [ ] **Step 5: Add `saturn.jpg` to the hero downloader.** In `scripts/fetch-heroes.mjs`, add to the `SUBJECTS` object (keep existing entries):
```js
  'saturn.jpg': 'Saturn planet rings',
```

- [ ] **Step 6: Verify** (PowerShell, PATH refreshed):
  - `npm run build` → success (prebuild downloads heroes incl. `saturn.jpg`; the content collections validate against the Phase-1 schemas).
  - `npm test` → all unit tests pass (the schema tests + everything else).
  Report counts.

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "feat: expand bilingual content for atlas, gear, glossary and facts" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 1)
- Reuse the EXISTING schemas (`src/content/schemas.ts`) unchanged. Every `objects` entry needs `summary`+`deepDive`; planets set `featuredOnSkyMap: false` and omit `skyCoords` (they move, so they're atlas-only, not on the fixed star map). Preserve typographic apostrophes/accents exactly.
- Downloaded `.jpg` stay git-ignored; only the `.md` files and `scripts/fetch-heroes.mjs` are committed. After commit: `git status` clean, `git rev-parse HEAD`/`HEAD~1`.

---

## Task 2 : Fiches Atlas `/atlas/[slug]` (FR + EN)

**Files:** create `src/pages/atlas/[slug].astro`, `src/pages/en/atlas/[slug].astro`; modify `src/i18n/ui.ts` (type labels).

- [ ] **Step 1: Add object-type labels to `src/i18n/ui.ts`.** READ the file. Add to BOTH `fr` and `en` blocks (keep all existing keys; identical key sets):
  - `fr`:
    ```
    'type.moon': 'Satellite',
    'type.planet': 'Planète',
    'type.nebula': 'Nébuleuse',
    'type.galaxy': 'Galaxie',
    'type.star': 'Amas / Étoile',
    ```
  - `en`:
    ```
    'type.moon': 'Moon',
    'type.planet': 'Planet',
    'type.nebula': 'Nebula',
    'type.galaxy': 'Galaxy',
    'type.star': 'Cluster / Star',
    ```

- [ ] **Step 2: Create `src/pages/atlas/[slug].astro`** with EXACTLY:
```astro
---
import { existsSync } from 'node:fs';
import { getCollection } from 'astro:content';
import Layout from '../../components/Layout.astro';
import { useTranslations } from '../../i18n/utils';
import type { Lang, UIKey } from '../../i18n/ui';

export async function getStaticPaths() {
  const objects = await getCollection('objects');
  return objects.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const lang: Lang = 'fr';
const { entry } = Astro.props;
const t = useTranslations(lang);
const d = entry.data;
const heroSrc = existsSync(`public${d.image}`) ? d.image : undefined;
const typeLabel = t(`type.${d.type}` as UIKey);
---

<Layout lang={lang} title={`${d.title[lang]} — ${t('site.name')}`} description={d.summary[lang]}>
  <article class="mx-auto max-w-3xl px-6 pb-24 pt-28">
    <a href="/atlas" class="text-sm text-stellar hover:underline">← {t('nav.atlas')}</a>
    <p class="mt-6 text-xs uppercase tracking-[0.3em] text-stellar">{typeLabel}</p>
    <h1 class="mt-2 font-display text-5xl text-starlight">{d.title[lang]}</h1>
    {heroSrc && (
      <figure class="mt-8">
        <img src={heroSrc} alt="" class="w-full rounded-lg object-cover" />
        <figcaption class="mt-1 text-[10px] text-muted/70">© {d.imageCredit}</figcaption>
      </figure>
    )}
    <p class="mt-8 text-lg text-muted">{d.summary[lang]}</p>
    <h2 class="mt-10 text-sm uppercase tracking-widest text-stellar">{t('atlas.deepDive')}</h2>
    <p class="mt-2 text-starlight/90">{d.deepDive[lang]}</p>
    {d.observingTips && (
      <>
        <h2 class="mt-10 text-sm uppercase tracking-widest text-ember">{t('atlas.observing')}</h2>
        <p class="mt-2 text-starlight/90">{d.observingTips[lang]}</p>
      </>
    )}
  </article>
</Layout>
```

- [ ] **Step 3: Create `src/pages/en/atlas/[slug].astro`** with EXACTLY (note `../../../` import depth, `lang = 'en'`, back-link `/en/atlas`):
```astro
---
import { existsSync } from 'node:fs';
import { getCollection } from 'astro:content';
import Layout from '../../../components/Layout.astro';
import { useTranslations } from '../../../i18n/utils';
import type { Lang, UIKey } from '../../../i18n/ui';

export async function getStaticPaths() {
  const objects = await getCollection('objects');
  return objects.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const lang: Lang = 'en';
const { entry } = Astro.props;
const t = useTranslations(lang);
const d = entry.data;
const heroSrc = existsSync(`public${d.image}`) ? d.image : undefined;
const typeLabel = t(`type.${d.type}` as UIKey);
---

<Layout lang={lang} title={`${d.title[lang]} — ${t('site.name')}`} description={d.summary[lang]}>
  <article class="mx-auto max-w-3xl px-6 pb-24 pt-28">
    <a href="/en/atlas" class="text-sm text-stellar hover:underline">← {t('nav.atlas')}</a>
    <p class="mt-6 text-xs uppercase tracking-[0.3em] text-stellar">{typeLabel}</p>
    <h1 class="mt-2 font-display text-5xl text-starlight">{d.title[lang]}</h1>
    {heroSrc && (
      <figure class="mt-8">
        <img src={heroSrc} alt="" class="w-full rounded-lg object-cover" />
        <figcaption class="mt-1 text-[10px] text-muted/70">© {d.imageCredit}</figcaption>
      </figure>
    )}
    <p class="mt-8 text-lg text-muted">{d.summary[lang]}</p>
    <h2 class="mt-10 text-sm uppercase tracking-widest text-stellar">{t('atlas.deepDive')}</h2>
    <p class="mt-2 text-starlight/90">{d.deepDive[lang]}</p>
    {d.observingTips && (
      <>
        <h2 class="mt-10 text-sm uppercase tracking-widest text-ember">{t('atlas.observing')}</h2>
        <p class="mt-2 text-starlight/90">{d.observingTips[lang]}</p>
      </>
    )}
  </article>
</Layout>
```

- [ ] **Step 4: Verify** (PowerShell, PATH refreshed): `npx astro check` then `npm run build`.
  Expected: 0 errors; build generates `dist/atlas/orion/index.html`, `dist/atlas/la-lune/index.html`, … and the `/en/atlas/...` equivalents. Confirm `Test-Path dist/atlas/orion/index.html` is True.
  (`atlas.deepDive`/`atlas.observing` keys already exist from Phase 3.)

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: add bilingual atlas object detail pages" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 2)
- `getStaticPaths` uses `entry.id` (Astro 6 glob loader id = filename without extension) as the `slug` param. The `existsSync(\`public${d.image}\`)` guard renders the `<img>` only when the file exists (clean fallback, no 404). `type.*` keys must be added to both language blocks identically. Trailing newlines. After commit: clean tree.

---

## Task 3 : Index Atlas `/atlas` (grille d'objets + « Le saviez-vous ? ») + lien de nav

**Files:** create `src/pages/atlas/index.astro`, `src/pages/en/atlas/index.astro`; modify `src/components/Header.astro`, `src/i18n/ui.ts`.

- [ ] **Step 1: Add index i18n keys to `src/i18n/ui.ts`** (both blocks, identical sets):
  - `fr`:
    ```
    'atlas.intro': "Explorez les objets du ciel, de la Lune aux galaxies lointaines. Chaque fiche mêle vulgarisation et conseils pour les observer.",
    'atlas.allObjects': 'Tous les objets',
    'atlas.facts': 'Le saviez-vous ?',
    ```
  - `en`:
    ```
    'atlas.intro': 'Explore the objects of the night sky, from the Moon to distant galaxies. Each entry blends plain-language explanation with tips to observe them.',
    'atlas.allObjects': 'All objects',
    'atlas.facts': 'Did you know?',
    ```

- [ ] **Step 2: Create `src/pages/atlas/index.astro`** with EXACTLY:
```astro
---
import { existsSync } from 'node:fs';
import { getCollection } from 'astro:content';
import Layout from '../../components/Layout.astro';
import { useTranslations } from '../../i18n/utils';
import type { Lang, UIKey } from '../../i18n/ui';

const lang: Lang = 'fr';
const t = useTranslations(lang);

const objects = (await getCollection('objects')).sort((a, b) =>
  a.data.title[lang].localeCompare(b.data.title[lang]),
);
const facts = await getCollection('facts');
---

<Layout lang={lang} title={`${t('nav.atlas')} — ${t('site.name')}`} description={t('atlas.intro')}>
  <section class="mx-auto max-w-6xl px-6 pb-24 pt-28">
    <h1 class="font-display text-4xl text-starlight md:text-5xl">{t('nav.atlas')}</h1>
    <p class="mt-4 max-w-2xl text-muted">{t('atlas.intro')}</p>

    <h2 class="mt-12 text-sm uppercase tracking-widest text-stellar">{t('atlas.allObjects')}</h2>
    <ul class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {objects.map((e) => {
        const heroSrc = existsSync(`public${e.data.image}`) ? e.data.image : undefined;
        return (
          <li>
            <a
              href={`/atlas/${e.id}`}
              class="group block overflow-hidden rounded-lg border border-white/10 bg-space-800 transition hover:border-stellar/50"
            >
              {heroSrc && (
                <img src={heroSrc} alt="" class="h-40 w-full object-cover opacity-80 transition group-hover:opacity-100" />
              )}
              <div class="p-4">
                <p class="text-xs uppercase tracking-widest text-stellar">{t(`type.${e.data.type}` as UIKey)}</p>
                <h3 class="mt-1 font-display text-2xl text-starlight">{e.data.title[lang]}</h3>
                <p class="mt-2 line-clamp-3 text-sm text-muted">{e.data.summary[lang]}</p>
              </div>
            </a>
          </li>
        );
      })}
    </ul>

    <h2 class="mt-16 text-sm uppercase tracking-widest text-ember">{t('atlas.facts')}</h2>
    <ul class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      {facts.map((f) => (
        <li class="rounded-lg border-l-2 border-ember/60 bg-space-800/50 p-4 text-sm text-starlight/90">
          {f.data.text[lang]}
        </li>
      ))}
    </ul>
  </section>
</Layout>
```

- [ ] **Step 3: Create `src/pages/en/atlas/index.astro`** — EXACTLY the same as Step 2 BUT `lang = 'en'`, imports at `../../../`, and the card link is `/en/atlas/${e.id}`:
```astro
---
import { existsSync } from 'node:fs';
import { getCollection } from 'astro:content';
import Layout from '../../../components/Layout.astro';
import { useTranslations } from '../../../i18n/utils';
import type { Lang, UIKey } from '../../../i18n/ui';

const lang: Lang = 'en';
const t = useTranslations(lang);

const objects = (await getCollection('objects')).sort((a, b) =>
  a.data.title[lang].localeCompare(b.data.title[lang]),
);
const facts = await getCollection('facts');
---

<Layout lang={lang} title={`${t('nav.atlas')} — ${t('site.name')}`} description={t('atlas.intro')}>
  <section class="mx-auto max-w-6xl px-6 pb-24 pt-28">
    <h1 class="font-display text-4xl text-starlight md:text-5xl">{t('nav.atlas')}</h1>
    <p class="mt-4 max-w-2xl text-muted">{t('atlas.intro')}</p>

    <h2 class="mt-12 text-sm uppercase tracking-widest text-stellar">{t('atlas.allObjects')}</h2>
    <ul class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {objects.map((e) => {
        const heroSrc = existsSync(`public${e.data.image}`) ? e.data.image : undefined;
        return (
          <li>
            <a
              href={`/en/atlas/${e.id}`}
              class="group block overflow-hidden rounded-lg border border-white/10 bg-space-800 transition hover:border-stellar/50"
            >
              {heroSrc && (
                <img src={heroSrc} alt="" class="h-40 w-full object-cover opacity-80 transition group-hover:opacity-100" />
              )}
              <div class="p-4">
                <p class="text-xs uppercase tracking-widest text-stellar">{t(`type.${e.data.type}` as UIKey)}</p>
                <h3 class="mt-1 font-display text-2xl text-starlight">{e.data.title[lang]}</h3>
                <p class="mt-2 line-clamp-3 text-sm text-muted">{e.data.summary[lang]}</p>
              </div>
            </a>
          </li>
        );
      })}
    </ul>

    <h2 class="mt-16 text-sm uppercase tracking-widest text-ember">{t('atlas.facts')}</h2>
    <ul class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      {facts.map((f) => (
        <li class="rounded-lg border-l-2 border-ember/60 bg-space-800/50 p-4 text-sm text-starlight/90">
          {f.data.text[lang]}
        </li>
      ))}
    </ul>
  </section>
</Layout>
```

- [ ] **Step 4: Add the Atlas link to `src/components/Header.astro`.** READ it. In the frontmatter (after the existing `skyHref`), add:
  ```ts
  const atlasHref = lang === 'fr' ? '/atlas' : '/en/atlas';
  ```
  In the `<nav>`, add AFTER the Sky Map link and BEFORE the language switch:
  ```astro
  <a href={atlasHref} class="hover:text-stellar">{t('nav.atlas')}</a>
  ```

- [ ] **Step 5: Verify** (PowerShell): `npx astro check` (0 errors) then `npm run build` (success; `dist/atlas/index.html` + `dist/en/atlas/index.html` exist). `npm test` still green.

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat: add atlas index with object grid and facts section" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 3)
- `line-clamp-3` is a built-in Tailwind v4 utility. The index links to the detail routes from Task 2. fr/en key sets identical. Trailing newlines. After commit: clean tree.

---

## Task 4 : Câbler les liens vers l'Atlas (panneau Carte + stations Voyage)

**Files:** modify `src/lib/skymap.ts`, `src/components/SkyInfoPanel.tsx`, `src/pages/sky.astro`, `src/pages/en/sky.astro`, `src/data/journey.ts`, `src/components/Station.astro`, `src/i18n/ui.ts`.

- [ ] **Step 1: Extend `SkyLabels` in `src/lib/skymap.ts`.** Add two fields to the `SkyLabels` interface (keep the others):
```ts
export interface SkyLabels {
  deepDive: string;
  observingTips: string;
  close: string;
  hint: string;
  objectsHeading: string;
  mapLabel: string;
  atlasBase: string;
  viewFull: string;
}
```

- [ ] **Step 2: Add the « fiche complète » link to `src/components/SkyInfoPanel.tsx`.** Insert this block immediately AFTER the `{object.observingTips && ( ... )}` section and BEFORE the closing `</aside>`:
```tsx
      <a
        href={`${labels.atlasBase}/${object.slug}`}
        className="mt-6 inline-block rounded border border-stellar/40 px-3 py-1 text-sm text-stellar hover:bg-stellar/10"
      >
        {labels.viewFull}
      </a>
```

- [ ] **Step 3: Add `sky.viewFull` and `station.more` keys to `src/i18n/ui.ts`** (both blocks, identical):
  - `fr`:
    ```
    'sky.viewFull': 'Voir la fiche complète',
    'station.more': 'Approfondir',
    ```
  - `en`:
    ```
    'sky.viewFull': 'View full entry',
    'station.more': 'Go deeper',
    ```

- [ ] **Step 4: Pass the new labels from both sky pages.** In `src/pages/sky.astro` AND `src/pages/en/sky.astro`, extend the `labels` object with the two new fields. For `src/pages/sky.astro` (FR), the `labels` becomes:
```ts
const labels: SkyLabels = {
  deepDive: t('atlas.deepDive'),
  observingTips: t('atlas.observing'),
  close: t('ui.close'),
  hint: t('sky.hint'),
  objectsHeading: t('sky.objects'),
  mapLabel: t('sky.maplabel'),
  atlasBase: '/atlas',
  viewFull: t('sky.viewFull'),
};
```
For `src/pages/en/sky.astro` (EN), identical EXCEPT `atlasBase: '/en/atlas'`.

- [ ] **Step 5: Add `atlasSlug` to the journey stations.** In `src/data/journey.ts`, add an optional field to the `Station` interface (keep the others):
```ts
  /** slug de la fiche Atlas associée (lien « Approfondir ») */
  atlasSlug?: string;
```
Then add `atlasSlug` to these four stations (leave `liftoff` and `solar-system` without one):
  - station `id: 'moon'` → add `atlasSlug: 'la-lune',`
  - station `id: 'stars'` → add `atlasSlug: 'pleiades',`
  - station `id: 'nebulae'` → add `atlasSlug: 'orion',`
  - station `id: 'galaxies'` → add `atlasSlug: 'andromede',`

- [ ] **Step 6: Add the « Approfondir » link to `src/components/Station.astro`.** Inside the content `<div data-anim="content">`, immediately AFTER the `{station.fact && ( ... )}` aside and BEFORE the closing `</div>` of that inner text column, add:
```astro
      {station.atlasSlug && (
        <a
          href={lang === 'fr' ? `/atlas/${station.atlasSlug}` : `/en/atlas/${station.atlasSlug}`}
          class="mt-6 inline-block text-sm text-stellar hover:underline"
        >
          {t('station.more')} →
        </a>
      )}
```
(`Station.astro` already imports `useTranslations` and has `t`; confirm `t` is in scope — it is, from the existing frontmatter.)

- [ ] **Step 7: Verify** (PowerShell): `npx astro check` (0 errors) then `npm run build` (success). `npm test` green. Confirm in the built HTML that `dist/sky/index.html` includes `/atlas/` (the panel link is server-rendered inside the island markup) and `dist/index.html` includes an `/atlas/la-lune` link (the moon station's Approfondir).

- [ ] **Step 8: Commit**
```bash
git add -A
git commit -m "feat: link the sky panel and journey stations to atlas entries" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 4)
- Adding required fields to `SkyLabels` forces both sky pages to provide them — that's intended (TS will error if you miss one). The `atlasSlug` values must match real object ids (`la-lune`, `pleiades`, `orion`, `andromede`). The journey unit test does not assert `atlasSlug`, so it stays green. fr/en key sets identical. After commit: clean tree, full `npm test` green.

---

## Task 5 : Pages Coin Matériel `/gear` & Glossaire `/glossary` (FR + EN) + nav

**Files:** create `src/pages/gear.astro`, `src/pages/en/gear.astro`, `src/pages/glossary.astro`, `src/pages/en/glossary.astro`; modify `src/components/Header.astro`, `src/i18n/ui.ts`.

- [ ] **Step 1: Add gear/glossary i18n keys to `src/i18n/ui.ts`** (both blocks, identical):
  - `fr`:
    ```
    'gear.intro': "Par où commencer ? Voici un parcours simple, des jumelles au télescope, selon votre budget et votre niveau.",
    'gear.budgetFrom': 'À partir de',
    'gear.levelBeginner': 'Débutant',
    'gear.levelIntermediate': 'Initié',
    'glossary.intro': "Les mots de l'astronomie et de l'astrophotographie, expliqués simplement.",
    ```
  - `en`:
    ```
    'gear.intro': 'Where to start? Here is a simple path, from binoculars to a telescope, depending on your budget and level.',
    'gear.budgetFrom': 'From',
    'gear.levelBeginner': 'Beginner',
    'gear.levelIntermediate': 'Intermediate',
    'glossary.intro': 'The words of astronomy and astrophotography, explained simply.',
    ```

- [ ] **Step 2: Create `src/pages/gear.astro`** with EXACTLY:
```astro
---
import { getCollection } from 'astro:content';
import Layout from '../components/Layout.astro';
import { useTranslations } from '../i18n/utils';
import type { Lang } from '../i18n/ui';

const lang: Lang = 'fr';
const t = useTranslations(lang);

const rank: Record<string, number> = { beginner: 0, intermediate: 1 };
const items = (await getCollection('equipment')).sort(
  (a, b) =>
    rank[a.data.level] - rank[b.data.level] ||
    (a.data.budgetEur ?? 0) - (b.data.budgetEur ?? 0),
);
---

<Layout lang={lang} title={`${t('nav.gear')} — ${t('site.name')}`} description={t('gear.intro')}>
  <section class="mx-auto max-w-4xl px-6 pb-24 pt-28">
    <h1 class="font-display text-4xl text-starlight md:text-5xl">{t('nav.gear')}</h1>
    <p class="mt-4 max-w-2xl text-muted">{t('gear.intro')}</p>
    <ul class="mt-10 space-y-6">
      {items.map((e) => (
        <li class="rounded-lg border border-white/10 bg-space-800 p-6">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="font-display text-2xl text-starlight">{e.data.title[lang]}</h2>
            <span class="text-xs uppercase tracking-widest text-stellar">
              {e.data.level === 'beginner' ? t('gear.levelBeginner') : t('gear.levelIntermediate')}
            </span>
          </div>
          <p class="mt-3 text-muted">{e.data.body[lang]}</p>
          {e.data.budgetEur ? (
            <p class="mt-3 text-sm text-ember">{t('gear.budgetFrom')} {e.data.budgetEur} €</p>
          ) : null}
        </li>
      ))}
    </ul>
  </section>
</Layout>
```

- [ ] **Step 3: Create `src/pages/en/gear.astro`** — EXACTLY the same as Step 2 BUT `lang = 'en'` and imports at `../../`:
```astro
---
import { getCollection } from 'astro:content';
import Layout from '../../components/Layout.astro';
import { useTranslations } from '../../i18n/utils';
import type { Lang } from '../../i18n/ui';

const lang: Lang = 'en';
const t = useTranslations(lang);

const rank: Record<string, number> = { beginner: 0, intermediate: 1 };
const items = (await getCollection('equipment')).sort(
  (a, b) =>
    rank[a.data.level] - rank[b.data.level] ||
    (a.data.budgetEur ?? 0) - (b.data.budgetEur ?? 0),
);
---

<Layout lang={lang} title={`${t('nav.gear')} — ${t('site.name')}`} description={t('gear.intro')}>
  <section class="mx-auto max-w-4xl px-6 pb-24 pt-28">
    <h1 class="font-display text-4xl text-starlight md:text-5xl">{t('nav.gear')}</h1>
    <p class="mt-4 max-w-2xl text-muted">{t('gear.intro')}</p>
    <ul class="mt-10 space-y-6">
      {items.map((e) => (
        <li class="rounded-lg border border-white/10 bg-space-800 p-6">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="font-display text-2xl text-starlight">{e.data.title[lang]}</h2>
            <span class="text-xs uppercase tracking-widest text-stellar">
              {e.data.level === 'beginner' ? t('gear.levelBeginner') : t('gear.levelIntermediate')}
            </span>
          </div>
          <p class="mt-3 text-muted">{e.data.body[lang]}</p>
          {e.data.budgetEur ? (
            <p class="mt-3 text-sm text-ember">{t('gear.budgetFrom')} {e.data.budgetEur} €</p>
          ) : null}
        </li>
      ))}
    </ul>
  </section>
</Layout>
```

- [ ] **Step 4: Create `src/pages/glossary.astro`** with EXACTLY:
```astro
---
import { getCollection } from 'astro:content';
import Layout from '../components/Layout.astro';
import { useTranslations } from '../i18n/utils';
import type { Lang } from '../i18n/ui';

const lang: Lang = 'fr';
const t = useTranslations(lang);

const terms = (await getCollection('glossary')).sort((a, b) =>
  a.data.term[lang].localeCompare(b.data.term[lang]),
);
---

<Layout lang={lang} title={`${t('nav.glossary')} — ${t('site.name')}`} description={t('glossary.intro')}>
  <section class="mx-auto max-w-3xl px-6 pb-24 pt-28">
    <h1 class="font-display text-4xl text-starlight md:text-5xl">{t('nav.glossary')}</h1>
    <p class="mt-4 max-w-2xl text-muted">{t('glossary.intro')}</p>
    <dl class="mt-10 space-y-6">
      {terms.map((e) => (
        <div class="border-b border-white/10 pb-6">
          <dt class="font-display text-2xl text-starlight">{e.data.term[lang]}</dt>
          <dd class="mt-2 text-muted">{e.data.definition[lang]}</dd>
        </div>
      ))}
    </dl>
  </section>
</Layout>
```

- [ ] **Step 5: Create `src/pages/en/glossary.astro`** — EXACTLY the same as Step 4 BUT `lang = 'en'` and imports at `../../`:
```astro
---
import { getCollection } from 'astro:content';
import Layout from '../../components/Layout.astro';
import { useTranslations } from '../../i18n/utils';
import type { Lang } from '../../i18n/ui';

const lang: Lang = 'en';
const t = useTranslations(lang);

const terms = (await getCollection('glossary')).sort((a, b) =>
  a.data.term[lang].localeCompare(b.data.term[lang]),
);
---

<Layout lang={lang} title={`${t('nav.glossary')} — ${t('site.name')}`} description={t('glossary.intro')}>
  <section class="mx-auto max-w-3xl px-6 pb-24 pt-28">
    <h1 class="font-display text-4xl text-starlight md:text-5xl">{t('nav.glossary')}</h1>
    <p class="mt-4 max-w-2xl text-muted">{t('glossary.intro')}</p>
    <dl class="mt-10 space-y-6">
      {terms.map((e) => (
        <div class="border-b border-white/10 pb-6">
          <dt class="font-display text-2xl text-starlight">{e.data.term[lang]}</dt>
          <dd class="mt-2 text-muted">{e.data.definition[lang]}</dd>
        </div>
      ))}
    </dl>
  </section>
</Layout>
```

- [ ] **Step 6: Add the Matériel & Glossaire nav links to `src/components/Header.astro`.** In the frontmatter (after `atlasHref`), add:
  ```ts
  const gearHref = lang === 'fr' ? '/gear' : '/en/gear';
  const glossaryHref = lang === 'fr' ? '/glossary' : '/en/glossary';
  ```
  In the `<nav>`, add AFTER the Atlas link and BEFORE the language switch:
  ```astro
  <a href={gearHref} class="hover:text-stellar">{t('nav.gear')}</a>
  <a href={glossaryHref} class="hover:text-stellar">{t('nav.glossary')}</a>
  ```
  Also, to keep the now-longer nav usable on small screens, change the `<nav>`'s class list so it wraps: ensure the `<nav>` element has `flex-wrap` (add `flex-wrap` to its existing class list if not already present).

- [ ] **Step 7: Verify** (PowerShell): `npx astro check` (0 errors), `npm run build` (success; `dist/gear/index.html`, `dist/en/gear/index.html`, `dist/glossary/index.html`, `dist/en/glossary/index.html` exist), `npm test` green.

- [ ] **Step 8: Commit**
```bash
git add -A
git commit -m "feat: add gear corner and glossary pages with nav links" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 5)
- `appareil-photo` has `budgetEur: 0`, which is intentionally falsy so no budget line shows (it means "you already own it"). fr/en key sets identical. The Header nav now has 5 links + language switch — ensure it wraps gracefully (`flex-wrap`). Trailing newlines. After commit: clean tree.

---

## Task 6 : Tests e2e + finalisation

**Files:** create `tests/e2e/atlas.spec.ts`.

- [ ] **Step 1: Write `tests/e2e/atlas.spec.ts`** with EXACTLY:
```ts
import { test, expect } from '@playwright/test';

test('atlas index lists objects and a detail page opens (FR)', async ({ page }) => {
  await page.goto('/atlas');
  await expect(page.getByRole('heading', { name: /Atlas/, level: 1 })).toBeVisible();
  await page.getByRole('link', { name: /Orion/ }).first().click();
  await expect(page).toHaveURL(/\/atlas\/orion\/?$/);
  await expect(page.getByRole('heading', { name: /Orion/, level: 1 })).toBeVisible();
  await expect(page.getByText('Pour aller plus loin')).toBeVisible();
});

test('gear and glossary pages render (FR)', async ({ page }) => {
  await page.goto('/gear');
  await expect(page.getByRole('heading', { name: /Coin Matériel/, level: 1 })).toBeVisible();
  await page.goto('/glossary');
  await expect(page.getByRole('heading', { name: 'Glossaire', level: 1 })).toBeVisible();
  await expect(page.getByText('Magnitude')).toBeVisible();
});

test('the moon station links to its atlas entry (FR home)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href="/atlas/la-lune"]')).toHaveCount(1);
});

test('English atlas index renders', async ({ page }) => {
  await page.goto('/en/atlas');
  await expect(page.getByRole('heading', { name: 'The Atlas', level: 1 })).toBeVisible();
});
```

- [ ] **Step 2: Run the full e2e suite** (PowerShell, PATH refreshed): `npm run test:e2e`
  Expected: all pass — smoke (2) + voyage (3) + sky (3) + atlas (4) = 12 tests.
  Notes: the atlas/gear/glossary pages are static (no hydration), so no retry is needed. The moon-station link assertion checks the server-rendered `<a href="/atlas/la-lune">` (it is inside the journey markup, present regardless of scroll). If a heading regex is ambiguous, tighten it; do NOT weaken an assertion to mask a real failure — report it.

- [ ] **Step 3: Commit**
```bash
git add tests/e2e/atlas.spec.ts
git commit -m "test: add Playwright coverage for atlas, gear and glossary" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 4: Final gates** (PowerShell, PATH refreshed) — run and report exact output:
  - `npm test` → all unit pass (i18n, schemas, astronomy, journey, starfield, skymap, sky-data).
  - `npx astro check` → 0 errors, 0 warnings.
  - `npm run test:e2e` → 12 pass.
  - `npm run build` → success.
  Confirm `git status` clean.

## Definition of Done (phase 4)
- `/atlas` (FR/EN) lists every object as a card (image + type + summary) and a "Le saviez-vous ?" facts section; `/atlas/[slug]` renders a full bilingual fiche (summary + "pour aller plus loin" + observing tips) for every object.
- The Sky Map info panel has a "fiche complète" link to `/atlas/<slug>`; the Voyage stations (Moon, Stars, Nebulae, Galaxies) have an "Approfondir" link to their atlas entry.
- `/gear` (FR/EN) lists the equipment path by level/budget; `/glossary` (FR/EN) lists the terms alphabetically.
- Header links to Atlas, Matériel, Glossaire (in addition to Voyage + Carte); language switch preserves every page.
- All gates green: unit, astro check, e2e (12), static build. Content authored bilingually with NASA credits.

---

## Roadmap (suite)
- **Phase 5 — Finitions** : SEO/Open Graph + cartes de partage, sitemap, hreflang ; responsive du header (menu mobile) ; passes d'accessibilité ; perf (Lighthouse 90+) ; couture `getTonightData()` pour le temps réel (ISS, météo du ciel) ; position réelle de la Lune/planètes sur la carte ; README de projet propre.
```
