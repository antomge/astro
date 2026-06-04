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
