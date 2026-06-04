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
