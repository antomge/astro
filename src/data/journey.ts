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
  /** slug de la fiche Atlas associée (lien « Approfondir ») */
  atlasSlug?: string;
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
    atlasSlug: 'la-lune',
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
    atlasSlug: 'pleiades',
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
    atlasSlug: 'orion',
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
    atlasSlug: 'andromede',
    fact: {
      fr: 'Andromède contient environ mille milliards d’étoiles — quatre fois plus que notre Voie lactée.',
      en: 'Andromeda holds about a trillion stars — four times more than our Milky Way.',
    },
  },
];
