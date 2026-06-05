import { useEffect, useRef, useState } from 'react';
import { project, type Viewport, type SkyObject, type SkyLabels } from '../lib/skymap';
import { generateStars } from '../lib/starfield';
import SkyInfoPanel from './SkyInfoPanel.tsx';
import starsJson from '../data/sky/stars.json';
import constellationsJson from '../data/sky/constellations.json';

interface CatalogStar { ra: number; dec: number; mag: number; name?: string }
interface Constellation { name: string; lines: number[][][] }

const catalog = starsJson as CatalogStar[];
const constellations = constellationsJson as Constellation[];

// Immersive procedural depth starfield (independent of the real catalog) — gives
// the "inside a galaxy / travelling through the stars" feeling behind the map.
const DEPTH_LAYERS = 4;
const depthStars = generateStars(700, 99, DEPTH_LAYERS);

// Soft galactic haze.
const nebulae = [
  { x: 0.22, y: 0.28, r: 0.55, color: 'rgba(127, 216, 255, 0.07)' },
  { x: 0.78, y: 0.66, r: 0.6, color: 'rgba(168, 130, 255, 0.06)' },
  { x: 0.5, y: 0.9, r: 0.5, color: 'rgba(255, 182, 115, 0.04)' },
];

interface Props {
  objects: SkyObject[];
  labels: SkyLabels;
}

export default function SkyMap({ objects, labels }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef({ centerRa: 90, centerDec: 20, scale: 340 });
  const sizeRef = useRef({ width: 0, height: 0 });
  const bgRef = useRef({ x: 0, y: 0 }); // background drift / parallax offset
  const [selected, setSelected] = useState<SkyObject | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const vp = (): Viewport => ({
      centerRa: viewRef.current.centerRa,
      centerDec: viewRef.current.centerDec,
      scale: viewRef.current.scale,
      width: sizeRef.current.width,
      height: sizeRef.current.height,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = { width: window.innerWidth, height: window.innerHeight };
      canvas.width = sizeRef.current.width * dpr;
      canvas.height = sizeRef.current.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawBackground = (t: number, w: number, h: number) => {
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, w, h);

      // galactic haze
      for (const n of nebulae) {
        const cx = n.x * w + bgRef.current.x * 0.25;
        const cy = n.y * h + bgRef.current.y * 0.25;
        const rad = n.r * Math.max(w, h);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, n.color);
        g.addColorStop(1, 'rgba(5, 7, 13, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // depth starfield: closer layers parallax more, gentle twinkle
      ctx.fillStyle = '#dce6f5';
      for (const s of depthStars) {
        const d = s.depth / DEPTH_LAYERS; // 0..1, closer = larger/faster
        let x = (s.x * w + bgRef.current.x * d) % w;
        let y = (s.y * h + bgRef.current.y * d) % h;
        if (x < 0) x += w;
        if (y < 0) y += h;
        const twinkle = reduce ? 1 : 0.75 + 0.25 * Math.sin(t * 0.002 + s.x * 60 + s.y * 30);
        ctx.globalAlpha = Math.min(1, s.alpha * (0.4 + d) * twinkle);
        ctx.beginPath();
        ctx.arc(x, y, s.r * (0.4 + d), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawMap = (v: Viewport) => {
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
      for (const s of catalog) {
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
    const render = (t: number) => {
      if (!reduce) {
        // slow continuous drift => "travelling through the stars"
        bgRef.current.x -= 0.06;
        bgRef.current.y -= 0.02;
      }
      const v = vp();
      drawBackground(t, v.width, v.height);
      drawMap(v);
      raf = requestAnimationFrame(render);
    };

    resize();
    raf = requestAnimationFrame(render);

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
      // background parallaxes with the drag for a sense of depth
      bgRef.current.x += dx * 0.4;
      bgRef.current.y += dy * 0.4;
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
    const onResize = () => resize();

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
    <>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={labels.mapLabel}
        className="fixed inset-0 z-0 h-screen w-full touch-none cursor-grab bg-space"
      />

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-space/90 to-transparent px-6 pb-6 pt-16">
        <p className="text-sm text-muted">{labels.hint}</p>
        <div className="pointer-events-auto mt-3">
          <h2 className="text-xs uppercase tracking-widest text-stellar">{labels.objectsHeading}</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {objects.map((o) => (
              <li key={o.slug}>
                <button
                  type="button"
                  onClick={() => setSelected(o)}
                  className="rounded border border-white/15 bg-space-800/70 px-3 py-1 text-sm text-starlight backdrop-blur hover:border-stellar hover:text-stellar"
                >
                  {o.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {selected && <SkyInfoPanel object={selected} labels={labels} onClose={() => setSelected(null)} />}
    </>
  );
}
