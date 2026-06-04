# Nocturne — Phase 3 : « La Carte du ciel » (carte d'étoiles interactive) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une page « Carte du ciel » : une carte d'étoiles interactive (Canvas) à partir d'un vrai catalogue d'étoiles brillantes + tracés de constellations dorés, navigable au pan/zoom, où un clic (ou la liste accessible au clavier) sur un objet remarquable ouvre un panneau d'info bilingue.

**Architecture :** Les données du ciel (étoiles brillantes mag ≤ 4,5 + lignes de constellations) sont générées une fois depuis le jeu open-source **d3-celestial** (BSD-2) par un script et **committées** en JSON (`src/data/sky/`), donc le build est autonome (zéro dépendance réseau au runtime). Une logique de **projection stéréographique pure et testée** (`src/lib/skymap.ts`) convertit RA/Dec → pixels. Un îlot React Canvas (`SkyMap.tsx`) dessine étoiles + constellations + objets remarquables et gère pan/zoom + sélection ; un composant présentiel `SkyInfoPanel.tsx` affiche le contenu de l'objet (depuis la collection `objects` de Phase 1). Pages `/sky` (FR) et `/en/sky` (EN).

**Tech Stack :** Astro 6 · TypeScript · Tailwind v4 · React 19 (îlot Canvas) · données d3-celestial (BSD-2) · Vitest · Playwright.

**Référence :** spec §4.2/§4.3 (`docs/superpowers/specs/2026-06-04-nocturne-astronomy-site-design.md`). S'appuie sur Phases 1–2 (mergées sur `main`).

> **Décisions validées :** clic → **panneau d'info latéral** (bilingue, depuis `objects`) ; catalogue **réel** d'étoiles brillantes (mag ≤ 4,5) + constellations dorées, données **open-source créditées**, carte **stylisée** (pas un planétarium exhaustif), projection **stéréographique** + pan/zoom.
>
> **Convention de commit :** terminer chaque message par `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` (second `-m`).
>
> **Quirk env :** `npm`/`npx`/`node` seulement via **PowerShell**, après :
> `$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')`
> Bash n'a pas npm. git marche dans les deux.

---

## Structure des fichiers

```
scripts/fetch-sky.mjs            # NEW — génère le catalogue depuis d3-celestial (one-shot, sortie committée)
scripts/fetch-heroes.mjs         # MODIFY — ajoute pleiades.jpg
src/data/sky/stars.json          # NEW (committed) — étoiles brillantes {ra,dec,mag,name?}
src/data/sky/constellations.json # NEW (committed) — polylignes {name, lines:[[ [ra,dec], ... ]]}
src/lib/skymap.ts                # NEW — projection pure + types (Viewport, Projected, SkyObject, SkyLabels)
src/components/SkyInfoPanel.tsx   # NEW — drawer présentiel (contenu de l'objet)
src/components/SkyMap.tsx         # NEW — îlot Canvas (rendu + pan/zoom + sélection + liste accessible)
src/content/objects/orion.md      # NEW — objet remarquable (seed)
src/content/objects/andromede.md  # NEW — objet remarquable (seed)
src/content/objects/pleiades.md   # NEW — objet remarquable (seed)
src/pages/sky.astro              # NEW — page carte FR (/sky)
src/pages/en/sky.astro           # NEW — page carte EN (/en/sky)
src/components/Header.astro      # MODIFY — ajoute le lien de nav vers la carte
src/i18n/ui.ts                   # MODIFY — clés sky.* / atlas.* / ui.close
tests/unit/skymap.test.ts        # NEW — projection (TDD)
tests/unit/sky-data.test.ts      # NEW — validité des JSON committés
tests/e2e/sky.spec.ts            # NEW — page carte + panneau d'info (FR/EN)
```

---

## Task 1 : Catalogue d'étoiles (génération + données committées + test de forme)

**Files:**
- Create: `scripts/fetch-sky.mjs`, `src/data/sky/stars.json`, `src/data/sky/constellations.json`, `tests/unit/sky-data.test.ts`

- [ ] **Step 1: Write `scripts/fetch-sky.mjs`** with EXACTLY:
```js
// One-shot generator for the bright-star sky catalog used by the Sky Map.
// Source: d3-celestial by Olaf Frohn (BSD-2-Clause). https://github.com/ofrohn/d3-celestial
// Run: node scripts/fetch-sky.mjs   (network required; the JSON output is COMMITTED to the repo)
import { mkdir, writeFile } from 'node:fs/promises';

const OUT = 'src/data/sky';
const MAG_LIMIT = 4.5;
const STARS_URL = 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/stars.6.json';
const LINES_URL = 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json';

const norm = (lon) => ((lon % 360) + 360) % 360;

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

const starsGeo = await getJson(STARS_URL);
const stars = starsGeo.features
  .map((f) => ({
    ra: norm(f.geometry.coordinates[0]),
    dec: f.geometry.coordinates[1],
    mag: f.properties.mag,
    name: f.properties.name || undefined,
  }))
  .filter((s) => typeof s.mag === 'number' && s.mag <= MAG_LIMIT);

const linesGeo = await getJson(LINES_URL);
const constellations = linesGeo.features.map((f) => {
  const polys =
    f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates];
  return {
    name: f.properties?.name || f.id || 'unknown',
    lines: polys.map((poly) => poly.map(([lon, lat]) => [norm(lon), lat])),
  };
});

await mkdir(OUT, { recursive: true });
await writeFile(`${OUT}/stars.json`, JSON.stringify(stars));
await writeFile(`${OUT}/constellations.json`, JSON.stringify(constellations));
console.log(`Wrote ${stars.length} stars and ${constellations.length} constellations to ${OUT}/`);
```

- [ ] **Step 2: Run the generator** (PowerShell, PATH refreshed): `node scripts/fetch-sky.mjs`
  Expected: prints e.g. `Wrote ~500 stars and ~80 constellations to src/data/sky/`. The two JSON files now exist.
  IF a URL 404s or the JSON shape differs from what the script assumes (the script expects GeoJSON FeatureCollections with `features[].geometry.coordinates` and `features[].properties.mag`): inspect the actual file from the d3-celestial repo `data/` directory, correct the filename/field access, and report what you changed. If d3-celestial is entirely unreachable, report **BLOCKED** (the controller will supply a fallback dataset) — do NOT hand-fabricate a fake catalog.

- [ ] **Step 3: Write the data-shape test `tests/unit/sky-data.test.ts`** with EXACTLY:
```ts
import { describe, it, expect } from 'vitest';
import starsJson from '../../src/data/sky/stars.json';
import constellationsJson from '../../src/data/sky/constellations.json';

const stars = starsJson as { ra: number; dec: number; mag: number; name?: string }[];
const constellations = constellationsJson as { name: string; lines: number[][][] }[];

describe('sky catalog data', () => {
  it('has a non-trivial number of bright stars within valid bounds', () => {
    expect(Array.isArray(stars)).toBe(true);
    expect(stars.length).toBeGreaterThan(100);
    for (const s of stars.slice(0, 80)) {
      expect(s.ra).toBeGreaterThanOrEqual(0);
      expect(s.ra).toBeLessThan(360);
      expect(s.dec).toBeGreaterThanOrEqual(-90);
      expect(s.dec).toBeLessThanOrEqual(90);
      expect(typeof s.mag).toBe('number');
      expect(s.mag).toBeLessThanOrEqual(4.5);
    }
  });

  it('has constellation polylines of [ra,dec] points', () => {
    expect(Array.isArray(constellations)).toBe(true);
    expect(constellations.length).toBeGreaterThan(10);
    const c = constellations[0];
    expect(Array.isArray(c.lines)).toBe(true);
    expect(c.lines.length).toBeGreaterThan(0);
    const poly = c.lines[0];
    expect(Array.isArray(poly)).toBe(true);
    expect(poly[0]).toHaveLength(2);
  });
});
```

- [ ] **Step 4: Run the test** (PowerShell): `npm test -- tests/unit/sky-data.test.ts`
  Expected: PASS (2 tests). If it fails, the generated data is wrong — fix the generator and re-run Step 2, do NOT weaken the test.

- [ ] **Step 5: Commit** (the JSON data IS committed — it is now source data with a documented regenerator + license):
```bash
git add scripts/fetch-sky.mjs src/data/sky/stars.json src/data/sky/constellations.json tests/unit/sky-data.test.ts
git commit -m "feat: add bright-star sky catalog generated from d3-celestial (BSD-2)" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 1)
- The JSON files are COMMITTED (not git-ignored) — they are essential, self-contained source data. Credit d3-celestial (BSD-2) in the script header (already present).
- Do NOT add a `prebuild` step for sky data (unlike hero images, this data is committed and must not depend on the network at build).
- After commit: full `npm test` green, `git status` clean, `git rev-parse HEAD`/`HEAD~1`.

---

## Task 2 : Logique de projection (TDD)

**Files:**
- Create: `src/lib/skymap.ts`, `tests/unit/skymap.test.ts`

- [ ] **Step 1: Write the FAILING test `tests/unit/skymap.test.ts`** with EXACTLY:
```ts
import { describe, it, expect } from 'vitest';
import { project, type Viewport } from '../../src/lib/skymap';

const v: Viewport = { centerRa: 0, centerDec: 0, scale: 100, width: 800, height: 600 };

describe('project (stereographic)', () => {
  it('maps the view center to the canvas centre', () => {
    const p = project(0, 0, v);
    expect(p.x).toBeCloseTo(400);
    expect(p.y).toBeCloseTo(300);
    expect(p.visible).toBe(true);
  });

  it('places higher declination above the centre (smaller y)', () => {
    const p = project(0, 20, v);
    expect(p.y).toBeLessThan(300);
    expect(p.x).toBeCloseTo(400);
  });

  it('places increasing RA to the left (smaller x) under the flipped projection', () => {
    const p = project(20, 0, v);
    expect(p.x).toBeLessThan(400);
  });

  it('marks the antipode of the centre as not visible', () => {
    const p = project(180, 0, v);
    expect(p.visible).toBe(false);
  });
});
```

- [ ] **Step 2: Run, verify FAIL** (PowerShell): `npm test -- tests/unit/skymap.test.ts`
  Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/lib/skymap.ts`** with EXACTLY:
```ts
export interface Viewport {
  /** centre de vue */
  centerRa: number; // deg
  centerDec: number; // deg
  /** pixels par unité de projection (zoom) */
  scale: number;
  width: number; // px CSS
  height: number;
}

export interface Projected {
  x: number;
  y: number;
  visible: boolean;
}

/** Objet remarquable cliquable (déjà localisé par la page Astro) */
export interface SkyObject {
  slug: string;
  type: string;
  title: string;
  summary: string;
  deepDive: string;
  observingTips?: string;
  image: string;
  imageCredit: string;
  ra: number; // deg
  dec: number; // deg
}

/** Libellés d'UI passés à l'îlot (i18n centralisé côté Astro) */
export interface SkyLabels {
  deepDive: string;
  observingTips: string;
  close: string;
  hint: string;
  objectsHeading: string;
  mapLabel: string;
}

const D2R = Math.PI / 180;

/**
 * Projection stéréographique de coordonnées célestes vers le plan du canvas.
 * x est inversé pour que la RA croissante aille vers la GAUCHE (ciel vu à l'œil nu).
 * y du canvas va vers le bas, donc le nord (dec haute) donne un y plus petit.
 */
export function project(raDeg: number, decDeg: number, v: Viewport): Projected {
  const ra = raDeg * D2R;
  const dec = decDeg * D2R;
  const ra0 = v.centerRa * D2R;
  const dec0 = v.centerDec * D2R;
  const dRa = ra - ra0;
  const cosc = Math.sin(dec0) * Math.sin(dec) + Math.cos(dec0) * Math.cos(dec) * Math.cos(dRa);
  const k = 2 / (1 + cosc);
  const px = -k * Math.cos(dec) * Math.sin(dRa);
  const py = k * (Math.cos(dec0) * Math.sin(dec) - Math.sin(dec0) * Math.cos(dec) * Math.cos(dRa));
  return {
    x: v.width / 2 + px * v.scale,
    y: v.height / 2 - py * v.scale,
    visible: cosc > -0.2,
  };
}
```

- [ ] **Step 4: Run, verify PASS** (PowerShell): `npm test -- tests/unit/skymap.test.ts`
  Expected: PASS (4 tests).

- [ ] **Step 5: Commit**
```bash
git add src/lib/skymap.ts tests/unit/skymap.test.ts
git commit -m "feat: add stereographic sky projection with tests" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 2)
- ONLY the two files. Export `Viewport`, `Projected`, `SkyObject`, `SkyLabels`, `project` EXACTLY (Tasks 3–5 import them). TDD order. Trailing newlines. Full `npm test` green after commit.

---

## Task 3 : Panneau d'info (composant présentiel)

**Files:**
- Create: `src/components/SkyInfoPanel.tsx`

- [ ] **Step 1: Write `src/components/SkyInfoPanel.tsx`** with EXACTLY:
```tsx
import { useEffect, useState } from 'react';
import type { SkyObject, SkyLabels } from '../lib/skymap';

interface Props {
  object: SkyObject;
  labels: SkyLabels;
  onClose: () => void;
}

export default function SkyInfoPanel({ object, labels, onClose }: Props) {
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <aside
      role="dialog"
      aria-label={object.title}
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-white/10 bg-space-800 p-6 shadow-2xl"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={labels.close}
        className="absolute right-4 top-4 text-xl text-muted hover:text-stellar"
      >
        ✕
      </button>

      {imgOk && (
        <img
          src={object.image}
          alt=""
          aria-hidden="true"
          onError={() => setImgOk(false)}
          className="mb-4 h-40 w-full rounded object-cover opacity-80"
        />
      )}

      <h2 className="font-display text-3xl text-starlight">{object.title}</h2>
      {object.imageCredit && <p className="mt-1 text-[10px] text-muted/70">© {object.imageCredit}</p>}

      <p className="mt-4 text-muted">{object.summary}</p>

      <h3 className="mt-6 text-xs uppercase tracking-widest text-stellar">{labels.deepDive}</h3>
      <p className="mt-1 text-sm text-starlight/90">{object.deepDive}</p>

      {object.observingTips && (
        <>
          <h3 className="mt-6 text-xs uppercase tracking-widest text-ember">{labels.observingTips}</h3>
          <p className="mt-1 text-sm text-starlight/90">{object.observingTips}</p>
        </>
      )}
    </aside>
  );
}
```

- [ ] **Step 2: Verify types** (PowerShell): `npx astro check`
  Expected: 0 errors attributable to `SkyInfoPanel.tsx`. Report counts.

- [ ] **Step 3: Commit**
```bash
git add src/components/SkyInfoPanel.tsx
git commit -m "feat: add sky object info panel component" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 3)
- ONLY `SkyInfoPanel.tsx`. Default export `SkyInfoPanel`. Escape-to-close + a labelled close button are required for accessibility. Image hides itself on error (`onError`). Trailing newline. Clean tree.

---

## Task 4 : Îlot Carte du ciel (Canvas + pan/zoom + sélection)

**Files:**
- Create: `src/components/SkyMap.tsx`

- [ ] **Step 1: Write `src/components/SkyMap.tsx`** with EXACTLY:
```tsx
import { useEffect, useRef, useState } from 'react';
import { project, type Viewport, type SkyObject, type SkyLabels } from '../lib/skymap';
import SkyInfoPanel from './SkyInfoPanel.tsx';
import starsJson from '../data/sky/stars.json';
import constellationsJson from '../data/sky/constellations.json';

interface CatalogStar { ra: number; dec: number; mag: number; name?: string }
interface Constellation { name: string; lines: number[][][] }

const stars = starsJson as CatalogStar[];
const constellations = constellationsJson as Constellation[];

interface Props {
  objects: SkyObject[];
  labels: SkyLabels;
}

export default function SkyMap({ objects, labels }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef({ centerRa: 90, centerDec: 20, scale: 340 });
  const sizeRef = useRef({ width: 0, height: 0 });
  const [selected, setSelected] = useState<SkyObject | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const vp = (): Viewport => ({
      centerRa: viewRef.current.centerRa,
      centerDec: viewRef.current.centerDec,
      scale: viewRef.current.scale,
      width: sizeRef.current.width,
      height: sizeRef.current.height,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      sizeRef.current = { width: rect.width, height: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const v = vp();
      ctx.clearRect(0, 0, v.width, v.height);
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, v.width, v.height);

      // Constellations (dorées, façon atlas)
      ctx.strokeStyle = 'rgba(255, 182, 115, 0.45)';
      ctx.lineWidth = 1;
      for (const c of constellations) {
        for (const poly of c.lines) {
          ctx.beginPath();
          let started = false;
          for (const [ra, dec] of poly) {
            const p = project(ra, dec, v);
            if (!p.visible) {
              started = false;
              continue;
            }
            if (!started) {
              ctx.moveTo(p.x, p.y);
              started = true;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          }
          ctx.stroke();
        }
      }

      // Étoiles (taille/opacité selon la magnitude)
      ctx.fillStyle = '#e8edf7';
      for (const s of stars) {
        const p = project(s.ra, s.dec, v);
        if (!p.visible) continue;
        ctx.globalAlpha = Math.min(1, Math.max(0.25, (5 - s.mag) / 4));
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, (5 - s.mag) * 0.55), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Objets remarquables (anneaux cyan)
      ctx.strokeStyle = '#7fd8ff';
      ctx.lineWidth = 1.5;
      for (const o of objects) {
        const p = project(o.ra, o.dec, v);
        if (!p.visible) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    let raf = 0;
    const scheduleDraw = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const view = viewRef.current;
      // Sensibilité approximative (px -> deg). Signes choisis pour un drag "naturel".
      view.centerRa -= (dx / view.scale) * 60;
      view.centerDec = Math.max(-89, Math.min(89, view.centerDec + (dy / view.scale) * 60));
      scheduleDraw();
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const view = viewRef.current;
      view.scale = Math.max(140, Math.min(1500, view.scale * (e.deltaY < 0 ? 1.1 : 0.9)));
      scheduleDraw();
    };
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const v = vp();
      let best: SkyObject | null = null;
      let bestD = 20;
      for (const o of objects) {
        const p = project(o.ra, o.dec, v);
        if (!p.visible) continue;
        const d = Math.hypot(p.x - cx, p.y - cy);
        if (d < bestD) {
          bestD = d;
          best = o;
        }
      }
      if (best) setSelected(best);
    };
    const onResize = () => {
      resize();
      scheduleDraw();
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
    };
  }, [objects]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={labels.mapLabel}
        className="block h-[70vh] w-full touch-none cursor-grab rounded-lg border border-white/10 bg-space"
      />
      <p className="mt-3 text-sm text-muted">{labels.hint}</p>

      <div className="mt-4">
        <h2 className="text-sm uppercase tracking-widest text-stellar">{labels.objectsHeading}</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {objects.map((o) => (
            <li key={o.slug}>
              <button
                type="button"
                onClick={() => setSelected(o)}
                className="rounded border border-white/15 px-3 py-1 text-sm text-starlight hover:border-stellar hover:text-stellar"
              >
                {o.title}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selected && <SkyInfoPanel object={selected} labels={labels} onClose={() => setSelected(null)} />}
    </div>
  );
}
```
NOTE (interaction tuning, not a placeholder): the pan sensitivity (`* 60`), zoom factors, hit radius (`20`), and star sizing are complete runnable values. During visual verification you MAY adjust these numbers and, if a drag feels inverted, flip a sign on the `centerRa`/`centerDec` updates — but keep the structure, the projection usage, the click hit-test, the accessible `<button>` list, and the `SkyInfoPanel` wiring intact.

- [ ] **Step 2: Verify** (PowerShell): `npx astro check` then `npm run build`
  Expected: `astro check` 0 errors; `npm run build` succeeds. (SkyMap isn't mounted in a page yet — Task 5 — but it is type-checked.) Report counts.

- [ ] **Step 3: Commit**
```bash
git add src/components/SkyMap.tsx
git commit -m "feat: add interactive sky map canvas island" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 4)
- ONLY `SkyMap.tsx`. Default export `SkyMap`. Imports the committed JSON from `../data/sky/`. Provides BOTH a canvas (mouse/touch) AND an accessible `<button>` list (keyboard) that open the same panel — keep both. `touch-none` on the canvas. No new deps. Trailing newline. Clean tree.

---

## Task 5 : Objets remarquables, pages `/sky`, nav & i18n (intégration)

**Files:**
- Create: `src/content/objects/orion.md`, `src/content/objects/andromede.md`, `src/content/objects/pleiades.md`
- Create: `src/pages/sky.astro`, `src/pages/en/sky.astro`
- Modify: `src/components/Header.astro`, `src/i18n/ui.ts`, `scripts/fetch-heroes.mjs`

- [ ] **Step 1: Add the three featured objects** (reuse the Phase-1 `objects` schema: `type`, `title`, `summary`, `deepDive`, `observingTips?`, `image`, `imageCredit`, `featuredOnSkyMap`, `skyCoords{raHours,decDeg}`).

`src/content/objects/orion.md`:
```md
---
type: nebula
title: { fr: "La nébuleuse d'Orion", en: "The Orion Nebula" }
summary:
  fr: "La nébuleuse d'Orion (M42) est la pouponnière d'étoiles la plus proche de nous, visible à l'œil nu sous l'épée d'Orion."
  en: "The Orion Nebula (M42) is the closest stellar nursery to us, visible to the naked eye below Orion's sword."
deepDive:
  fr: "Située à ~1 350 années-lumière, elle abrite des milliers d'étoiles en formation. Ses teintes rouges et bleues révèlent l'hydrogène et l'oxygène excités par les jeunes étoiles massives du Trapèze."
  en: "About 1,350 light-years away, it hosts thousands of forming stars. Its red and blue hues reveal hydrogen and oxygen excited by the young massive stars of the Trapezium."
observingTips:
  fr: "Visible de l'hiver au printemps. Aux jumelles, cherchez la tache floue sous les trois étoiles du baudrier ; un téléobjectif + quelques poses révèlent ses couleurs."
  en: "Visible from winter to spring. With binoculars, look for the fuzzy patch below the three belt stars; a telephoto lens plus a few exposures reveals its colours."
image: "/images/stations/orion.jpg"
imageCredit: "NASA"
featuredOnSkyMap: true
skyCoords: { raHours: 5.59, decDeg: -5.39 }
---
```

`src/content/objects/andromede.md`:
```md
---
type: galaxy
title: { fr: "La galaxie d'Andromède", en: "The Andromeda Galaxy" }
summary:
  fr: "Andromède (M31) est la grande galaxie spirale la plus proche, et l'objet le plus lointain visible à l'œil nu."
  en: "Andromeda (M31) is the nearest large spiral galaxy, and the most distant object visible to the naked eye."
deepDive:
  fr: "À 2,5 millions d'années-lumière, elle contient environ mille milliards d'étoiles. Elle fonce vers la Voie lactée et fusionnera avec elle dans ~4,5 milliards d'années."
  en: "At 2.5 million light-years, it holds about a trillion stars. It is racing toward the Milky Way and will merge with it in ~4.5 billion years."
observingTips:
  fr: "Repérez-la dans la constellation d'Andromède, près de Cassiopée. Sous un ciel sombre, elle apparaît comme une ovale laiteuse — privilégiez la vision décalée."
  en: "Find it in the constellation Andromeda, near Cassiopeia. Under a dark sky it appears as a milky oval — use averted vision."
image: "/images/stations/andromeda.jpg"
imageCredit: "NASA"
featuredOnSkyMap: true
skyCoords: { raHours: 0.712, decDeg: 41.27 }
---
```

`src/content/objects/pleiades.md`:
```md
---
type: star
title: { fr: "Les Pléiades", en: "The Pleiades" }
summary:
  fr: "Les Pléiades (M45) sont un amas d'étoiles jeunes et bleutées, parmi les plus beaux objets du ciel d'hiver."
  en: "The Pleiades (M45) are a cluster of young, bluish stars — among the most beautiful sights of the winter sky."
deepDive:
  fr: "Cet amas ouvert d'environ 100 millions d'années se trouve à ~440 années-lumière. La plupart des gens en distinguent six ou sept étoiles à l'œil nu ; des jumelles en révèlent des dizaines."
  en: "This open cluster, about 100 million years old, lies ~440 light-years away. Most people see six or seven stars with the naked eye; binoculars reveal dozens."
observingTips:
  fr: "Faciles à trouver dans le Taureau, au-dessus d'Orion. Idéales aux jumelles ; en photo, de courtes poses font ressortir le voile bleu de poussière."
  en: "Easy to find in Taurus, above Orion. Ideal in binoculars; in photos, short exposures bring out the blue dust veil."
image: "/images/stations/pleiades.jpg"
imageCredit: "NASA"
featuredOnSkyMap: true
skyCoords: { raHours: 3.79, decDeg: 24.1 }
---
```

- [ ] **Step 2: Add `pleiades.jpg` to the hero downloader** so the Pleiades image is available (the others reuse existing Phase-2 station images). In `scripts/fetch-heroes.mjs`, add this entry to the `SUBJECTS` object (keep the existing entries):
```js
  'pleiades.jpg': 'Pleiades star cluster',
```

- [ ] **Step 3: Add i18n keys to `src/i18n/ui.ts`** — add these keys to BOTH the `fr` and `en` blocks (keep all existing keys; fr/en key sets must stay identical):
  - `fr`:
    ```
    'sky.intro': "Promenez-vous dans le ciel : glissez pour vous déplacer, la molette pour zoomer. Cliquez sur un objet remarquable (anneaux cyan) ou choisissez-le dans la liste.",
    'sky.hint': 'Glissez pour explorer · molette pour zoomer · cliquez un objet cyan',
    'sky.objects': 'Objets remarquables',
    'sky.maplabel': 'Carte du ciel interactive',
    'atlas.deepDive': 'Pour aller plus loin',
    'atlas.observing': "Conseils d'observation",
    'ui.close': 'Fermer',
    ```
  - `en`:
    ```
    'sky.intro': 'Wander the night sky: drag to move, scroll to zoom. Click a featured object (cyan rings) or pick it from the list.',
    'sky.hint': 'Drag to explore · scroll to zoom · click a cyan object',
    'sky.objects': 'Featured objects',
    'sky.maplabel': 'Interactive sky map',
    'atlas.deepDive': 'Going further',
    'atlas.observing': 'Observing tips',
    'ui.close': 'Close',
    ```

- [ ] **Step 4: Create `src/pages/sky.astro`** with EXACTLY:
```astro
---
import Layout from '../components/Layout.astro';
import SkyMap from '../components/SkyMap.tsx';
import { getCollection } from 'astro:content';
import { useTranslations } from '../i18n/utils';
import type { SkyObject, SkyLabels } from '../lib/skymap';

const lang = 'fr' as const;
const t = useTranslations(lang);

const all = await getCollection('objects');
const objects: SkyObject[] = all
  .filter((e) => e.data.featuredOnSkyMap && e.data.skyCoords)
  .map((e) => ({
    slug: e.id,
    type: e.data.type,
    title: e.data.title[lang],
    summary: e.data.summary[lang],
    deepDive: e.data.deepDive[lang],
    observingTips: e.data.observingTips?.[lang],
    image: e.data.image,
    imageCredit: e.data.imageCredit,
    ra: e.data.skyCoords!.raHours * 15,
    dec: e.data.skyCoords!.decDeg,
  }));

const labels: SkyLabels = {
  deepDive: t('atlas.deepDive'),
  observingTips: t('atlas.observing'),
  close: t('ui.close'),
  hint: t('sky.hint'),
  objectsHeading: t('sky.objects'),
  mapLabel: t('sky.maplabel'),
};
---

<Layout lang={lang} title={`${t('site.name')} — ${t('nav.skymap')}`}>
  <section class="mx-auto max-w-6xl px-6 pb-24 pt-28">
    <h1 class="font-display text-4xl text-starlight md:text-5xl">{t('nav.skymap')}</h1>
    <p class="mt-4 max-w-2xl text-muted">{t('sky.intro')}</p>
    <div class="mt-8">
      <SkyMap client:load objects={objects} labels={labels} />
    </div>
  </section>
</Layout>
```

- [ ] **Step 5: Create `src/pages/en/sky.astro`** — EXACTLY the same as Step 4 BUT change the first frontmatter lines' imports to the parent directory and `lang` to `'en'`:
```astro
---
import Layout from '../../components/Layout.astro';
import SkyMap from '../../components/SkyMap.tsx';
import { getCollection } from 'astro:content';
import { useTranslations } from '../../i18n/utils';
import type { SkyObject, SkyLabels } from '../../lib/skymap';

const lang = 'en' as const;
const t = useTranslations(lang);

const all = await getCollection('objects');
const objects: SkyObject[] = all
  .filter((e) => e.data.featuredOnSkyMap && e.data.skyCoords)
  .map((e) => ({
    slug: e.id,
    type: e.data.type,
    title: e.data.title[lang],
    summary: e.data.summary[lang],
    deepDive: e.data.deepDive[lang],
    observingTips: e.data.observingTips?.[lang],
    image: e.data.image,
    imageCredit: e.data.imageCredit,
    ra: e.data.skyCoords!.raHours * 15,
    dec: e.data.skyCoords!.decDeg,
  }));

const labels: SkyLabels = {
  deepDive: t('atlas.deepDive'),
  observingTips: t('atlas.observing'),
  close: t('ui.close'),
  hint: t('sky.hint'),
  objectsHeading: t('sky.objects'),
  mapLabel: t('sky.maplabel'),
};
---

<Layout lang={lang} title={`${t('site.name')} — ${t('nav.skymap')}`}>
  <section class="mx-auto max-w-6xl px-6 pb-24 pt-28">
    <h1 class="font-display text-4xl text-starlight md:text-5xl">{t('nav.skymap')}</h1>
    <p class="mt-4 max-w-2xl text-muted">{t('sky.intro')}</p>
    <div class="mt-8">
      <SkyMap client:load objects={objects} labels={labels} />
    </div>
  </section>
</Layout>
```

- [ ] **Step 6: Add the Sky Map link to `src/components/Header.astro`**
  In the frontmatter (after `homeHref`), add: `const skyHref = lang === 'fr' ? '/sky' : '/en/sky';`
  In the `<nav>`, add this link BEFORE the language-switch `<a>` (after the home link):
  ```astro
  <a href={skyHref} class="hover:text-stellar">{t('nav.skymap')}</a>
  ```

- [ ] **Step 7: Build & verify** (PowerShell, PATH refreshed):
  - `npx astro check` → 0 errors.
  - `npm run build` → success (prebuild downloads heroes incl. pleiades.jpg); produces `dist/sky/index.html` and `dist/en/sky/index.html`.
  - Confirm with `Test-Path dist/sky/index.html` and `Test-Path dist/en/sky/index.html` (both True).
  - `npm test` → all unit tests pass.

- [ ] **Step 8: Commit**
```bash
git add -A
git commit -m "feat: add sky map pages, featured objects, nav link and i18n" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Guardrails (Task 5)
- The `objects` schema is unchanged; reuse it. `skyCoords.raHours` is hours → multiply by 15 for degrees (done in the page). FR/EN `ui.ts` key sets must stay identical. The page uses `client:load` so the canvas hydrates and the accessible object list is server-rendered. Trailing newlines. After commit: `git status` clean (downloaded `.jpg` still git-ignored), `git rev-parse HEAD`/`HEAD~1`.

---

## Task 6 : Tests e2e + finalisation

**Files:**
- Create: `tests/e2e/sky.spec.ts`

- [ ] **Step 1: Write `tests/e2e/sky.spec.ts`** with EXACTLY:
```ts
import { test, expect } from '@playwright/test';

test('French sky map loads with the canvas and featured-object buttons', async ({ page }) => {
  await page.goto('/sky');
  await expect(page.getByRole('heading', { name: 'La Carte du ciel' })).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Orion' })).toBeVisible();
});

test('selecting a featured object opens and closes the info panel', async ({ page }) => {
  await page.goto('/sky');
  await page.getByRole('button', { name: 'Orion' }).click();
  await expect(page.getByText('Pour aller plus loin')).toBeVisible();
  await page.getByRole('button', { name: 'Fermer' }).click();
  await expect(page.getByText('Pour aller plus loin')).toBeHidden();
});

test('English sky map renders and lists the featured objects', async ({ page }) => {
  await page.goto('/en/sky');
  await expect(page.getByRole('heading', { name: 'The Sky Map' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Orion' })).toBeVisible();
});
```

- [ ] **Step 2: Run the full e2e suite** (PowerShell, PATH refreshed): `npm run test:e2e`
  Expected: all pass — the existing smoke (2) + voyage (3) + the new sky (3) = 8 tests.
  If `getByRole('button', { name: 'Orion' })` is ambiguous (matches more than one), scope it with `.first()`. If the panel text assertion fails, confirm the object's `deepDive` label "Pour aller plus loin" is rendered (it comes from `atlas.deepDive`). Do NOT weaken assertions to paper over a real failure — report it.

- [ ] **Step 3: Commit**
```bash
git add tests/e2e/sky.spec.ts
git commit -m "test: add Playwright coverage for the sky map and info panel" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 4: Final gates** (PowerShell, PATH refreshed):
  - `npm test` → all unit pass (i18n, schemas, astronomy, journey, starfield, skymap, sky-data).
  - `npx astro check` → 0 errors, 0 warnings.
  - `npm run test:e2e` → 8 pass.
  - `npm run build` → success.
  Report exact counts. Confirm `git status` clean.

## Definition of Done (phase 3)
- `/sky` (FR) and `/en/sky` (EN) render a navigable star map (pan/zoom) with bright stars + golden constellation lines from committed open-data.
- Featured objects (Orion, Andromeda, Pleiades) are clickable on the canvas AND reachable via an accessible keyboard button list; selecting one opens a bilingual info panel (summary + "pour aller plus loin" + observing tips) that closes via button or Escape.
- Header has a Sky Map nav link; language switch preserves the page.
- All gates green: unit (incl. skymap + sky-data), astro check, e2e (8), static build. Sky data is committed and network-independent.

---

## Roadmap (suite)
- **Phase 4 — Atlas & modules** : routes `atlas/[slug]` (réutilisent `objects`), Coin Matériel, facts browser, glossaire ; le panneau d'info gagnera un lien « fiche complète » vers l'Atlas ; le bouton « Approfondir » des stations du Voyage y pointera aussi.
- **Phase 5 — Finitions** : SEO/OG, sitemap/hreflang, perf Lighthouse 90+, couture `getTonightData()` (ISS, météo du ciel), affichage de la position réelle de la Lune/planètes sur la carte.
