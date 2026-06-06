# Nocturne — Phase 6A : « Immersion & portfolio » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unifier l'ambiance immersive sur tout le site (champ d'étoiles global, transitions de page fluides, grain de pellicule, curseur personnalisé sur la carte, indice de scroll) et finir le côté portfolio (pied de page + page « À propos »).

**Architecture :** Le `Layout` centralise l'immersion : il monte un `Starfield` global (déjà existant, `transition:persist` pour survivre aux navigations), active les **View Transitions** d'Astro (`ClientRouter`), et superpose une couche de grain. Les fonds de station deviennent translucides pour laisser voir le champ d'étoiles global. Les scripts client (`journey.ts`, header) passent sur l'évènement `astro:page-load` pour se ré-initialiser après chaque transition. Un `Footer` et une page `/about` complètent le portfolio.

**Tech Stack :** Astro 6 (`astro:transitions` / ClientRouter) · React 19 (îlots existants) · Tailwind v4 · GSAP · Vitest · Playwright.

**Référence :** suggestions validées avec l'utilisateur. S'appuie sur Phases 1–5 + les améliorations de la carte (mergées sur `main`).

> **Convention de commit :** terminer chaque message par `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` (second `-m`).
>
> **Quirk env :** `npm`/`npx`/`node` seulement via **PowerShell**, après :
> `$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')`
> Bash n'a pas npm. git fonctionne dans les deux.
> **Quirk Edit :** sur `ui.ts` (contient des guillemets typographiques), l'outil Edit peut convertir des délimiteurs ASCII en typographiques → après édition, `npm run build` ; corriger les délimiteurs en ASCII droit si esbuild se plaint. Préférer les chaînes en guillemets doubles pour les valeurs contenant une apostrophe.
> **Quirk e2e :** `npm run test:e2e` réutilise un éventuel serveur de dev déjà lancé (sinon il build+preview). Si un serveur de dev tourne, la barre d'outils dev d'Astro est présente — c'est pourquoi les sélecteurs sont restreints (`getByRole('banner')`, etc.).

---

## Structure des fichiers

```
public/grain.svg                 # NEW — texture de grain (feTurbulence)
public/reticle.svg               # NEW — curseur réticule de la carte
src/components/Layout.astro      # MODIFY — Starfield global + ClientRouter + grain + Footer
src/components/HomeJourney.astro # MODIFY — retire le Starfield local + ajoute l'indice de scroll
src/components/Station.astro     # MODIFY — fond de station translucide (laisse voir le starfield)
src/components/Footer.astro      # NEW — pied de page (crédits, GitHub, À propos)
src/scripts/journey.ts           # MODIFY — ré-init sur astro:page-load + nettoyage ScrollTrigger
src/pages/about.astro            # NEW — page À propos (FR)
src/pages/en/about.astro         # NEW — page À propos (EN)
src/i18n/ui.ts                   # MODIFY — clés home.scroll / nav.about / footer.* / about.*
tests/e2e/portfolio.spec.ts      # NEW — footer + page About + indice de scroll
```

---

## Task 1 : Champ d'étoiles global + grain (Layout) + fonds de station translucides

**Files:**
- Create: `public/grain.svg`
- Modify: `src/components/Layout.astro`, `src/components/HomeJourney.astro`, `src/components/Station.astro`

- [ ] **Step 1: Create `public/grain.svg`** with EXACTLY:
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
  </filter>
  <rect width="200" height="200" filter="url(#n)" />
</svg>
```

- [ ] **Step 2: Mount the global Starfield + grain in `src/components/Layout.astro`.** Add `import Starfield from './Starfield.tsx';` to the frontmatter imports. Then in the `<body>`, immediately AFTER the skip-link `<a>` and BEFORE `<Header lang={lang} />`, insert:
```astro
    <Starfield client:idle transition:persist="starfield" />
    <div
      aria-hidden="true"
      class="pointer-events-none fixed inset-0 z-[60] opacity-[0.035] [background-image:url('/grain.svg')] [background-size:180px]"
    >
    </div>
```
(The `Starfield` is `fixed inset-0 -z-10` — it sits behind all page content. `transition:persist="starfield"` keeps it alive across view transitions added in Task 2. The grain is a fixed, non-interactive overlay.)

- [ ] **Step 3: Remove the now-duplicated Starfield from `src/components/HomeJourney.astro`.** Delete the line:
```astro
  <Starfield client:idle />
```
and remove the now-unused `import Starfield from './Starfield.tsx';` from its frontmatter. (The global one in Layout covers the home too.)

- [ ] **Step 4: Make the station backgrounds translucent so the global starfield shows through.** In `src/components/Station.astro`, the background `<div data-anim="bg" ...>` currently has `class="absolute inset-0 -z-[1]"`. Change that class to:
```astro
    class="absolute inset-0 -z-[1] opacity-90"
```
(The opaque station gradient becomes 90% — enough to keep the cinematic colour while letting the drifting starfield peek through.)

- [ ] **Step 5: Verify** (PowerShell, PATH refreshed): `npx astro check` (0 errors), `npm run build` (success), `npm test` green. Then start `npm run dev` and confirm: every page (`/atlas`, `/gear`, `/glossary`, `/`) shows the subtle drifting starfield behind the content, and a faint grain texture overall. The home Voyage still shows stars behind its stations. Stop the server. Report observations.

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat: unify immersion with a site-wide starfield and film grain" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 1)
- The `Starfield` import path in Layout is `./Starfield.tsx`. `transition:persist="starfield"` needs a name so Astro can match the island across pages. Keep the grain `pointer-events-none` and very low opacity. The Station gradient is now 90% opacity — do not remove the gradient. After commit: clean tree, `npm test` green.

---

## Task 2 : Transitions de page (View Transitions) + ré-init des scripts

**Files:**
- Modify: `src/components/Layout.astro`, `src/scripts/journey.ts`, `src/components/Header.astro`

- [ ] **Step 1: Enable Astro View Transitions in `src/components/Layout.astro`.** Add to the frontmatter imports: `import { ClientRouter } from 'astro:transitions';`. Then in `<head>`, add `<ClientRouter />` as the LAST element before `</head>`.

- [ ] **Step 2: Re-initialise the GSAP journey on every page load in `src/scripts/journey.ts`.** Replace the bottom of the file:
  FROM:
  ```ts
  if (document.readyState !== 'loading') initJourney();
  else document.addEventListener('DOMContentLoaded', initJourney);
  ```
  TO:
  ```ts
  // Re-run on every (soft) navigation; kill stale triggers first.
  document.addEventListener('astro:page-load', () => {
    ScrollTrigger.getAll().forEach((t) => t.kill());
    initJourney();
  });
  ```
  (`astro:page-load` fires on the initial load AND after each view-transition navigation. Killing existing ScrollTriggers prevents duplicates when navigating back to the home.)

- [ ] **Step 3: Re-attach the header toggle on every page load in `src/components/Header.astro`.** Replace the existing `<script>` block:
  FROM:
  ```astro
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
  TO:
  ```astro
  <script>
    document.addEventListener('astro:page-load', () => {
      const btn = document.getElementById('nav-toggle');
      const menu = document.getElementById('nav-menu');
      btn?.addEventListener('click', () => {
        const willOpen = menu?.classList.contains('hidden') ?? false;
        menu?.classList.toggle('hidden', !willOpen);
        menu?.classList.toggle('flex', willOpen);
        btn.setAttribute('aria-expanded', String(willOpen));
      });
    });
  </script>
  ```

- [ ] **Step 4: Verify** (PowerShell): `npx astro check` (0 errors), `npm run build` (success), `npm test` green. Then `npm run dev`: navigate between pages (Voyage → Carte → Atlas → fiche → back) and confirm smooth crossfade transitions; confirm the Voyage scroll animations still work after navigating to the home, and the mobile hamburger still toggles after navigation. Stop the server. Report.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: add page transitions and re-init client scripts on navigation" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 2)
- `ClientRouter` must be the last child of `<head>`. The journey + header scripts MUST listen to `astro:page-load` (not `DOMContentLoaded`) so they re-init after soft navigation; the journey must kill stale ScrollTriggers first. The persisted `Starfield` (Task 1) keeps drifting across navigations. After commit: clean tree, `npm test` green.

---

## Task 3 : Curseur personnalisé (carte) + indice de scroll (accueil)

**Files:**
- Create: `public/reticle.svg`
- Modify: `src/components/SkyMap.tsx`, `src/components/HomeJourney.astro`, `src/i18n/ui.ts`

- [ ] **Step 1: Create `public/reticle.svg`** with EXACTLY:
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7fd8ff" stroke-width="1.5">
  <circle cx="12" cy="12" r="7" />
  <path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
</svg>
```

- [ ] **Step 2: Use the reticle cursor on the sky map canvas.** In `src/components/SkyMap.tsx`, the canvas `className` contains `cursor-grab`. Replace `cursor-grab` with `[cursor:url(/reticle.svg)_12_12,grab]` (the `grab` is the fallback for browsers without SVG-cursor support). The class list becomes:
```tsx
        className="fixed inset-0 z-0 h-screen w-full touch-none [cursor:url(/reticle.svg)_12_12,grab] bg-space"
```

- [ ] **Step 3: Add the `home.scroll` i18n key to `src/i18n/ui.ts`** (both blocks, identical key sets):
  - `fr`: `'home.scroll': 'Défiler',`
  - `en`: `'home.scroll': 'Scroll',`

- [ ] **Step 4: Add the scroll cue to `src/components/HomeJourney.astro`.** It already imports `useTranslations` and has `t`. Inside the `<Layout ...>` element, immediately AFTER the progress-bar `<div>` and BEFORE the `<div class="journey">`, insert:
```astro
  <div
    id="scroll-cue"
    class="pointer-events-none fixed bottom-6 left-1/2 z-30 -translate-x-1/2 text-center text-muted transition-opacity duration-500"
  >
    <span class="text-xs uppercase tracking-[0.3em]">{t('home.scroll')}</span>
    <div class="mt-1 animate-bounce text-lg" aria-hidden="true">↓</div>
  </div>
```
Then, in the existing `<script>` at the bottom of `HomeJourney.astro` (the one that does `import '../scripts/journey';`), change it to ALSO wire the cue on page load:
```astro
<script>
  import '../scripts/journey';

  document.addEventListener('astro:page-load', () => {
    const cue = document.getElementById('scroll-cue');
    if (!cue) return;
    const onScroll = () => {
      cue.style.opacity = window.scrollY > 80 ? '0' : '1';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  });
</script>
```

- [ ] **Step 5: Verify** (PowerShell): `npx astro check` (0 errors), `npm run build` (success), `npm test` green. `npm run dev`: on `/sky` the cursor is a cyan reticle; on `/` a "Défiler ↓" cue bounces at the bottom and fades when you scroll. Stop the server.

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat: add a reticle cursor on the sky map and a scroll cue on the home" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 3)
- The `animate-bounce` is a built-in Tailwind animation; the global `prefers-reduced-motion` block already neutralises it. fr/en key sets identical. The cue is `pointer-events-none` so it never blocks scrolling. After commit: clean tree, `npm test` green.

---

## Task 4 : Pied de page

**Files:**
- Create: `src/components/Footer.astro`
- Modify: `src/components/Layout.astro`, `src/i18n/ui.ts`

- [ ] **Step 1: Add footer i18n keys to `src/i18n/ui.ts`** (both blocks, identical sets):
  - `fr`:
    ```
    'nav.about': 'À propos',
    'footer.by': 'par',
    'footer.source': 'Code source',
    'footer.credits': 'Images : NASA (domaine public) · Étoiles & constellations : d3-celestial (BSD-2) · Calculs : astronomy-engine.',
    ```
  - `en`:
    ```
    'nav.about': 'About',
    'footer.by': 'by',
    'footer.source': 'Source code',
    'footer.credits': 'Images: NASA (public domain) · Stars & constellations: d3-celestial (BSD-2) · Computations: astronomy-engine.',
    ```

- [ ] **Step 2: Create `src/components/Footer.astro`** with EXACTLY:
```astro
---
import { useTranslations } from '../i18n/utils';
import type { Lang } from '../i18n/ui';

const { lang } = Astro.props as { lang: Lang };
const t = useTranslations(lang);
const year = new Date().getFullYear();
const aboutHref = lang === 'fr' ? '/about' : '/en/about';
---

<footer class="relative z-10 mt-24 border-t border-white/10 px-6 py-10 text-sm text-muted">
  <div class="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <p>
      © {year} Nocturne — {t('footer.by')}
      <a
        href="https://github.com/antomge"
        target="_blank"
        rel="noopener"
        class="text-stellar hover:underline"
      >
        Antoine Megange
      </a>
    </p>
    <nav class="flex flex-wrap gap-4">
      <a href={aboutHref} class="hover:text-stellar">{t('nav.about')}</a>
      <a
        href="https://github.com/antomge/astro"
        target="_blank"
        rel="noopener"
        class="hover:text-stellar"
      >
        {t('footer.source')}
      </a>
    </nav>
  </div>
  <p class="mx-auto mt-4 max-w-6xl text-xs text-muted/60">{t('footer.credits')}</p>
</footer>
```

- [ ] **Step 3: Mount the footer in `src/components/Layout.astro`.** Add `import Footer from './Footer.astro';` to the frontmatter imports. Then immediately AFTER the closing `</main>` and BEFORE `</body>`, add:
```astro
    <Footer lang={lang} />
```

- [ ] **Step 4: Verify** (PowerShell): `npx astro check` (0 errors), `npm run build` (success), `npm test` green. `npm run dev`: scroll to the bottom of `/atlas` (and the home, past the last station) → the footer shows with the credits, GitHub link and the About link. Stop the server.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: add a site footer with credits and links" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 4)
- The footer is `relative z-10` so it sits above the fixed starfield. It links to the real repo (`github.com/antomge/astro`) and the About page (built in Task 5). fr/en key sets identical. After commit: clean tree, `npm test` green.

---

## Task 5 : Page « À propos »

**Files:**
- Create: `src/pages/about.astro`, `src/pages/en/about.astro`
- Modify: `src/i18n/ui.ts`

- [ ] **Step 1: Add About i18n keys to `src/i18n/ui.ts`** (both blocks, identical sets):
  - `fr`:
    ```
    'about.lead': "Nocturne est un site de passion sur l'astronomie et l'astrophotographie : un voyage immersif, une carte du ciel interactive, et un atlas pour s'émerveiller et apprendre.",
    'about.whoTitle': 'Qui suis-je ?',
    'about.who': "Je suis Antoine Megange, étudiant ingénieur en informatique à l'ESIEA, passionné de photographie et de nouvelles technologies. J'ai créé Nocturne comme un projet de passion — et comme pièce de mon portfolio de développeur.",
    'about.techTitle': "Comment c'est fait",
    'about.tech': 'Site statique bilingue construit avec Astro, TypeScript et Tailwind CSS, avec des îlots React pour les parties interactives (carte du ciel, phase de Lune), GSAP pour le scrollytelling et astronomy-engine pour les calculs.',
    'about.creditsTitle': 'Crédits',
    'about.credits': "Images : NASA (domaine public). Catalogue d'étoiles et constellations : d3-celestial (licence BSD-2).",
    ```
  - `en`:
    ```
    'about.lead': 'Nocturne is a passion project about astronomy and astrophotography: an immersive journey, an interactive sky map and an atlas to wonder and learn.',
    'about.whoTitle': 'Who I am',
    'about.who': 'I am Antoine Megange, a computer-science engineering student at ESIEA, passionate about photography and new technologies. I built Nocturne as a passion project — and as a piece of my developer portfolio.',
    'about.techTitle': 'How it is built',
    'about.tech': 'A bilingual static site built with Astro, TypeScript and Tailwind CSS, with React islands for the interactive parts (sky map, moon phase), GSAP for the scrollytelling and astronomy-engine for the computations.',
    'about.creditsTitle': 'Credits',
    'about.credits': 'Images: NASA (public domain). Star and constellation catalogue: d3-celestial (BSD-2 licence).',
    ```
  > NOTE the apostrophes inside `about.techTitle` ("Comment c'est fait") and `about.credits` ("d'étoiles") — use DOUBLE-quoted JS strings as shown so the inner apostrophe is fine, and after editing run `npm run build`; if esbuild complains that a delimiter became a curly quote, fix the delimiter back to a straight `"`.

- [ ] **Step 2: Create `src/pages/about.astro`** with EXACTLY:
```astro
---
import Layout from '../components/Layout.astro';
import { useTranslations } from '../i18n/utils';

const lang = 'fr' as const;
const t = useTranslations(lang);
---

<Layout lang={lang} title={`${t('nav.about')} — ${t('site.name')}`} description={t('about.lead')}>
  <section class="mx-auto max-w-3xl px-6 pb-24 pt-28">
    <h1 class="font-display text-4xl text-starlight md:text-5xl">{t('nav.about')}</h1>
    <p class="mt-6 text-lg text-muted">{t('about.lead')}</p>

    <h2 class="mt-12 text-sm uppercase tracking-widest text-stellar">{t('about.whoTitle')}</h2>
    <p class="mt-2 text-starlight/90">{t('about.who')}</p>

    <h2 class="mt-10 text-sm uppercase tracking-widest text-stellar">{t('about.techTitle')}</h2>
    <p class="mt-2 text-starlight/90">{t('about.tech')}</p>

    <h2 class="mt-10 text-sm uppercase tracking-widest text-ember">{t('about.creditsTitle')}</h2>
    <p class="mt-2 text-starlight/90">{t('about.credits')}</p>
  </section>
</Layout>
```

- [ ] **Step 3: Create `src/pages/en/about.astro`** with EXACTLY (note `../../` imports and `lang = 'en'`):
```astro
---
import Layout from '../../components/Layout.astro';
import { useTranslations } from '../../i18n/utils';

const lang = 'en' as const;
const t = useTranslations(lang);
---

<Layout lang={lang} title={`${t('nav.about')} — ${t('site.name')}`} description={t('about.lead')}>
  <section class="mx-auto max-w-3xl px-6 pb-24 pt-28">
    <h1 class="font-display text-4xl text-starlight md:text-5xl">{t('nav.about')}</h1>
    <p class="mt-6 text-lg text-muted">{t('about.lead')}</p>

    <h2 class="mt-12 text-sm uppercase tracking-widest text-stellar">{t('about.whoTitle')}</h2>
    <p class="mt-2 text-starlight/90">{t('about.who')}</p>

    <h2 class="mt-10 text-sm uppercase tracking-widest text-stellar">{t('about.techTitle')}</h2>
    <p class="mt-2 text-starlight/90">{t('about.tech')}</p>

    <h2 class="mt-10 text-sm uppercase tracking-widest text-ember">{t('about.creditsTitle')}</h2>
    <p class="mt-2 text-starlight/90">{t('about.credits')}</p>
  </section>
</Layout>
```

- [ ] **Step 4: Verify** (PowerShell): `npx astro check` (0 errors), `npm run build` (success; `dist/about/index.html` + `dist/en/about/index.html` exist), `npm test` green. Confirm the footer's "À propos / About" link reaches the page and the language switch preserves it (`/about` ↔ `/en/about`).

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: add a bilingual About page" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 5)
- Pages use the same slug `/about` (FR) and `/en/about` (EN) so the language switch works. fr/en key sets identical. Trailing newlines. After commit: clean tree, `npm test` green.

---

## Task 6 : Tests e2e + finalisation

**Files:**
- Create: `tests/e2e/portfolio.spec.ts`

- [ ] **Step 1: Write `tests/e2e/portfolio.spec.ts`** with EXACTLY:
```ts
import { test, expect } from '@playwright/test';

test('the footer is present with the About and source links (FR home)', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: 'À propos' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Code source' })).toBeVisible();
});

test('the About page renders (FR and EN)', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'À propos', level: 1 })).toBeVisible();
  await expect(page.getByText('Antoine Megange')).toBeVisible();
  await page.goto('/en/about');
  await expect(page.getByRole('heading', { name: 'About', level: 1 })).toBeVisible();
});

test('the home shows a scroll cue', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#scroll-cue')).toBeVisible();
});
```

- [ ] **Step 2: Run the full e2e suite** (PowerShell, PATH refreshed): `npm run test:e2e`
  Expected: all pass — smoke (2) + voyage (3) + sky (3) + atlas (4) + seo (2) + portfolio (3) = 17 tests.
  NOTE: the footer link "À propos" also appears nowhere else on the home except the footer, but scope to `getByRole('contentinfo')` (the `<footer>`) as written to be safe. If a selector is ambiguous, tighten it; do NOT weaken an assertion to mask a real failure — report it. If view transitions interfere with a navigation assertion, prefer `await page.goto(...)` (full load) as written rather than link clicks.

- [ ] **Step 3: Commit**
```bash
git add tests/e2e/portfolio.spec.ts
git commit -m "test: cover the footer, About page and scroll cue" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 4: Final gates** (PowerShell, PATH refreshed) — run and report exact output:
  - `npm test` → all unit pass (expect 32).
  - `npx astro check` → 0 errors, 0 warnings.
  - `npm run test:e2e` → 17 pass.
  - `npm run build` → success; `dist/about/index.html` + `dist/en/about/index.html` present.
  Confirm `git status` clean.

## Definition of Done (phase 6A)
- A subtle drifting starfield + film grain appear behind every page (the home & sky keep their own immersion); the starfield persists across page navigations.
- Page-to-page navigation uses smooth Astro view transitions; the Voyage GSAP and the mobile menu re-initialise after navigation.
- The sky map shows a reticle cursor; the home shows a fading "Défiler/Scroll" cue.
- Every page has a footer (credits, GitHub, About); a bilingual `/about` page exists and is linked.
- All gates green: unit (32), astro check, e2e (17), static build.

---

## Roadmap (suite)
- **Phase 6B — Carte du ciel (fonctions)** : planètes cliquables (→ fiche Atlas pour Jupiter/Saturne), panneau de calques (constellations / noms / planètes / écliptique / recentrer), pincer-pour-zoomer (mobile), recherche « aller à un objet ».
- **Phase 6C — Contenu** : volet astrophoto (guide premiers pas), enrichissement de l'Atlas (plus d'objets + facts), prochaine pleine lune sur la station Lune.
- **Mise en ligne** : Cloudflare Pages (`DEPLOY.md`).
```
