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
