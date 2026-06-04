# Nocturne — Site immersif d'astronomie & d'astrophotographie

**Design / Spécification**
Date : 2026-06-04
Auteur : Antoine Megange (avec Claude)
Nom de travail : **Nocturne** *(modifiable)*

---

## 1. Vision & objectifs

Un site **de passion** sur l'astronomie et l'astrophotographie, à l'**expérience utilisateur hors du commun** (« effet waouh »), qui :

- **émerveille** le grand public débutant et **l'initie** en douceur ;
- **approfondit** pour les amateurs déjà initiés (réglages, matériel) ;
- mêle **vulgarisation**, **ressources/outils pratiques** et **culture générale** ;
- s'inscrit dans le **portfolio** d'Antoine (démonstration de compétences dev & design).

**Principe directeur :** un *contenu riche* servi par une *forme immersive et originale*.

L'âme du site repose sur **deux modes entrelacés** :
- **Le Voyage** (scrollytelling guidé, linéaire) → pour **s'émerveiller**.
- **La Carte du ciel** (exploration libre) → pour **approfondir**.

---

## 2. Public & langues

- **Langues : bilingue FR / EN** (sélecteur de langue, routage i18n).
- **Public double :**
  - *Débutant curieux* : on émerveille puis on initie en douceur.
  - *Amateur initié* : conseils matériel / réglages plus pointus.
- **Conséquence design : lecture en couches.** Chaque contenu propose une couche « vulgarisation » accessible **+** un volet « pour aller plus loin » pour les initiés.

---

## 3. Direction artistique

**Base : « Observatoire cinématographique »** avec une **touche « atlas céleste érudit »** sur la carte du ciel et les constellations.

- **Ambiance :** noir spatial profond ; vraies photos (NASA / ESO / Hubble / Webb, **libres de droits**) qui émergent du noir en plein écran.
- **Typographie :** un **serif d'affichage** élégant pour les titres (poétique, premium) + un **sans-serif technique** pour les données et réglages.
- **Couleurs :** fond espace profond ; deux accents lumineux — **cyan stellaire** et **ambre chaud** (lumière des étoiles).
- **Détails immersifs :** champ d'étoiles en **parallax**, léger **grain de pellicule**, **curseur personnalisé**, données discrètes en surimpression (façon HUD d'oculaire).
- **Touche érudite (sur la carte du ciel) :** **tracés de constellations dorés**, inspiration des planches d'atlas célestes classiques, modernisée.
- **Contrainte :** crédible et **intemporel** (on évite l'esthétique « gadget » qui vieillit vite) ; reste **accueillant pour le débutant**.

> Toutes les images de banques (NASA/ESO/…) doivent être **libres de droits** et affichées avec leur **crédit**.

---

## 4. Architecture de l'expérience

### 4.1 Le Voyage *(scrollytelling — page d'accueil immersive)*

Défilement vertical qui « décolle » à travers des **stations**. Chaque station = **visuel plein écran** + **vulgarisation courte** + bouton **« Approfondir »** qui bifurque vers l'Atlas / la Carte.

| # | Station | Contenu clé |
|---|---------|-------------|
| 0 | **Décollage** | La nuit, la Terre vue d'en haut, la pollution lumineuse, « pourquoi lever les yeux » (accroche émotionnelle). |
| 1 | **La Lune** | Ses **phases** (phase réelle du jour calculée), mers & cratères, comment l'observer / la photographier. |
| 2 | **Le Système solaire** | Planètes visibles (Saturne, Jupiter…), sécurité solaire. |
| 3 | **Étoiles & constellations** | Repérage, la Voie lactée → **transition vers la Carte du ciel**. |
| 4 | **Nébuleuses** | Pouponnières d'étoiles (Orion…), pourquoi ces couleurs. |
| 5 | **Galaxies / ciel profond** | Andromède, l'échelle du cosmos, vertige final. |

- Animations déclenchées au scroll (épinglage, *scrub*), avec **fallback `prefers-reduced-motion`** (version allégée, sans grandes animations).
- Des encarts **« Le saviez-vous ? »** (culture G) ponctuent le voyage.

### 4.2 La Carte du ciel *(exploration libre)*

- **Carte d'étoiles interactive** rendue sur **Canvas 2D** à partir d'un **vrai catalogue** (étoiles brillantes) + **données de tracés de constellations** (dorés, façon atlas).
- **Navigation :** pan / zoom ; **clic sur un objet → ouverture de sa fiche** (Atlas).
- Objets « mis en avant » cliquables (Lune, planètes, nébuleuses célèbres, etc.).
- **Accessibilité :** alternative navigable au clavier (liste d'objets / fiches accessibles sans la carte).

### 4.3 L'Atlas *(fiches détaillées)*

- Pages par **objet / sujet** (Lune, planètes, nébuleuses célèbres, galaxies…).
- **Bilingues**, en **lecture par couches** : « vulgarisation » **+** « pour aller plus loin » (initié).
- Chaque fiche : visuel **+ crédit**, description, **conseils d'observation / de photographie**.

### 4.4 Modules transversaux

- **Le Coin Matériel** *(tips & tricks d'astrophoto)* : jumelles / lunette / télescope / monture / capteur / filtres ; « par où commencer selon le budget » ; réglages de base (ISO, temps de pose, **règle des 500**, suivi) ; erreurs de débutant. **Lecture en couches** débutant → initié.
- **Le saviez-vous ?** *(culture G)* : facts distillés dans le Voyage **+** une collection à parcourir.
- **Phase de Lune du jour** : widget **calculé côté navigateur** (réel, sans serveur).
- **Glossaire bilingue** : magnitude, focale, échantillonnage, etc.

---

## 5. Périmètre

### 5.1 Inclus en v1
- Le Voyage (6 stations) avec scrollytelling + fallback reduced-motion.
- La Carte du ciel interactive (Canvas 2D, étoiles + constellations, clic → fiche).
- L'Atlas (fiches bilingues, lecture en couches) — un **lot initial** d'objets (voir §6.3).
- Le Coin Matériel, Le saviez-vous ?, le widget Phase de Lune, le Glossaire.
- Bilingue FR/EN complet, accessibilité, perf, SEO/partage.

### 5.2 Hors périmètre v1 *(reporté — mais l'architecture le prévoit)*
- **APIs temps réel** : « visible ce soir » selon la position, passages **ISS**, **météo du ciel**.
- Comptes utilisateurs, commentaires, CMS.
- **Galerie des propres photos** d'Antoine.
- Sound design.
- Système solaire **3D** (Three.js / WebGL).

> **Extensibilité :** des « coutures » en forme d'API sont posées dès la v1 (ex. `getTonightData()` renvoyant des données d'exemple) afin que le branchement de vraies APIs plus tard se limite à *remplir la fonction* (+ éventuelle fonction serverless), **sans re-architecture**.

---

## 6. Architecture technique

### 6.1 Stack
- **Astro** — framework orienté contenu : **zéro JS par défaut**, *islands* hydratés seulement là où c'est interactif → **perf maximale**. **i18n FR/EN intégré**, **collections de contenu typées**.
- **TypeScript** partout.
- **React** (`@astrojs/react`) pour les îlots interactifs (Carte du ciel, widget Lune, UI à état).
- **Tailwind CSS** + **design system maison** (tokens : palette espace profond, accents cyan/ambre, serif d'affichage + sans technique).
- **GSAP + ScrollTrigger** — scrollytelling (épinglage, animations *scrubbed*).
- **Canvas 2D** — champs d'étoiles parallax (Voyage) + Carte du ciel interactive.
- **astronomy-engine** *(librairie JS)* — calcul de la **phase de Lune réelle** côté navigateur, sans serveur.
- **Outillage :** ESLint + Prettier, npm, Vitest, Playwright.

### 6.2 Structure du projet *(indicative)*
```
src/
  pages/         # routes i18n : /fr, /en, voyage (accueil), carte, atlas/[slug], materiel, glossaire
  components/    # composants Astro + îlots React (SkyMap, MoonPhase, JourneyStation…)
  content/       # collections : objects, equipment, facts, glossary
  lib/           # astronomy (phase de Lune), sky-catalog (chargement/projection), data-seams (getTonightData…)
  styles/        # tokens du design system, config Tailwind
  i18n/          # traductions UI + helpers
public/          # images (+ crédits), catalogue d'étoiles (JSON), polices
tests/           # Vitest (logique) + Playwright (smoke e2e)
```

### 6.3 Modèle de contenu *(collections typées, bilingues)*
- **`objects`** (Atlas) : `slug`, `type` (lune | planète | nébuleuse | galaxie | étoile), champs **FR/EN** (titre, vulgarisation, « pour aller plus loin », conseils d'observation/photo), `image` + `credit`, métadonnées (magnitude, constellation…), `featuredOnSkyMap` (bool) + coordonnées pour la carte.
- **`equipment`** (Coin Matériel) : catégorie, niveau (débutant/initié), budget indicatif, contenu FR/EN.
- **`facts`** (Le saviez-vous ?) : texte FR/EN, station/objet associé éventuel, source.
- **`glossary`** : terme + définition FR/EN.
- **Lot initial v1 (objects)** : Lune ; planètes (Saturne, Jupiter, Mars, Vénus) ; nébuleuses (Orion M42, Aigle, …) ; galaxie d'Andromède. *(Liste finalisée au plan.)*

### 6.4 Données & calculs
- **Phase de Lune :** calcul **client** via `astronomy-engine` (date du jour, illumination, nom de phase). Aucune dépendance réseau.
- **Catalogue d'étoiles :** un sous-ensemble **d'étoiles brillantes** (magnitude limitée) + **lignes de constellations**, embarqué en **JSON** dans `public/`. Source à licence ouverte (ex. catalogue type HYG / lignes de constellations open data) — **vérifier la licence** et créditer.
- **Crédits images :** chaque image porte sa **source + licence** (NASA/ESO/Hubble/Webb, libres de droits).

### 6.5 i18n
- Routage Astro i18n `/fr/...` et `/en/...`, **sélecteur de langue** conservant la page courante.
- Contenu et chaînes d'UI traduits ; pas de contenu codé en dur non traduit.

---

## 7. Accessibilité, performance, SEO

- **Performance :** cible **Lighthouse 90+** ; images responsives ; lazy-loading des visuels lourds ; préchargement maîtrisé des polices.
- **Accessibilité :** **fallback `prefers-reduced-motion`** (Voyage et parallax) ; **navigation clavier** (Carte du ciel + Atlas) ; **textes alternatifs** + crédits ; contrastes suffisants sur fond sombre.
- **SEO & partage :** balises méta par page, **Open Graph** avec cartes de partage cosmiques, sitemap, hreflang FR/EN.

---

## 8. Stratégie de tests

- **Vitest** (logique pure) :
  - calcul de **phase de Lune** (valeurs attendues à des dates connues) ;
  - **projection** de la Carte du ciel (coordonnées célestes → écran) ;
  - **helpers i18n** ;
  - **validation des schémas** de collections de contenu.
- **Playwright** (smoke e2e) :
  - le **Voyage** charge et défile ;
  - le **changement de langue** fonctionne et conserve la page ;
  - une **fiche Atlas** s'ouvre depuis la Carte du ciel ;
  - le widget **Phase de Lune** s'affiche.
- Approche **pragmatique** : on teste la logique et les parcours critiques, pas le pixel.

---

## 9. Déploiement & domaine

- **Build statique** → **Cloudflare Pages** (gratuit, HTTPS, perf, CI sur push).
- **Domaine gratuit immédiat :** sous-domaine **`nocturne.pages.dev`** *(fallbacks : `nocturne-astro.pages.dev`, `astre-nocturne.pages.dev` — selon disponibilité)*.
- **Évolution (gratuit) :** via le **GitHub Student Developer Pack** (Antoine est étudiant à l'ESIEA), réclamer un **vrai domaine gratuit pendant 1 an** (ex. `.me` via Namecheap) et le brancher sur le même site — **sans changement d'architecture**.

---

## 10. Risques & points à surveiller

- **Charge de contenu bilingue** : écrire FR **et** EN double l'effort rédactionnel → commencer par un lot d'objets restreint (§6.3) et étendre.
- **Performance du scrollytelling** sur mobile / machines modestes → tester tôt, garder le fallback reduced-motion solide.
- **Licences** des images et du catalogue d'étoiles → vérifier et créditer systématiquement.
- **Carte du ciel** : périmètre v1 = carte **stylisée** (étoiles brillantes + constellations + objets mis en avant), **pas** un planétarium scientifique exhaustif.

---

## 11. Questions ouvertes *(à trancher au plan ou en cours de route)*
- Nom définitif (« Nocturne » est provisoire).
- Liste finale des objets de l'Atlas pour la v1.
- Choix des polices précises (serif d'affichage + sans technique).
- Source exacte du catalogue d'étoiles (licence).
