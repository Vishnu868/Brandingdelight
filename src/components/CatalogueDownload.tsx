"use client";
import { useRef, useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Modal } from "./Modal";
import { useToast } from "@/lib/store";

const BIG = 300; // above this, confirm first: the PDF gets long and takes a while on phones

/** "Download catalogue" for whatever the listing currently shows (after search and filters). */
export function CatalogueDownload({ title, subtitle, slugs }: { title: string; subtitle?: string; slugs: string[] }) {
  const toast = useToast((s) => s.push);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState<null | { done: number; total: number; stage: string }>(null);
  const abort = useRef<AbortController | null>(null);

  const run = async () => {
    setConfirm(false);
    abort.current = new AbortController();
    setBusy({ done: 0, total: slugs.length, stage: "Gathering product details" });
    try {
      const { buildCataloguePdf } = await import("@/lib/catalogue-pdf");
      const r = await buildCataloguePdf(
        { title, subtitle, slugs },
        (done, total, stage) => setBusy({ done, total, stage: stage === "data" ? "Gathering product details" : stage === "images" ? "Adding product photos" : "Laying out pages" }),
        abort.current.signal,
      );
      toast(`Catalogue downloaded · ${r.count} products`);
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast("Couldn't create the catalogue. Please try again.", "error");
    } finally {
      setBusy(null);
      abort.current = null;
    }
  };

  const start = () => (slugs.length > BIG ? setConfirm(true) : run());
  const pct = busy && busy.total ? Math.round((busy.done / busy.total) * 100) : 0;

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={!slugs.length || !!busy}
        className="btn-outline shrink-0 !px-3 !py-2"
        aria-label={`Download catalogue PDF of ${slugs.length} products`}
        title={`Download these ${slugs.length} products as a PDF catalogue`}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
        <span className="sm:hidden">PDF</span>
        <span className="hidden sm:inline">Catalogue PDF</span>
      </button>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Download catalogue" subtitle={`${slugs.length} products — this is a long PDF and can take a minute on a phone.`}>
        <p className="text-sm text-ink-soft">Tip: use filters or search first to download just the products you need.</p>
        <div className="mt-5 flex gap-2">
          <button className="btn-outline flex-1" onClick={() => setConfirm(false)}>
            Refine first
          </button>
          <button className="btn-primary flex-1" onClick={run}>
            Download all
          </button>
        </div>
      </Modal>

      <Modal open={!!busy} onClose={() => abort.current?.abort()} title="Preparing your catalogue" subtitle={busy?.stage} locked>
        <div className="h-2 overflow-hidden rounded-full bg-sand">
          <div className="h-full rounded-full bg-maroon transition-[width] duration-300" style={{ width: `${Math.max(4, pct)}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted">
          {busy?.done ?? 0} / {busy?.total ?? 0} products
        </p>
        <button className="btn-outline mt-5 w-full" onClick={() => abort.current?.abort()}>
          Cancel
        </button>
      </Modal>
    </>
  );
}
