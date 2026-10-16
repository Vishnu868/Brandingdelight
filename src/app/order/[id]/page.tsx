"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, Clock, Package } from "lucide-react";
import { formatINR, thumb, whatsappLink } from "@/lib/format";
import { useLocalOrders } from "@/lib/store";
import type { OrderLine } from "@/lib/types";
import { Confetti } from "@/components/Confetti";

type View = { id: string; status: string; items: OrderLine[]; subtotal: number; shipping: number; total: number; paymentMethod?: string; cardNetwork?: string };

function OrderInner() {
  const { id } = useParams<{ id: string }>();
  const demo = useSearchParams().get("demo") === "1";
  const local = useLocalOrders((s) => s.orders.find((o) => o.id === id));
  const [order, setOrder] = useState<View | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (demo) {
      setLoading(false);
      return;
    }
    fetch(`/api/orders/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setOrder(d?.order ?? null))
      .finally(() => setLoading(false));
  }, [id, demo]);

  const o: View | null = order ?? (local ? { ...local } : null);
  if (loading) return <div className="skeleton mx-auto h-96 max-w-2xl rounded-lg" />;

  const paid = !o || o.status !== "pending";
  return (
    <div className="mx-auto max-w-2xl">
      {paid && <CelebrateOnce id={id} />}
      <div className="card p-6 text-center sm:p-10">
        {paid ? <CheckCircle2 size={64} className="mx-auto text-success" /> : <Clock size={64} className="mx-auto text-gold" />}
        <h1 className="h-display mt-4 text-3xl font-semibold">{paid ? "Thank you! Your order is confirmed" : "Payment processing"}</h1>
        <p className="mt-2 text-muted">
          Order <b className="text-ink">{id}</b>
          {o?.cardNetwork && <> · Paid with {o.cardNetwork} card</>}
          {!o?.cardNetwork && o?.paymentMethod && <> · Paid via {o.paymentMethod}</>}
        </p>
        {demo && <p className="mx-auto mt-3 max-w-md rounded-lg bg-gold-soft px-3 py-2 text-xs">Demo mode — Razorpay keys are not configured yet, so no real payment was taken.</p>}
        <p className="mx-auto mt-4 max-w-md text-sm text-ink-soft">
          A confirmation has been recorded. Our team will dispatch your order within 1–3 business days and share tracking on your phone and email.
        </p>
      </div>
      {o && (
        <div className="card mt-5 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <Package size={18} /> Items
          </h2>
          <ul className="mt-4 divide-y divide-line">
            {o.items.map((l, k) => (
              <li key={k} className="flex items-center gap-3 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb(l.image || "/placeholder.svg")} alt="" className="size-14 rounded-lg bg-[#f6f1ea] object-contain" />
                <span className="flex-1 text-sm">
                  {l.name}
                  {l.variantLabel && <span className="block text-xs text-muted">{l.variantLabel}</span>}
                  <span className="block text-xs text-muted">Qty {l.qty}</span>
                </span>
                <span className="text-sm font-semibold">{formatINR(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatINR(o.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd>{o.shipping ? formatINR(o.shipping) : "FREE"}</dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt>Total paid</dt>
              <dd>{formatINR(o.total)}</dd>
            </div>
          </dl>
        </div>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/account" className="btn-dark">
          View my orders
        </Link>
        <Link href="/shop" className="btn-outline">
          Continue shopping
        </Link>
        <a href={whatsappLink(`Hi, I have a question about my order ${id}`)} target="_blank" rel="noreferrer" className="btn-outline">
          Help with this order
        </a>
      </div>
    </div>
  );
}

/** Confetti the first time this order's confirmation is seen in this browser session. */
function CelebrateOnce({ id }: { id: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const k = `bd-confetti-${id}`;
    try {
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch {
      /* storage blocked: still celebrate */
    }
    setShow(true);
  }, [id]);
  return show ? <Confetti /> : null;
}

export default function OrderPage() {
  return (
    <div className="container-x py-8 sm:py-12">
      <Suspense>
        <OrderInner />
      </Suspense>
    </div>
  );
}
