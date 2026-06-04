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
