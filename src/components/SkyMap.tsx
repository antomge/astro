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
      view.centerRa += (dx / view.scale) * 60;
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
