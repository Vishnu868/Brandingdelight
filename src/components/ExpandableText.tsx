"use client";
import { useLayoutEffect, useRef, useState } from "react";

/** Text clamped to a few lines with a "Read more" toggle, shown only when the text actually overflows. */
export function ExpandableText({ text, lines = 3, className = "" }: { text: string; lines?: number; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Measure real overflow; before layout (clientHeight 0) fall back to a length estimate.
    const check = () => setOverflows(el.clientHeight > 0 ? el.scrollHeight - el.clientHeight > 2 : text.length > lines * 55);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, lines]);

  return (
    <div>
      <p ref={ref} className={className} style={open ? undefined : { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {text}
      </p>
      {(overflows || open) && (
        <button onClick={() => setOpen(!open)} className="mt-1.5 text-sm font-semibold text-maroon underline-offset-4 hover:underline">
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
