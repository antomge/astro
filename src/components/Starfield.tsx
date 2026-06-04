import { useEffect, useRef } from 'react';
import { generateStars, type Star } from '../lib/starfield';

interface Props {
  /** nombre d'étoiles (défaut 240) */
  count?: number;
  seed?: number;
}

const LAYERS = 3;

export default function Starfield({ count = 240, seed = 7 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stars: Star[] = generateStars(count, seed, LAYERS);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      // décalage parallax basé sur le scroll : couches proches bougent plus
      const scrollY = reduce ? 0 : window.scrollY;
      for (const s of stars) {
        const parallax = (s.depth / LAYERS) * 0.15;
        const y = (s.y * height - scrollY * parallax) % height;
        const yy = y < 0 ? y + height : y;
        ctx.globalAlpha = s.alpha;
        ctx.beginPath();
        ctx.arc(s.x * width, yy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = '#e8edf7';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const onScrollOrResize = () => {
      if (reduce) {
        draw();
        return;
      }
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', () => {
      resize();
      onScrollOrResize();
    });
    if (!reduce) window.addEventListener('scroll', onScrollOrResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScrollOrResize);
    };
  }, [count, seed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
