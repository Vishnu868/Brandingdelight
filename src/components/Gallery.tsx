"use client";
import { useRef, useState } from "react";
import { ZoomIn } from "lucide-react";
import { Lightbox } from "./Lightbox";
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
      <div className="relative overflow-hidden rounded-lg bg-white shadow-[var(--shadow-card)]">
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
        <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink-soft">
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
              className={`size-20 overflow-hidden rounded-md border-2 bg-white ${k === i ? "border-maroon" : "border-transparent"}`}
              aria-label={`Show image ${k + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb(src)} alt="" className="size-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {zoom && <Lightbox images={list} index={i} alt={alt} onClose={() => setZoom(false)} onIndex={goto} />}
    </div>
  );
}
