"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Full-screen blur with three pulsing dots:
 *  - on the first page load, until the page is ready (at least FIRST_MS),
 *  - on every page-to-page navigation (link clicks, back/forward, `startRouteLoading()`),
 *    until the new page is showing (at least NAV_MS, so even instant pages get a calm transition).
 * Filter / sort changes on a listing use router.replace and intentionally don't trigger it.
 */
const FIRST_MS = 1100;
const NAV_MS = 900;
const MAX_MS = 10000; // never trap the user if a navigation is cancelled
const START = "bd:route-start";
const DONE = "bd:route-done";

/** Call before a programmatic router.push() to show the loader. */
export function startRouteLoading() {
  window.dispatchEvent(new Event(START));
}

function isInternalNav(e: MouseEvent) {
  // runs in the capture phase, before next/link calls preventDefault() and navigates client-side
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!a || a.target === "_blank" || a.hasAttribute("download") || a.dataset.noLoader !== undefined) return false;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;
  return url.pathname !== location.pathname || url.search !== location.search; // hash-only / same page: no loader
}

export function RouteLoader() {
  const [state, setState] = useState<"on" | "fading" | "off">("on"); // server HTML ships with it on (first load)
  const since = useRef(0);
  const active = useRef(true);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const clear = () => (timers.current.forEach(clearTimeout), (timers.current = []));
    const hideAfter = (min: number) => {
      clear();
      const wait = Math.max(0, min - (performance.now() - since.current));
      timers.current.push(
        window.setTimeout(() => setState("fading"), wait),
        window.setTimeout(() => ((active.current = false), setState("off")), wait + 280),
      );
    };
    const show = () => {
      clear();
      since.current = performance.now();
      active.current = true;
      setState("on");
      timers.current.push(window.setTimeout(() => hideAfter(0), MAX_MS));
    };

    // first load: wait for the page (images included) or the minimum, whichever is later
    since.current = 0;
    const firstDone = () => hideAfter(FIRST_MS);
    if (document.readyState === "complete") firstDone();
    else window.addEventListener("load", firstDone, { once: true });

    const onClick = (e: MouseEvent) => isInternalNav(e) && show();
    const onDone = () => active.current && hideAfter(NAV_MS); // filter/sort URL changes while idle: ignore
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", show);
    window.addEventListener(START, show);
    window.addEventListener(DONE, onDone);
    return () => {
      clear();
      window.removeEventListener("load", firstDone);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", show);
      window.removeEventListener(START, show);
      window.removeEventListener(DONE, onDone);
    };
  }, []);

  if (state === "off") return null;
  return (
    <div
      aria-hidden={state !== "on"}
      role="status"
      aria-label="Loading"
      className={`route-loader fixed inset-0 z-[95] grid place-items-center bg-cream/55 backdrop-blur-md transition-opacity duration-300 ${state === "fading" ? "opacity-0" : "opacity-100"}`}
    >
      <div className="flex items-center gap-2.5 rounded-full bg-white/80 px-5 py-4 shadow-[var(--shadow-card)]">
        <span className="loader-dot" />
        <span className="loader-dot [animation-delay:160ms]" />
        <span className="loader-dot [animation-delay:320ms]" />
      </div>
    </div>
  );
}

/** Lives inside <Suspense> (it reads search params) and tells the loader when the URL has changed. */
export function RouteWatcher() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.dispatchEvent(new Event(DONE));
  }, [pathname, search]);
  return null;
}
