"use client";
import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Boxes, Database, IndianRupee, Inbox, Loader2, PlusCircle, ShoppingCart } from "lucide-react";
import { formatINR } from "@/lib/format";
import { useAdminData, useAdminMutation } from "@/lib/use-admin";
import { useToast } from "@/lib/store";

type Stats = {
  products: number;
  activeProducts: number;
  orders: number;
  revenue30d: number;
  orders30d: number;
  pending: number;
  newEnquiries: number;
  byDay: Record<string, number>;
  methods: Record<string, number>;
};

export default function AdminDashboard() {
  const { data, error, loading, reload } = useAdminData<Stats>("/api/admin/stats");
  const mutate = useAdminMutation();
  const toast = useToast((s) => s.push);
  const [importing, setImporting] = useState(false);

  const days = Array.from({ length: 14 }, (_, k) => {
    const d = new Date(Date.now() - (13 - k) * 864e5).toISOString().slice(0, 10);
    return [d, data?.byDay?.[d] ?? 0] as const;
  });
  const max = Math.max(1, ...days.map((d) => d[1]));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h-display text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted">Store overview · last 30 days</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <PlusCircle size={17} /> Add product
        </Link>
      </div>

      {error && (
        <div className="mt-6 flex gap-3 rounded-md bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle size={18} className="shrink-0" /> {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [IndianRupee, "Revenue (30d)", data ? formatINR(data.revenue30d) : "—"],
          [ShoppingCart, "Orders (30d)", data?.orders30d ?? "—"],
          [Boxes, "Live products", data ? `${data.activeProducts} / ${data.products}` : "—"],
          [Inbox, "New enquiries", data?.newEnquiries ?? "—"],
        ].map(([I, l, v]) => {
          const Icon = I as typeof Boxes;
          return (
            <div key={l as string} className="card p-4 sm:p-5">
              <Icon size={20} className="text-gold" />
              <p className="mt-3 text-2xl font-bold">{loading ? <span className="skeleton inline-block h-7 w-20" /> : (v as string)}</p>
              <p className="text-xs text-muted">{l as string}</p>
            </div>
          );
        })}
      </div>

      {data && data.pending > 0 && (
        <Link href="/admin/orders?status=paid" className="mt-4 flex items-center justify-between rounded-md bg-maroon px-5 py-4 text-white">
          <span>
            <b>{data.pending}</b> paid order{data.pending > 1 ? "s" : ""} waiting to be processed
          </span>
          <span>Open →</span>
        </Link>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="card p-5">
          <p className="font-semibold">Sales — last 14 days</p>
          <div className="mt-5 flex h-44 items-end gap-1.5">
            {days.map(([d, v]) => (
              <div key={d} className="group relative flex flex-1 flex-col items-center justify-end">
                <div className="w-full rounded-t-md bg-maroon/85 transition group-hover:bg-maroon" style={{ height: `${Math.max(2, (v / max) * 100)}%` }} />
                <span className="mt-1.5 text-[9.5px] text-muted">{d.slice(8)}</span>
                <span className="pointer-events-none absolute -top-7 hidden whitespace-nowrap rounded bg-ink px-2 py-1 text-[11px] text-white group-hover:block">{formatINR(v)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <p className="font-semibold">Payment methods</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {data && Object.keys(data.methods).length ? (
              Object.entries(data.methods)
                .sort((a, b) => b[1] - a[1])
                .map(([m, n]) => (
                  <li key={m} className="flex justify-between capitalize">
                    <span>{m}</span>
                    <b>{n}</b>
                  </li>
                ))
            ) : (
              <li className="text-muted">No paid orders yet.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="card mt-6 flex flex-wrap items-center gap-4 p-5">
        <Database className="text-gold" size={26} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Catalogue import</p>
          <p className="text-sm text-muted">
            Copy the 3,000+ products extracted from your PDF catalogues into Supabase so you can edit them here. Safe to run again — existing products are skipped.
          </p>
        </div>
        <button
          className="btn-dark"
          disabled={importing}
          onClick={async () => {
            setImporting(true);
            try {
              const r = await mutate("/api/admin/import", "POST", {});
              toast(`Imported ${r.imported} products`);
              reload();
            } catch (e) {
              toast((e as Error).message, "error");
            } finally {
              setImporting(false);
            }
          }}
        >
          {importing && <Loader2 size={16} className="animate-spin" />} Import catalogue
        </button>
      </div>
    </div>
  );
}
