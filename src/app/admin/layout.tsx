"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ExternalLink, Inbox, LayoutDashboard, Loader2, LogOut, PlusCircle, ShieldAlert, ShoppingCart } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { LogoMark } from "@/components/Logo";

const NAV = [
  ["/admin", "Dashboard", LayoutDashboard],
  ["/admin/products", "Products", Boxes],
  ["/admin/products/new", "Add product", PlusCircle],
  ["/admin/orders", "Orders", ShoppingCart],
  ["/admin/enquiries", "Enquiries", Inbox],
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { user, loading, isAdmin, configured, signOut } = useAuth();

  if (!configured)
    return <Gate title="Firebase not configured" text="Add Firebase keys and ADMIN_EMAILS to .env.local (see SETUP.md), then restart the server." />;
  if (loading)
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader2 className="animate-spin text-maroon" size={32} />
      </div>
    );
  if (!user) return <Gate title="Admin sign-in required" text="Sign in with an approved admin account." action={<Link href="/login?next=/admin" className="btn-primary mt-5">Sign in</Link>} />;
  if (!isAdmin)
    return (
      <Gate
        title="Access denied"
        text={`${user.email ?? user.phoneNumber} is not an approved admin. Admins must sign in with an allow-listed, verified email (Google sign-in recommended).`}
        action={
          <button className="btn-outline mt-5" onClick={() => signOut()}>
            Sign out
          </button>
        }
      />
    );

  const active = (h: string) => (h === "/admin" ? path === "/admin" : h === "/admin/products" ? path === "/admin/products" || /^\/admin\/products\/(?!new)/.test(path) : path.startsWith(h));

  return (
    <div className="min-h-dvh bg-[#f5f1eb] lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-line bg-ink text-white lg:h-dvh lg:border-0">
        <div className="flex items-center gap-2.5 px-4 py-3 lg:px-5 lg:py-6">
          <LogoMark size={32} />
          <span className="leading-tight">
            <span className="block text-sm font-semibold">BrandingDelight</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-white/50">Admin</span>
          </span>
          <Link href="/" className="ml-auto rounded-full p-2 text-white/60 hover:text-white lg:hidden" aria-label="View store">
            <ExternalLink size={17} />
          </Link>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
          {NAV.map(([h, l, Icon]) => (
            <Link
              key={h}
              href={h}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${active(h) ? "bg-white/15 font-semibold text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`}
            >
              <Icon size={17} /> {l}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 hidden w-full border-t border-white/10 p-4 text-xs text-white/60 lg:block">
          <p className="truncate">{user.email}</p>
          <div className="mt-2 flex gap-3">
            <Link href="/" className="flex items-center gap-1 hover:text-white">
              <ExternalLink size={13} /> Store
            </Link>
            <button onClick={() => signOut()} className="flex items-center gap-1 hover:text-white">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </aside>
      <div className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}

function Gate({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="card max-w-md p-8 text-center">
        <ShieldAlert className="mx-auto text-maroon" size={40} />
        <h1 className="h-display mt-3 text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted">{text}</p>
        {action}
        <Link href="/" className="mt-4 block text-sm text-muted underline">
          Back to store
        </Link>
      </div>
    </div>
  );
}
