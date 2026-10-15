"use client";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { useAdminData, useAdminMutation } from "@/lib/use-admin";
import { useToast } from "@/lib/store";

type Enquiry = { id: string; name: string; company: string; email: string; phone: string; quantity: string; budget: string; message: string; status: string; created_at: string };

export default function AdminEnquiries() {
  const { data, loading, error, setData } = useAdminData<{ enquiries: Enquiry[] }>("/api/admin/enquiries");
  const mutate = useAdminMutation();
  const toast = useToast((s) => s.push);

  return (
    <div>
      <h1 className="h-display text-3xl font-semibold">Bulk & corporate enquiries</h1>
      {error && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{error}</p>}
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {loading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-xl" />)}
        {!loading && data?.enquiries.length === 0 && <p className="card p-8 text-center text-muted lg:col-span-2">No enquiries yet.</p>}
        {data?.enquiries.map((e) => (
          <div key={e.id} className="card p-4 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {e.name}
                  {e.company && <span className="font-normal text-muted"> · {e.company}</span>}
                </p>
                <p className="text-xs text-muted">{new Date(e.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
              <select
                value={e.status}
                className="rounded-full border border-line bg-white px-3 py-1 text-xs"
                onChange={async (ev) => {
                  const status = ev.target.value;
                  try {
                    await mutate("/api/admin/enquiries", "PATCH", { id: e.id, status });
                    setData((d) => (d ? { enquiries: d.enquiries.map((x) => (x.id === e.id ? { ...x, status } : x)) } : d));
                  } catch (err) {
                    toast((err as Error).message, "error");
                  }
                }}
              >
                {["new", "contacted", "won", "lost"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            {(e.quantity || e.budget) && (
              <p className="mt-2 text-xs">
                {e.quantity && <>Qty: <b>{e.quantity}</b> </>}
                {e.budget && <>· Budget: <b>₹{e.budget}</b></>}
              </p>
            )}
            {e.message && <p className="mt-2 whitespace-pre-line text-ink-soft">{e.message}</p>}
            <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-maroon">
              <a href={`tel:${e.phone}`} className="flex items-center gap-1">
                <Phone size={13} /> {e.phone}
              </a>
              <a href={`https://wa.me/${e.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                <MessageCircle size={13} /> WhatsApp
              </a>
              <a href={`mailto:${e.email}`} className="flex items-center gap-1">
                <Mail size={13} /> {e.email}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
