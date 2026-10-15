"use client";
import { useRef, useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { thumb } from "@/lib/format";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const strip = useRef<HTMLDivElement>(null);
  const list = images.length ? images : ["/placeholder.svg"];

  const onScroll = () => {
    const el = strip.current;
    if (el) setI(Math.round(el.scrollLeft / el.clientWidth));
  };
  const goto = (k: number) => {
    setI(k);
    strip.current?.scrollTo({ left: k * strip.current.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="lg:sticky lg:top-36">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]">
        <div ref={strip} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
          {list.map((src, k) => (
            <button key={src} className="relative aspect-square w-full shrink-0 snap-center bg-[#f6f1ea]" onClick={() => setZoom(true)} aria-label="Zoom image">
              {/* low-res thumbnail shows instantly, full-resolution image fades in over it */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb(src)} alt="" aria-hidden className="absolute inset-0 size-full object-contain p-3 blur-[1px]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${alt} — image ${k + 1}`}
                loading={k === 0 ? "eager" : "lazy"}
                fetchPriority={k === 0 ? "high" : "auto"}
                decoding="async"
                onLoad={() => setLoaded((s) => ({ ...s, [k]: true }))}
                className={`absolute inset-0 size-full object-contain p-3 transition-opacity duration-500 ${loaded[k] ? "opacity-100" : "opacity-0"}`}
              />
            </button>
          ))}
        </div>
        <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink-soft">
          <ZoomIn size={13} /> Tap to zoom
        </span>
        {list.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:hidden">
            {list.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-maroon" : "w-1.5 bg-ink/25"}`} />
            ))}
          </div>
        )}
      </div>
      {list.length > 1 && (
        <div className="mt-3 hidden gap-2 sm:flex">
          {list.map((src, k) => (
            <button
              key={src}
              onClick={() => goto(k)}
              className={`size-20 overflow-hidden rounded-xl border-2 bg-white ${k === i ? "border-maroon" : "border-transparent"}`}
              aria-label={`Show image ${k + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb(src)} alt="" className="size-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {zoom && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-black/95" onClick={() => setZoom(false)}>
          <button className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white" aria-label="Close">
            <X size={24} />
          </button>
          <div className="flex-1 overflow-auto" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={list[i]} alt={alt} className="mx-auto min-h-full w-auto max-w-none object-contain sm:max-w-full" style={{ width: "max(100%, 1200px)" }} />
          </div>
          {list.length > 1 && (
            <div className="flex justify-center gap-2 p-3" onClick={(e) => e.stopPropagation()}>
              {list.map((src, k) => (
                <button key={src} onClick={() => setI(k)} className={`size-14 overflow-hidden rounded-lg border-2 ${k === i ? "border-white" : "border-transparent opacity-60"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb(src)} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
