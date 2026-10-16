"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Building2, CreditCard, Landmark, Loader2, Lock, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Select } from "@/components/Select";
import { useMounted } from "@/components/Header";
import { formatINR, shippingFor, SITE, thumb } from "@/lib/format";
import { cartSubtotal, useCart, useLocalOrders, useToast } from "@/lib/store";
import type { Address } from "@/lib/types";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];

const METHODS = [
  { id: "card", label: "Credit / Debit Card", sub: "Visa, Mastercard, RuPay, American Express", Icon: CreditCard },
  { id: "upi", label: "UPI", sub: "GPay, PhonePe, Paytm, BHIM or any UPI app", Icon: Smartphone },
  { id: "netbanking", label: "Net Banking", sub: "All major Indian banks", Icon: Landmark },
  { id: "wallet", label: "Wallets & Pay Later", sub: "Paytm, Amazon Pay, Mobikwik & more", Icon: Wallet },
] as const;

const EMPTY: Address = { fullName: "", phone: "", email: "", line1: "", line2: "", city: "", state: "Telangana", pincode: "", company: "", gstin: "" };

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const mounted = useMounted();
  const { user, authFetch } = useAuth();
  const { items, clear } = useCart();
  const saveLocal = useLocalOrders((s) => s.save);
  const toast = useToast((s) => s.push);
  const [addr, setAddr] = useState<Address>(EMPTY);
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("card");
  const [business, setBusiness] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bd-address");
      if (saved) setAddr({ ...EMPTY, ...JSON.parse(saved) });
    } catch {
      /* ignore */
    }
    loadRazorpay(); // warm up the payment script so the popup opens instantly
  }, []);
  useEffect(() => {
    if (user) setAddr((a) => ({ ...a, email: a.email || user.email || "", fullName: a.fullName || user.displayName || "", phone: a.phone || (user.phoneNumber ?? "").replace(/^\+91/, "") }));
  }, [user]);

  if (!mounted) return <div className="container-x py-10"><div className="skeleton h-96 w-full rounded-lg" /></div>;
  if (!items.length)
    return (
      <div className="container-x py-20 text-center">
        <h1 className="h-display text-3xl font-semibold">Nothing to check out</h1>
        <Link href="/shop" className="btn-primary mt-6">
          Continue shopping
        </Link>
      </div>
    );

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;
  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setAddr((a) => ({ ...a, [k]: e.target.value }));

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      localStorage.setItem("bd-address", JSON.stringify(addr));
      const res = await authFetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })), address: addr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start payment");

      if (data.demo) {
        saveLocal({
          id: data.orderId, userId: user?.uid ?? null, email: addr.email, items: data.lines, subtotal: data.subtotal, shipping: data.shipping, total: data.total,
          address: addr, status: "paid", paymentMethod: `${method} (demo)`, createdAt: new Date().toISOString(),
        });
        clear();
        router.push(`/order/${data.orderId}?demo=1`);
        return;
      }

      if (!(await loadRazorpay()) || !window.Razorpay) throw new Error("Could not load the payment window. Check your connection and try again.");
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        order_id: data.razorpayOrderId,
        name: SITE.name,
        description: `Order ${data.orderId}`,
        image: `${location.origin}/icon-512.png`,
        prefill: { name: addr.fullName, email: addr.email, contact: `+91${addr.phone}`, method },
        notes: { bd_order_id: data.orderId },
        theme: { color: "#7b1e2b" },
        retry: { enabled: true, max_count: 3 },
        config: {
          display: {
            blocks: {
              cards: { name: "Cards — Visa, Mastercard, RuPay & American Express", instruments: [{ method: "card" }] },
              upi: { name: "UPI", instruments: [{ method: "upi" }] },
            },
            sequence: method === "upi" ? ["block.upi", "block.cards"] : ["block.cards", "block.upi"],
            preferences: { show_default_blocks: true },
          },
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            toast("Payment cancelled — your cart is saved", "error");
          },
        },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const v = await fetch("/api/checkout/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: data.orderId, ...r }) });
          if (!v.ok) {
            setBusy(false);
            setErr("We received your payment but could not verify it automatically. Please contact us with order " + data.orderId);
            return;
          }
          clear();
          router.push(`/order/${data.orderId}`);
        },
      });
      rzp.on("payment.failed", (r) => {
        const d = (r as { error?: { description?: string } }).error;
        setErr(d?.description || "Payment failed. Please try another method.");
      });
      rzp.open();
    } catch (e2) {
      setErr((e2 as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="container-x py-5 sm:py-8">
      <Link href="/cart" className="inline-flex items-center gap-1 text-sm text-muted">
        <ArrowLeft size={15} /> Back to cart
      </Link>
      <h1 className="h-display mt-2 text-3xl font-semibold">Secure checkout</h1>
      {!user && (
        <p className="mt-1 text-sm text-muted">
          Checking out as guest ·{" "}
          <Link href="/login?next=/checkout" className="font-semibold text-maroon">
            Sign in
          </Link>{" "}
          to track orders easily
        </p>
      )}

      <form onSubmit={pay} className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <span className="grid size-7 place-items-center rounded-full bg-maroon text-xs text-white">1</span> Delivery address
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" className="sm:col-span-2">
                <input className="input" value={addr.fullName} onChange={set("fullName")} autoComplete="name" required />
              </Field>
              <Field label="Mobile number">
                <input
                  className="input"
                  value={addr.phone}
                  onChange={(e) => setAddr((a) => ({ ...a, phone: e.target.value.replace(/\D/g, "").slice(-10) }))}
                  inputMode="numeric"
                  autoComplete="tel-national"
                  pattern="[6-9][0-9]{9}"
                  title="10-digit Indian mobile number"
                  required
                />
              </Field>
              <Field label="Email (for order updates)">
                <input className="input" type="email" value={addr.email} onChange={set("email")} autoComplete="email" required />
              </Field>
              <Field label="House / flat, building, street" className="sm:col-span-2">
                <input className="input" value={addr.line1} onChange={set("line1")} autoComplete="address-line1" required />
              </Field>
              <Field label="Area, landmark (optional)" className="sm:col-span-2">
                <input className="input" value={addr.line2} onChange={set("line2")} autoComplete="address-line2" />
              </Field>
              <Field label="Pincode">
                <input
                  className="input"
                  value={addr.pincode}
                  onChange={(e) => setAddr((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  pattern="[1-9][0-9]{5}"
                  required
                />
              </Field>
              <Field label="City">
                <input className="input" value={addr.city} onChange={set("city")} autoComplete="address-level2" required />
              </Field>
              <Field label="State" className="sm:col-span-2">
                <Select value={addr.state} onChange={(v) => setAddr((a) => ({ ...a, state: v }))} options={STATES} label="State" searchable />
              </Field>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={business} onChange={(e) => setBusiness(e.target.checked)} className="size-4 accent-maroon" />
              <Building2 size={15} /> This is a business purchase (add GST invoice details)
            </label>
            {business && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Company name">
                  <input className="input" value={addr.company} onChange={set("company")} />
                </Field>
                <Field label="GSTIN">
                  <input className="input uppercase" value={addr.gstin} onChange={set("gstin")} maxLength={15} />
                </Field>
              </div>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <span className="grid size-7 place-items-center rounded-full bg-maroon text-xs text-white">2</span> Payment method
            </h2>
            <div className="mt-4 grid gap-3">
              {METHODS.map(({ id, label, sub, Icon }) => (
                <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-md border p-4 transition ${method === id ? "border-maroon bg-maroon/5 ring-2 ring-maroon/10" : "border-line"}`}>
                  <input type="radio" name="method" checked={method === id} onChange={() => setMethod(id)} className="accent-maroon" />
                  <Icon size={22} className="text-maroon" />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-xs text-muted">{sub}</span>
                  </span>
                  {id === "card" && (
                    <span className="hidden gap-1 sm:flex">
                      {["VISA", "MC", "RuPay"].map((n) => (
                        <span key={n} className="rounded border border-line px-1.5 py-0.5 text-[10px] font-bold text-ink-soft">
                          {n}
                        </span>
                      ))}
                      <span className="rounded bg-[#2e77bc] px-1.5 py-0.5 text-[10px] font-bold text-white">AMEX</span>
                    </span>
                  )}
                </label>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted">
              <Lock size={14} className="mt-0.5 shrink-0" /> You&apos;ll complete payment on Razorpay&apos;s PCI-DSS Level 1 secure page. We never see or store your card details.
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="card p-5">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
              {items.map((i) => (
                <li key={i.key} className="flex gap-3">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-[#f6f1ea]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb(i.image)} alt="" className="size-full object-contain" />
                    <span className="absolute -right-0 -top-0 grid size-5 place-items-center rounded-bl-lg bg-ink text-[10px] font-bold text-white">{i.qty}</span>
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="line-clamp-2">{i.name}</span>
                    {i.variantLabel && <span className="text-xs text-muted">{i.variantLabel}</span>}
                  </span>
                  <span className="text-sm font-semibold">{formatINR(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatINR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd>{shipping ? formatINR(shipping) : <span className="text-success">FREE</span>}</dd>
              </div>
              <div className="flex justify-between pt-2 text-lg font-bold">
                <dt>Total</dt>
                <dd>{formatINR(total)}</dd>
              </div>
            </dl>
            {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{err}</p>}
            <button className="btn-primary mt-5 hidden w-full !py-4 text-base lg:flex" disabled={busy}>
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Lock size={17} />} Pay {formatINR(total)}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
              <ShieldCheck size={14} className="text-success" /> 256-bit SSL · Secured by Razorpay
            </p>
          </div>
        </aside>

        <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white p-3 lg:hidden">
          {err && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-danger">{err}</p>}
          <button className="btn-primary w-full !py-4 text-base" disabled={busy}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Lock size={17} />} Pay securely · {formatINR(total)}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
