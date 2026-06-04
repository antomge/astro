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
