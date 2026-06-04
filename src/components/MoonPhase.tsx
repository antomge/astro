import { useMemo } from 'react';
import { getMoonInfo, type PhaseKey } from '../lib/astronomy';

interface Props {
  title: string;
  illuminationLabel: string;
  phaseLabels: Record<PhaseKey, string>;
}

export default function MoonPhase({ title, illuminationLabel, phaseLabels }: Props) {
  const info = useMemo(() => getMoonInfo(new Date()), []);
  const pct = Math.round(info.illumination * 100);

  // Décalage du disque d'ombre pour suggérer la phase (0 = pleine ombre à gauche).
  // Approximation visuelle ; le rendu fin du terminateur viendra plus tard.
  const waxing = info.phaseAngle < 180;
  const offset = (info.illumination * 2 - 1) * 100 * (waxing ? 1 : -1);

  return (
    <figure className="flex flex-col items-center gap-4">
      <svg
        viewBox="0 0 200 200"
        width="180"
        height="180"
        role="img"
        aria-label={`${phaseLabels[info.phaseKey]} — ${pct}%`}
      >
        <defs>
          <clipPath id="moon-clip">
            <circle cx="100" cy="100" r="90" />
          </clipPath>
          <radialGradient id="moon-surface" cx="40%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#f4f1e8" />
            <stop offset="100%" stopColor="#c9c4b4" />
          </radialGradient>
        </defs>
        <g clipPath="url(#moon-clip)">
          <circle cx="100" cy="100" r="90" fill="url(#moon-surface)" />
          {/* Ombre de phase */}
          <circle cx={100 + offset} cy="100" r="90" fill="#05070d" opacity="0.92" />
        </g>
        <circle cx="100" cy="100" r="90" fill="none" stroke="#7fd8ff" strokeOpacity="0.25" />
      </svg>
      <figcaption className="text-center">
        <p className="font-display text-2xl text-starlight">{title}</p>
        <p className="mt-1 text-stellar">{phaseLabels[info.phaseKey]}</p>
        <p className="text-sm text-muted">
          {illuminationLabel} : {pct}%
        </p>
      </figcaption>
    </figure>
  );
}
