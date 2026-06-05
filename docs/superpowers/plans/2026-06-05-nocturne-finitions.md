# Nocturne — Phase 5 : « Finitions (prêt pour la production) » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre le site réellement *shippable* : métadonnées SEO + Open Graph (cartes de partage) + hreflang/canonical, sitemap, en-tête responsive (menu mobile), passes d'accessibilité, hygiène de performance, et un README de projet propre.

**Architecture :** Tout passe par des composants/pages existants. Le `Layout` centralise les balises `<head>` (SEO/OG/hreflang) — une seule source pour toutes les pages. Une image de partage `og.png` est générée une fois (via `sharp`, déjà installé) et committée. Le `Header` devient responsive (menu hamburger en vanilla JS, accessible). Aucune dépendance temps réel : la Phase 5 reste 100 % statique.

**Tech Stack :** Astro 6 · `@astrojs/sitemap` · `sharp` (génération OG) · TypeScript · Tailwind v4 · Vitest · Playwright.

**Référence :** spec §7 (Accessibilité/perf/SEO) — `docs/superpowers/specs/2026-06-04-nocturne-astronomy-site-design.md`. S'appuie sur Phases 1–4 (mergées sur `main`).

> **Décisions validées :** Phase 5 = **prêt pour la prod** (A). Le **temps réel** (`getTonightData()` : ISS, météo du ciel, position réelle Lune/planètes) est **reporté à une Phase 6** dédiée.
>
> **Convention de commit :** terminer chaque message par `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` (second `-m`).
>
> **Quirk env :** `npm`/`npx`/`node` seulement via **PowerShell**, après :
> `$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')`
> Bash n'a pas npm. git marche dans les deux.
>
> **Quirk Edit :** l'outil Edit peut convertir des apostrophes droites en typographiques dans un fichier qui en contient déjà — après édition d'un `.ts`/`.astro` avec apostrophes, lancer `npm run build` ; corriger les délimiteurs en ASCII droit si esbuild se plaint.

---

## Structure des fichiers

```
scripts/make-og.mjs            # NEW — génère public/og.png via sharp (one-shot, sortie committée)
public/og.png                  # NEW (committed) — carte de partage 1200×630
public/robots.txt              # NEW — pointe vers le sitemap
src/components/Layout.astro    # MODIFY — head SEO/OG/hreflang/canonical + skip-link + main#main
src/components/Header.astro    # MODIFY — menu hamburger responsive + aria-current + script
src/styles/global.css          # MODIFY — :focus-visible
src/i18n/ui.ts                 # MODIFY — clés a11y.skip + nav.menu
astro.config.mjs               # MODIFY — intégration @astrojs/sitemap
src/pages/atlas/[slug].astro,
  en/atlas/[slug].astro        # MODIFY — hygiène image (aspect-ratio, lazy/async)
README.md                      # REWRITE — README de projet
tests/e2e/seo.spec.ts          # NEW — meta SEO/OG + menu mobile
```

---

## Task 1 : SEO, Open Graph, hreflang & skip-link (Layout) + image de partage

**Files:** create `scripts/make-og.mjs`, `public/og.png`; modify `src/components/Layout.astro`, `src/i18n/ui.ts`.

- [ ] **Step 1: Write `scripts/make-og.mjs`** with EXACTLY (shapes-only SVG → PNG, no font dependency):
```js
// Generates the Open Graph share card public/og.png (1200x630) with sharp (no fonts needed).
// Run once: node scripts/make-og.mjs   (output is committed to the repo)
import sharp from 'sharp';

const W = 1200;
const H = 630;

function stars(n) {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = Math.round(rnd() * W);
    const y = Math.round(rnd() * H);
    const r = (rnd() * 1.6 + 0.4).toFixed(1);
    const o = (rnd() * 0.7 + 0.3).toFixed(2);
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#e8edf7" opacity="${o}"/>`;
  }
  return s;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#05070d"/><stop offset="0.6" stop-color="#0a0e1a"/><stop offset="1" stop-color="#10131f"/>
    </linearGradient>
    <radialGradient id="glow" cx="78%" cy="32%" r="42%">
      <stop offset="0" stop-color="#7fd8ff" stop-opacity="0.35"/><stop offset="1" stop-color="#7fd8ff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  ${stars(150)}
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g transform="translate(950,205)">
    <circle r="120" fill="#f4f1e8"/>
    <circle cx="46" cy="-32" r="120" fill="#0a0e1a"/>
  </g>
  <rect x="0" y="566" width="${W}" height="6" fill="#7fd8ff" opacity="0.55"/>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/og.png');
console.log('Wrote public/og.png');
```

- [ ] **Step 2: Generate the image** (PowerShell, PATH refreshed): `node scripts/make-og.mjs`
  Expected: prints `Wrote public/og.png`; `public/og.png` exists (a 1200×630 PNG). Confirm `Test-Path public/og.png` is True. (If `sharp` is somehow not resolvable, it ships with Astro — verify with `npm ls sharp`; report if missing.)

- [ ] **Step 3: Add i18n keys to `src/i18n/ui.ts`** (both blocks, identical sets):
  - `fr`:
    ```
    'a11y.skip': 'Aller au contenu',
    'nav.menu': 'Menu',
    ```
  - `en`:
    ```
    'a11y.skip': 'Skip to content',
    'nav.menu': 'Menu',
    ```

- [ ] **Step 4: Replace `src/components/Layout.astro`** with EXACTLY:
```astro
---
import '@fontsource-variable/inter';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '../styles/global.css';
import Header from './Header.astro';
import { useTranslations, localizedPath } from '../i18n/utils';
import type { Lang } from '../i18n/ui';

interface Props {
  lang: Lang;
  title: string;
  description?: string;
  image?: string;
}

const { lang, title, description, image = '/og.png' } = Astro.props;
const t = useTranslations(lang);

const site = Astro.site ?? new URL('https://nocturne.pages.dev');
const canonical = new URL(Astro.url.pathname, site);
const ogImage = new URL(image, site);
const frUrl = new URL(localizedPath(Astro.url.pathname, 'fr'), site);
const enUrl = new URL(localizedPath(Astro.url.pathname, 'en'), site);
const ogLocale = lang === 'fr' ? 'fr_FR' : 'en_GB';
---

<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    <link rel="canonical" href={canonical.href} />
    <link rel="alternate" hreflang="fr" href={frUrl.href} />
    <link rel="alternate" hreflang="en" href={enUrl.href} />
    <link rel="alternate" hreflang="x-default" href={frUrl.href} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Nocturne" />
    <meta property="og:title" content={title} />
    {description && <meta property="og:description" content={description} />}
    <meta property="og:url" content={canonical.href} />
    <meta property="og:image" content={ogImage.href} />
    <meta property="og:locale" content={ogLocale} />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    {description && <meta name="twitter:description" content={description} />}
    <meta name="twitter:image" content={ogImage.href} />
  </head>
  <body class="min-h-screen bg-space text-starlight">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-space-800 focus:px-4 focus:py-2 focus:text-starlight"
    >
      {t('a11y.skip')}
    </a>
    <Header lang={lang} />
    <main id="main" tabindex="-1">
      <slot />
    </main>
  </body>
</html>
```

- [ ] **Step 5: Verify** (PowerShell): `npx astro check` (0 errors), `npm run build` (success). Then confirm in `dist/index.html`: a `<link rel="canonical">`, `<link rel="alternate" hreflang="en">`, and `<meta property="og:image" content=".../og.png">` are present (e.g. `Select-String -Path dist/index.html -Pattern 'canonical','hreflang=.en.','og:image'`). `npm test` green.

- [ ] **Step 6: Commit** (og.png IS committed — brand asset, not git-ignored):
```bash
git add scripts/make-og.mjs public/og.png src/components/Layout.astro src/i18n/ui.ts
git commit -m "feat: add SEO, Open Graph, hreflang and a skip-to-content link" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 1)
- `public/og.png` is committed (NOT under the git-ignored `public/images/stations/`). The OG image is intentionally text-free (shapes only) so `sharp` renders it without any system-font dependency. fr/en key sets identical. The canonical/OG URLs use `Astro.site` (production URL) even when served from localhost — that's correct. After commit: clean tree, full `npm test` green.

---

## Task 2 : Sitemap + robots.txt

**Files:** modify `astro.config.mjs`; create `public/robots.txt`.

- [ ] **Step 1: Add the sitemap integration.** PowerShell (PATH refreshed): `npx astro add sitemap --yes`
  Expected: installs `@astrojs/sitemap` and adds `sitemap()` to `integrations` in `astro.config.mjs`.

- [ ] **Step 2: Configure i18n in the sitemap.** Ensure `astro.config.mjs` imports sitemap and configures it for the two locales. The `integrations` array must read EXACTLY:
```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://nocturne.pages.dev',
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    react(),
    sitemap({
      i18n: { defaultLocale: 'fr', locales: { fr: 'fr', en: 'en' } },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
```
(If `astro add` produced a slightly different shape, reconcile it to the above. Keep `react()` and the tailwind vite plugin.)

- [ ] **Step 3: Create `public/robots.txt`** with EXACTLY:
```
User-agent: *
Allow: /

Sitemap: https://nocturne.pages.dev/sitemap-index.xml
```

- [ ] **Step 4: Verify** (PowerShell): `npx astro check` (0 errors), `npm run build` (success). Confirm `dist/sitemap-index.xml` and `dist/sitemap-0.xml` exist (`Test-Path`), and that `dist/sitemap-0.xml` contains the atlas/gear/glossary/sky URLs. `npm test` green.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: add sitemap integration and robots.txt" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 2)
- Only the config + robots.txt change (plus the lockfile/package.json from `astro add`). After commit: clean tree, full `npm test` green.

---

## Task 3 : En-tête responsive (menu mobile) + accessibilité de la nav

**Files:** modify `src/components/Header.astro`, `src/styles/global.css`.

- [ ] **Step 1: Replace `src/components/Header.astro`** with EXACTLY (preserves all existing hrefs; adds a hamburger toggle for mobile, `aria-current` on the active link, and a small vanilla toggle script):
```astro
---
import { useTranslations, localizedPath } from '../i18n/utils';
import type { Lang } from '../i18n/ui';

interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const t = useTranslations(lang);
const path = Astro.url.pathname;

const otherLang: Lang = lang === 'fr' ? 'en' : 'fr';
const switchHref = localizedPath(path, otherLang);
const homeHref = lang === 'fr' ? '/' : '/en/';
const skyHref = lang === 'fr' ? '/sky' : '/en/sky';
const atlasHref = lang === 'fr' ? '/atlas' : '/en/atlas';
const gearHref = lang === 'fr' ? '/gear' : '/en/gear';
const glossaryHref = lang === 'fr' ? '/glossary' : '/en/glossary';

const isActive = (href: string) =>
  href === homeHref ? path === href : path === href || path.startsWith(`${href}/`);
const linkClass = (href: string) =>
  `hover:text-stellar ${isActive(href) ? 'text-stellar' : ''}`;
const current = (href: string) => (isActive(href) ? 'page' : undefined);
---

<header class="fixed inset-x-0 top-0 z-50 flex flex-wrap items-center justify-between gap-4 px-6 py-4 backdrop-blur-sm">
  <a href={homeHref} class="font-display text-xl tracking-wide text-starlight">{t('site.name')}</a>

  <button
    id="nav-toggle"
    type="button"
    aria-controls="nav-menu"
    aria-expanded="false"
    aria-label={t('nav.menu')}
    class="text-2xl leading-none text-starlight md:hidden"
  >
    ☰
  </button>

  <nav
    id="nav-menu"
    class="hidden w-full flex-col gap-4 text-sm text-muted md:flex md:w-auto md:flex-row md:flex-wrap md:items-center md:gap-6"
  >
    <a href={homeHref} class={linkClass(homeHref)} aria-current={current(homeHref)}>{t('nav.home')}</a>
    <a href={skyHref} class={linkClass(skyHref)} aria-current={current(skyHref)}>{t('nav.skymap')}</a>
    <a href={atlasHref} class={linkClass(atlasHref)} aria-current={current(atlasHref)}>{t('nav.atlas')}</a>
    <a href={gearHref} class={linkClass(gearHref)} aria-current={current(gearHref)}>{t('nav.gear')}</a>
    <a href={glossaryHref} class={linkClass(glossaryHref)} aria-current={current(glossaryHref)}>{t('nav.glossary')}</a>
    <a
      href={switchHref}
      class="rounded border border-white/15 px-2 py-1 text-starlight hover:border-stellar hover:text-stellar"
      hreflang={otherLang}
    >
      {otherLang.toUpperCase()}
    </a>
  </nav>
</header>

<script>
  const btn = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  btn?.addEventListener('click', () => {
    const willOpen = menu?.classList.contains('hidden') ?? false;
    menu?.classList.toggle('hidden', !willOpen);
    menu?.classList.toggle('flex', willOpen);
    btn.setAttribute('aria-expanded', String(willOpen));
  });
</script>
```

- [ ] **Step 2: Add a visible focus style to `src/styles/global.css`.** Append (do NOT remove existing content) this block at the end of the file:
```css
:focus-visible {
  outline: 2px solid var(--color-stellar);
  outline-offset: 2px;
}
```

- [ ] **Step 3: Verify** (PowerShell): `npx astro check` (0 errors), `npm run build` (success), `npm test` green. Then start `npm run dev`, and confirm at a narrow width the `☰` button shows and the menu is hidden until clicked; at desktop width the links show inline. Stop the server.

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "feat: make the header responsive with an accessible mobile menu" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 3)
- The nav base is `hidden ... md:flex`; the toggle swaps `hidden`↔`flex` so it stacks (flex-col) when opened on mobile and `md:flex` keeps it inline on desktop regardless. Keep ALL five nav links + the language switch. `aria-current="page"` marks the active section. The toggle button has `aria-controls`/`aria-expanded`/`aria-label`. Trailing newlines. After commit: clean tree, `npm test` green.

---

## Task 4 : Hygiène de performance (CLS images) + nettoyage

**Files:** modify `src/pages/atlas/[slug].astro`, `src/pages/en/atlas/[slug].astro`; remove the empty `src/components/sections/` directory if present.

- [ ] **Step 1: Constrain the atlas fiche hero image to avoid layout shift.** In BOTH `src/pages/atlas/[slug].astro` and `src/pages/en/atlas/[slug].astro`, change the hero `<img>` line:
  FROM:
  ```astro
        <img src={heroSrc} alt="" class="w-full rounded-lg object-cover" />
  ```
  TO:
  ```astro
        <img src={heroSrc} alt="" loading="lazy" decoding="async" class="aspect-[16/9] w-full rounded-lg object-cover" />
  ```
  (`aspect-[16/9]` reserves space so the image load doesn't shift the layout; `loading="lazy"`/`decoding="async"` defer offscreen work.)

- [ ] **Step 2: Remove the leftover empty `sections/` directory** (deleted components from Phase 2 left an empty folder; git doesn't track empty dirs, so this is disk tidiness only). PowerShell:
  `if (Test-Path src/components/sections) { Remove-Item src/components/sections -Recurse -Force }`

- [ ] **Step 3: Verify** (PowerShell): `npx astro check` (0 errors), `npm run build` (success), `npm test` green.

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "perf: reserve atlas hero image space and tidy empty dir" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

> **Note (manual, not automated):** a full Lighthouse audit needs a real browser run and is best done after deployment (`npx lighthouse https://nocturne.pages.dev --view`). The site is static with minimal JS (islands are `client:idle`/`client:load`), self-hosted fonts (no external requests), and now reserves image space — so it should score well; record any post-deploy findings as a follow-up.

## Guardrails (Task 4)
- Only the two fiche pages change (one `<img>` line each) plus the empty-dir cleanup. Do not touch other images. After commit: clean tree, `npm test` green.

---

## Task 5 : README de projet

**Files:** rewrite `README.md`.

- [ ] **Step 1: Replace `README.md`** with EXACTLY:
````md
# Nocturne 🌌

Un site web immersif et bilingue (FR/EN) sur l'**astronomie** et l'**astrophotographie** : un voyage en *scrollytelling*, une carte du ciel interactive, un atlas d'objets célestes, et des guides pratiques.

> An immersive, bilingual (FR/EN) astronomy & astrophotography website: a scrollytelling journey, an interactive sky map, an atlas of celestial objects, and practical guides.

## ✨ Fonctionnalités
- **Le Voyage** — page d'accueil en scrollytelling « cosmic zoom » (6 stations, parallax, fallback `prefers-reduced-motion`).
- **La Carte du ciel** — carte d'étoiles interactive sur Canvas (~921 étoiles + constellations), pan/zoom, panneau d'info au clic.
- **L'Atlas** — fiches détaillées par objet (vulgarisation + « pour aller plus loin » + conseils d'observation).
- **Le Coin Matériel** & **le Glossaire** — guides pratiques bilingues.
- **Phase de Lune du jour** — calculée côté navigateur, sans serveur.

## 🛠️ Stack
Astro 6 (statique, i18n FR/EN) · TypeScript · Tailwind CSS v4 · React 19 (îlots) · GSAP (scrollytelling) · Canvas 2D (carte du ciel) · `astronomy-engine` (phase de Lune) · Vitest + Playwright.

## 🚀 Démarrage
```bash
npm install
npm run dev        # http://localhost:4321
```

## 📜 Scripts
| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build statique dans `dist/` |
| `npm run preview` | Prévisualise le build |
| `npm test` | Tests unitaires (Vitest) |
| `npm run test:e2e` | Tests end-to-end (Playwright) |

## 📂 Structure
```
src/
  pages/         routes i18n (/ , /en/, /sky, /atlas, /atlas/[slug], /gear, /glossary)
  components/    composants Astro + îlots React (Starfield, SkyMap, MoonPhase…)
  content/       collections de contenu (objects, equipment, facts, glossary)
  data/          données du voyage + catalogue d'étoiles
  lib/           logique pure (astronomie, projection, champ d'étoiles)
  i18n/          dictionnaire + helpers bilingues
scripts/         générateurs d'assets (héros NASA, catalogue, image OG)
```

## 🖼️ Crédits
Images : NASA (domaine public). Catalogue d'étoiles & constellations : [d3-celestial](https://github.com/ofrohn/d3-celestial) (BSD-2).

## ☁️ Déploiement
Build statique → Cloudflare Pages. Voir [`DEPLOY.md`](./DEPLOY.md).
````

- [ ] **Step 2: Verify** the file is valid Markdown (it renders; no build impact). Optionally `npm run build` to confirm nothing broke.

- [ ] **Step 3: Commit**
```bash
git add README.md
git commit -m "docs: write a real project README" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 5)
- Only `README.md` changes. Keep the nested ```bash fences intact. Trailing newline.

---

## Task 6 : Tests e2e (SEO + menu mobile) + finalisation

**Files:** create `tests/e2e/seo.spec.ts`.

- [ ] **Step 1: Write `tests/e2e/seo.spec.ts`** with EXACTLY:
```ts
import { test, expect } from '@playwright/test';

test('home exposes canonical, hreflang and Open Graph meta', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /nocturne\.pages\.dev\/$/);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en\/?$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\.png$/);
});

test('the mobile menu toggles open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Menu' });
  await expect(toggle).toBeVisible();
  const atlasLink = page.getByRole('navigation').getByRole('link', { name: /Atlas/ });
  await expect(atlasLink).toBeHidden();
  await toggle.click();
  await expect(atlasLink).toBeVisible();
});
```

- [ ] **Step 2: Run the full e2e suite** (PowerShell, PATH refreshed): `npm run test:e2e`
  Expected: all pass — smoke (2) + voyage (3) + sky (3) + atlas (4) + seo (2) = 14 tests.
  If `getByRole('navigation').getByRole('link', { name: /Atlas/ })` is ambiguous (the language switch is also in the nav), it should still match only the Atlas link by name; if not, tighten to `{ name: /Atlas/, exact: false }` scoped further. The canonical/OG assertions read meta in `<head>` (attached, not "visible") — `toHaveAttribute` is correct. Do NOT weaken assertions to mask a real failure — report it.

- [ ] **Step 3: Commit**
```bash
git add tests/e2e/seo.spec.ts
git commit -m "test: add Playwright coverage for SEO meta and the mobile menu" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 4: Final gates** (PowerShell, PATH refreshed) — run and report exact output:
  - `npm test` → all unit pass (29).
  - `npx astro check` → 0 errors, 0 warnings.
  - `npm run test:e2e` → 14 pass.
  - `npm run build` → success; `dist/sitemap-index.xml`, `dist/og.png`, `dist/robots.txt` present.
  Confirm `git status` clean.

## Definition of Done (phase 5)
- Every page emits `<title>` + description, `<link rel="canonical">`, hreflang alternates (fr/en/x-default), and Open Graph + Twitter `summary_large_image` meta pointing at a committed `/og.png`.
- `sitemap-index.xml` + `robots.txt` are generated/served.
- The header is responsive: inline on desktop, a hamburger menu on mobile; the active section is marked `aria-current="page"`; a skip-to-content link and visible focus rings are in place.
- Atlas hero images reserve space (no layout shift); empty leftover dir removed; project `README.md` written.
- All gates green: unit (29), astro check, e2e (14), static build.

---

## Roadmap (suite)
- **Phase 6 — Temps réel** : couture `getTonightData()` réelle (passages **ISS**, **météo du ciel** selon la géolocalisation), **position réelle de la Lune et des planètes** sur la Carte du ciel, « qu'observer ce soir ». Dépend d'APIs externes (+ éventuelle fonction serverless) ; à faire idéalement après la mise en ligne.
- **Déploiement** (action utilisateur) : push GitHub + Cloudflare Pages (`DEPLOY.md`).
```
