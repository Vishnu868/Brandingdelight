"use client";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { whatsappLink } from "@/lib/format";

export function EnquiryForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (done)
    return (
      <div className="card p-8 text-center">
        <CheckCircle2 size={48} className="mx-auto text-success" />
        <p className="h-display mt-3 text-2xl font-semibold">Thank you!</p>
        <p className="mt-1 text-sm text-muted">Our gifting team will reach out within one business day with ideas and a quote.</p>
      </div>
    );

  return (
    <form
      className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-7"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr(null);
        const data = Object.fromEntries(new FormData(e.currentTarget));
        const r = await fetch("/api/enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        setBusy(false);
        if (r.ok) setDone(true);
        else setErr((await r.json()).error);
      }}
    >
      <h2 className="h-display text-2xl font-semibold sm:col-span-2">Request a bulk quote</h2>
      {[
        ["name", "Your name", "text", true],
        ["company", "Company", "text", false],
        ["email", "Work email", "email", true],
        ["phone", "Phone / WhatsApp", "tel", true],
        ["quantity", "Approx. quantity", "text", false],
        ["budget", "Budget per gift (₹)", "text", false],
      ].map(([n, l, t, req]) => (
        <label key={n as string} className="block">
          <span className="label">{l as string}</span>
          <input name={n as string} type={t as string} required={req as boolean} className="input" />
        </label>
      ))}
      <label className="block sm:col-span-2">
        <span className="label">What are you looking for?</span>
        <textarea name="message" rows={4} className="input" placeholder="Occasion, products you liked, branding needs, delivery date…" />
      </label>
      <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
      {err && <p className="text-sm text-danger sm:col-span-2">{err}</p>}
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <button className="btn-primary" disabled={busy}>
          {busy && <Loader2 size={16} className="animate-spin" />} Send enquiry
        </button>
        <a href={whatsappLink("Hi, I'd like a corporate gifting quote.")} target="_blank" rel="noreferrer" className="btn-outline">
          Or WhatsApp us
        </a>
      </div>
    </form>
  );
}
