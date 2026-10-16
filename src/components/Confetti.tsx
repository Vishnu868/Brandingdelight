"use client";
import { useEffect, useRef } from "react";

const COLORS = ["#7b1e2b", "#b8893b", "#e2c385", "#1f7a4d", "#2e77bc", "#f1b8c4", "#ffffff"];

/** One-shot confetti burst on a full-screen canvas (no dependency, ~3.5 s, respects reduced motion). */
export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth;
    const H = window.innerHeight;
    c.width = W * dpr;
    c.height = H * dpr;
    ctx.scale(dpr, dpr);

    type P = { x: number; y: number; vx: number; vy: number; w: number; h: number; r: number; vr: number; c: string; circle: boolean };
    const parts: P[] = [];
    const burst = (x: number, y: number, n: number, spread: number, angle: number) => {
      for (let k = 0; k < n; k++) {
        const a = angle + (Math.random() - 0.5) * spread;
        const sp = 7 + Math.random() * 9;
        parts.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
          r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
          c: COLORS[(Math.random() * COLORS.length) | 0], circle: Math.random() < 0.25,
        });
      }
    };
    // two side cannons + a centre pop
    burst(0, H * 0.75, 90, 0.9, -Math.PI / 3);
    burst(W, H * 0.75, 90, 0.9, (-2 * Math.PI) / 3);
    setTimeout(() => burst(W / 2, H * 0.35, 80, Math.PI * 2, 0), 250);

    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const fade = Math.max(0, 1 - (t - start - 2500) / 1000);
      for (const p of parts) {
        p.vy += 0.28;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        if (p.circle) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)) + 2);
        ctx.restore();
      }
      if (fade > 0) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[95] size-full" />;
}
