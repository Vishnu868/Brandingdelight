"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";
import { formatINR, thumb } from "@/lib/format";
import { useAdminData, useAdminMutation } from "@/lib/use-admin";
import { useToast } from "@/lib/store";
import type { Order } from "@/lib/types";

const FILTERS = ["all", "paid", "processing", "shipped", "delivered", "pending", "failed", "cancelled", "refunded"];
const NEXT = ["paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

function OrdersInner() {
  const initial = useSearchParams().get("status") ?? "all";
  const [status, setStatus] = useState(initial);
  const { data, loading, error, setData } = useAdminData<{ orders: Order[] }>(`/api/admin/orders?status=${status}`);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div>
      <h1 className="h-display text-3xl font-semibold">Orders</h1>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setStatus(f)} className={`chip shrink-0 capitalize ${status === f ? "!border-maroon !bg-maroon !text-white" : ""}`}>
            {f}
          </button>
        ))}
      </div>
      {error && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{error}</p>}
      <div className="mt-4 space-y-2">
        {loading && Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        {!loading && data?.orders.length === 0 && <p className="card p-8 text-center text-muted">No orders here yet.</p>}
        {data?.orders.map((o) => (
          <div key={o.id} className="card overflow-hidden">
            <button onClick={() => setOpen(open === o.id ? null : o.id)} className="flex w-full flex-wrap items-center gap-3 p-4 text-left">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {o.id} · {o.address?.fullName}
                </p>
                <p className="text-xs text-muted">
                  {new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {o.address?.city} · {o.items.reduce((n, l) => n + l.qty, 0)} items
                  {o.cardNetwork ? ` · ${o.cardNetwork}` : o.paymentMethod ? ` · ${o.paymentMethod}` : ""}
                </p>
              </div>
              <StatusPill s={o.status} />
              <p className="w-24 text-right font-bold">{formatINR(o.total)}</p>
              <ChevronDown size={18} className={`transition ${open === o.id ? "rotate-180" : ""}`} />
            </button>
            {open === o.id && <OrderDetail o={o} onChange={(n) => setData((d) => (d ? { orders: d.orders.map((x) => (x.id === n.id ? n : x)) } : d))} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderDetail({ o, onChange }: { o: Order; onChange: (o: Order) => void }) {
  const mutate = useAdminMutation();
  const toast = useToast((s) => s.push);
  const [tracking, setTracking] = useState(o.trackingUrl ?? "");
  const [notes, setNotes] = useState(o.notes ?? "");
  const [busy, setBusy] = useState(false);
  const a = o.address;

  const save = async (patch: Record<string, unknown>) => {
    setBusy(true);
    try {
      const r = await mutate(`/api/admin/orders/${o.id}`, "PATCH", patch);
      onChange(r.order);
      toast("Order updated");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-5 border-t border-line bg-cream/60 p-4 lg:grid-cols-2">
      <div>
        <p className="label">Items</p>
        <ul className="space-y-2">
          {o.items.map((l, k) => (
            <li key={k} className="flex items-center gap-3 text-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb(l.image || "/placeholder.svg")} alt="" className="size-12 rounded-lg bg-white object-contain" />
              <span className="flex-1">
                {l.name}
                {l.variantLabel && <span className="text-muted"> · {l.variantLabel}</span>}
                <span className="block text-xs text-muted">
                  {l.qty} × {formatINR(l.price)}
                </span>
              </span>
              <b>{formatINR(l.qty * l.price)}</b>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          Subtotal {formatINR(o.subtotal)} · Shipping {formatINR(o.shipping)} · <b>Total {formatINR(o.total)}</b>
        </p>
        {o.razorpayPaymentId && <p className="mt-1 text-xs text-muted">Razorpay payment: {o.razorpayPaymentId}</p>}
      </div>
      <div className="space-y-4 text-sm">
        <div>
          <p className="label">Ship to</p>
          <p>
            <b>{a.fullName}</b>
            {a.company && ` · ${a.company}`}
            <br />
            {a.line1}
            {a.line2 && `, ${a.line2}`}
            <br />
            {a.city}, {a.state} {a.pincode}
            <br />
            <a href={`tel:+91${a.phone}`} className="text-maroon">
              +91 {a.phone}
            </a>{" "}
            ·{" "}
            <a href={`mailto:${a.email}`} className="text-maroon">
              {a.email}
            </a>
            {a.gstin && (
              <>
                <br />
                GSTIN: {a.gstin}
              </>
            )}
          </p>
        </div>
        <div>
          <p className="label">Update status</p>
          <div className="flex flex-wrap gap-2">
            {NEXT.map((s) => (
              <button key={s} disabled={busy || o.status === s} onClick={() => save({ status: s })} className={`chip capitalize ${o.status === s ? "!border-maroon !text-maroon" : ""}`}>
                {s}
              </button>
            ))}
            {busy && <Loader2 size={16} className="animate-spin" />}
          </div>
        </div>
        <div className="flex gap-2">
          <input className="input !py-2" placeholder="Courier tracking URL" value={tracking} onChange={(e) => setTracking(e.target.value)} />
          <button className="btn-dark !py-2" disabled={busy} onClick={() => save({ trackingUrl: tracking, status: o.status === "paid" || o.status === "processing" ? "shipped" : o.status })}>
            Save
          </button>
        </div>
        <div>
          <textarea className="input" rows={2} placeholder="Internal notes" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== (o.notes ?? "") && save({ notes })} />
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  return (
    <Suspense>
      <OrdersInner />
    </Suspense>
  );
}
