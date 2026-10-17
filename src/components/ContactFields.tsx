"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Profile } from "./AuthProvider";

/** Name + Indian mobile form used by the quote popup and the profile prompt. */
export function ContactFields({ initial, submitLabel, onSubmit, icon }: { initial?: Partial<Profile>; submitLabel: string; onSubmit: (p: Profile) => Promise<void> | void; icon?: React.ReactNode }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (name.trim().length < 2) return setErr("Please enter your name.");
        if (!/^[6-9]\d{9}$/.test(phone)) return setErr("Enter a valid 10-digit mobile number.");
        setErr(null);
        setBusy(true);
        try {
          await onSubmit({ name: name.trim(), phone });
        } catch (x) {
          setErr((x as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="block">
        <span className="label">Your name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" autoFocus placeholder="Full name" />
      </label>
      <label className="block">
        <span className="label">Mobile number</span>
        <div className="flex">
          <span className="grid place-items-center rounded-l-md border border-r-0 border-line bg-sand px-3 text-sm font-semibold">+91</span>
          <input
            className="input !rounded-l-none"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(-10))}
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
          />
        </div>
      </label>
      {err && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{err}</p>}
      <button className="btn-primary w-full !py-3.5" disabled={busy}>
        {busy ? <Loader2 size={17} className="animate-spin" /> : icon} {submitLabel}
      </button>
    </form>
  );
}
