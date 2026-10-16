"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Slide = { image: string; eyebrow: string; title: string; text: string; cta: string; href: string; tone: string };

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const paused = useRef(false);
  const touch = useRef<number | null>(null);
  const go = useCallback((n: number) => setI((n + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    const t = setInterval(() => !paused.current && go(i + 1), 5500);
    return () => clearInterval(t);
  }, [i, go]);

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const d = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(d) > 40) go(i + (d < 0 ? 1 : -1));
        touch.current = null;
      }}
      aria-roledescription="carousel"
    >
      <div className="flex transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)]" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, k) => (
          <div key={k} className={`relative w-full shrink-0 ${s.tone}`} aria-hidden={k !== i}>
            <div className="container-x grid min-h-[480px] items-center gap-5 py-6 md:min-h-[480px] md:grid-cols-[1fr_1.1fr] md:py-12 lg:min-h-[540px]">
              <div className="order-2 text-center md:order-1 md:text-left">
                <p className="eyebrow">{s.eyebrow}</p>
                <h1 className="h-display mt-3 text-[30px] font-semibold leading-[1.08] text-current sm:text-5xl lg:text-[60px]">{s.title}</h1>
                <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed opacity-80 md:mx-0">{s.text}</p>
                <Link href={s.href} className="btn-primary mt-6" tabIndex={k === i ? 0 : -1}>
                  {s.cta}
                </Link>
              </div>
              <div className="order-1 md:order-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt=""
                  loading={k === 0 ? "eager" : "lazy"}
                  fetchPriority={k === 0 ? "high" : "auto"}
                  decoding="async"
                  className="mx-auto max-h-[250px] w-auto rounded-lg object-contain shadow-[var(--shadow-pop)] md:max-h-[420px] lg:max-h-[460px]"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => go(i - 1)} aria-label="Previous slide" className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2.5 shadow md:block">
        <ChevronLeft size={20} />
      </button>
      <button onClick={() => go(i + 1)} aria-label="Next slide" className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2.5 shadow md:block">
        <ChevronRight size={20} />
      </button>
      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {slides.map((_, k) => (
          <button
            key={k}
            onClick={() => go(k)}
            aria-label={`Go to slide ${k + 1}`}
            className={`h-1.5 rounded-full transition-all ${k === i ? "w-7 bg-maroon" : "w-1.5 bg-ink/25"}`}
          />
        ))}
      </div>
    </section>
  );
}
