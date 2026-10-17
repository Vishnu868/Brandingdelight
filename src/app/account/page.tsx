"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { Heart, LayoutDashboard, LogOut, MapPin, Package, User } from "lucide-react";
import { profileComplete, useAuth } from "@/components/AuthProvider";
import { ContactFields } from "@/components/ContactFields";
import { Modal } from "@/components/Modal";
import { StatusPill } from "@/components/StatusPill";
import { useMounted } from "@/components/Header";
import { formatINR, thumb } from "@/lib/format";
import { useLocalOrders, useToast, useWishlist } from "@/lib/store";
import type { Address, Order } from "@/lib/types";

export default function AccountPage() {
  const router = useRouter();
  const mounted = useMounted();
  const { user, loading, isAdmin, authFetch, signOut, configured, profile, profileLoaded, saveProfile } = useAuth();
  const [askLater, setAskLater] = useState(false);
  const local = useLocalOrders((s) => s.orders);
  const wish = useWishlist((s) => s.items.length);
  const toast = useToast((s) => s.push);
  const [orders, setOrders] = useState<(Order & { trackingUrl?: string })[] | null>(null);
  const [tab, setTab] = useState<"orders" | "profile" | "address">("orders");
  const [addr, setAddr] = useState<Partial<Address>>({});

  useEffect(() => {
    if (!loading && !user && configured) router.replace("/login?next=/account");
  }, [loading, user, router, configured]);
  useEffect(() => {
    if (!user) return;
    authFetch("/api/orders")
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => setOrders(d.orders));
  }, [user, authFetch]);
  useEffect(() => {
    try {
      setAddr(JSON.parse(localStorage.getItem("bd-address") || "{}"));
    } catch {
      /* ignore */
    }
  }, []);

  if (!mounted || (configured && (loading || !user))) return <div className="container-x py-10"><div className="skeleton h-96 rounded-lg" /></div>;

  const all = [...(orders ?? []), ...local.filter((l) => !(orders ?? []).some((o) => o.id === l.id))];

  return (
    <div className="container-x py-6 sm:py-10">
      <Modal
        open={Boolean(user && profileLoaded && !profileComplete(profile) && !askLater)}
        onClose={() => setAskLater(true)}
        title="Complete your profile"
        subtitle="Add your name and mobile number for order updates and faster quotes."
      >
        <ContactFields
          initial={profile ?? undefined}
          submitLabel="Save & continue"
          onSubmit={async (p) => {
            await saveProfile(p);
            toast("Profile saved");
          }}
        />
      </Modal>
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-14 place-items-center rounded-full bg-maroon text-xl font-semibold text-white">
          {(user?.displayName || user?.email || "G")[0].toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="h-display text-2xl font-semibold">Hello, {user?.displayName || user?.email?.split("@")[0] || user?.phoneNumber || "Guest"}</h1>
          <p className="truncate text-sm text-muted">{user?.email || user?.phoneNumber || "Guest orders on this device"}</p>
        </div>
        {isAdmin && (
          <Link href="/admin" className="btn-gold">
            <LayoutDashboard size={16} /> Admin
          </Link>
        )}
        {user && (
          <button
            className="btn-outline"
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        )}
      </div>

      {user?.email && !user.emailVerified && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md bg-gold-soft px-4 py-3 text-sm">
          Please verify your email to link past guest orders.
          <button className="font-semibold text-maroon" onClick={() => sendEmailVerification(user).then(() => toast("Verification email sent"))}>
            Send verification link
          </button>
        </div>
      )}

      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {[
          ["orders", "My orders", Package],
          ["profile", "Profile", User],
          ["address", "Saved address", MapPin],
        ].map(([k, l, I]) => {
          const Icon = I as typeof Package;
          return (
            <button key={k as string} onClick={() => setTab(k as typeof tab)} className={`chip shrink-0 !px-4 !py-2 !text-sm ${tab === k ? "!border-maroon !bg-maroon !text-white" : ""}`}>
              <Icon size={15} /> {l as string}
            </button>
          );
        })}
        <Link href="/wishlist" className="chip shrink-0 !px-4 !py-2 !text-sm">
          <Heart size={15} /> Wishlist ({wish})
        </Link>
      </div>

      {tab === "orders" && (
        <div className="mt-6 space-y-4">
          {orders === null && user ? (
            <div className="skeleton h-32 rounded-lg" />
          ) : all.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="h-display text-xl font-semibold">No orders yet</p>
              <Link href="/shop" className="btn-primary mt-4">
                Start shopping
              </Link>
            </div>
          ) : (
            all.map((o) => (
              <div key={o.id} className="card p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Order {o.id}</p>
                    <p className="text-xs text-muted">{new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                  <StatusPill s={o.status} />
                </div>
                <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                  {o.items.map((l, k) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={k} src={thumb(l.image || "/placeholder.svg")} alt={l.name} title={l.name} className="size-16 shrink-0 rounded-lg bg-[#f6f1ea] object-contain" />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted">{o.items.reduce((n, l) => n + l.qty, 0)} items</span>
                  <span className="font-bold">{formatINR(o.total)}</span>
                </div>
                {o.trackingUrl && (
                  <a href={o.trackingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-maroon">
                    Track shipment →
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "profile" && user && (
        <div className="card mt-6 max-w-lg p-5">
          <ContactFields
            key={`${profile?.name}-${profile?.phone}`}
            initial={profile ?? undefined}
            submitLabel="Save details"
            onSubmit={async (p) => {
              await saveProfile(p);
              toast("Profile saved");
            }}
          />
          {user.email && <p className="mt-4 text-sm text-muted">Signed in as {user.email}</p>}
        </div>
      )}

      {tab === "address" && (
        <div className="card mt-6 max-w-lg p-5 text-sm">
          {addr.line1 ? (
            <>
              <p className="font-semibold">{addr.fullName}</p>
              <p className="mt-1 text-ink-soft">
                {addr.line1}
                {addr.line2 && `, ${addr.line2}`}
                <br />
                {addr.city}, {addr.state} {addr.pincode}
                <br />
                {addr.phone} · {addr.email}
              </p>
              <p className="mt-3 text-xs text-muted">This address is pre-filled at checkout; edit it there anytime.</p>
            </>
          ) : (
            <p className="text-muted">No saved address yet — it will be saved automatically on your first checkout.</p>
          )}
        </div>
      )}
    </div>
  );
}
