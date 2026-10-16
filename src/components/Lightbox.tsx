"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { thumb } from "@/lib/format";

const ZOOM = 2.5;

/**
 * Full-screen image viewer. Opens fitted to the screen; tap/click zooms to 2.5× at that point,
 * drag pans while zoomed, tap again to zoom out. Swipe / arrow keys switch images, Esc closes.
 */
export function Lightbox({ images, index, alt, onClose, onIndex }: { images: string[]; index: number; alt: string; onClose: () => void; onIndex: (i: number) => void }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  const reset = () => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  };
  const go = useCallback(
    (d: number) => {
      if (images.length < 2) return;
      onIndex((index + d + images.length) % images.length);
      setScale(1);
      setPos({ x: 0, y: 0 });
    },
    [images.length, index, onIndex]
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", key);
    };
  }, [go, onClose]);

  const clamp = (x: number, y: number, s = scale) => {
    const r = stage.current?.getBoundingClientRect();
    if (!r) return { x, y };
    const mx = ((s - 1) * r.width) / 2;
    const my = ((s - 1) * r.height) / 2;
    return { x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) };
  };

  const zoomAt = (clientX: number, clientY: number) => {
    const r = stage.current!.getBoundingClientRect();
    // keep the tapped point under the finger after zooming
    const dx = clientX - (r.left + r.width / 2);
    const dy = clientY - (r.top + r.height / 2);
    setScale(ZOOM);
    setPos(clamp(-dx * (ZOOM - 1), -dy * (ZOOM - 1), ZOOM));
  };

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    if (scale > 1) setPos(clamp(d.ox + dx, d.oy + dy));
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.sx;
    if (!d.moved) {
      if (scale > 1) reset();
      else zoomAt(e.clientX, e.clientY);
    } else if (scale === 1 && Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black animate-fade-up" role="dialog" aria-modal="true" aria-label={`${alt} images`}>
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm text-white/70">{images.length > 1 ? `${index + 1} / ${images.length}` : ""}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => (scale > 1 ? reset() : (setScale(ZOOM), setPos({ x: 0, y: 0 })))}
            className="grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label={scale > 1 ? "Zoom out" : "Zoom in"}
          >
            {scale > 1 ? <ZoomOut size={19} /> : <ZoomIn size={19} />}
          </button>
          <button onClick={onClose} className="grid size-10 place-items-center rounded-full bg-white text-ink" aria-label="Close">
            <X size={20} />
          </button>
        </div>
      </div>

      <div
        ref={stage}
        className={`relative flex-1 touch-none select-none overflow-hidden ${scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => (drag.current = null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index]}
          alt={alt}
          draggable={false}
          className="absolute inset-0 m-auto max-h-full max-w-full object-contain transition-transform duration-200 ease-out"
          style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }}
        />
        {images.length > 1 && scale === 1 && (
          <>
            <button onClick={() => go(-1)} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 sm:block" aria-label="Previous image">
              <ChevronLeft size={22} />
            </button>
            <button onClick={() => go(1)} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 sm:block" aria-label="Next image">
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      <p className="py-2 text-center text-xs text-white/50">{scale > 1 ? "Drag to move · tap to zoom out" : "Tap the image to zoom"}</p>
      {images.length > 1 && (
        <div className="flex justify-center gap-2 pb-4">
          {images.map((src, k) => (
            <button key={src} onClick={() => go(k - index)} className={`size-14 overflow-hidden rounded-md border-2 ${k === index ? "border-white" : "border-transparent opacity-60"}`} aria-label={`Image ${k + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb(src)} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
