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
