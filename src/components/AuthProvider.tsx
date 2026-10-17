"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onIdTokenChanged, signOut as fbSignOut, updateProfile, type User } from "firebase/auth";
import { firebaseAuth, firebaseConfigured } from "@/lib/firebase/client";

export type Profile = { name: string; phone: string };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  configured: boolean;
  /** Saved name + mobile for the signed-in user (null until loaded / when signed out). */
  profile: Profile | null;
  profileLoaded: boolean;
  saveProfile: (p: Profile) => Promise<void>;
  token: () => Promise<string | null>;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);
const localKey = (uid: string) => `bd-profile-${uid}`;

export const profileComplete = (p: Profile | null) => Boolean(p && p.name.trim().length >= 2 && /^[6-9]\d{9}$/.test(p.phone));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    const auth = firebaseAuth();
    if (!auth) return;
    return onIdTokenChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (!u) {
        setIsAdmin(false);
        setProfile(null);
        setProfileLoaded(false);
        return;
      }
      try {
        const t = await u.getIdToken();
        const headers = { Authorization: `Bearer ${t}` };
        const [me, pr] = await Promise.all([fetch("/api/me", { headers }), fetch("/api/profile", { headers })]);
        setIsAdmin(me.ok ? Boolean((await me.json()).isAdmin) : false);
        const saved = pr.ok ? ((await pr.json()).profile as Profile | null) : null;
        let local: Profile | null = null;
        try {
          local = JSON.parse(localStorage.getItem(localKey(u.uid)) || "null");
        } catch {
          /* ignore */
        }
        // Fill gaps from the login itself (Google name, OTP phone number).
        const fromAuth: Profile = { name: u.displayName ?? "", phone: (u.phoneNumber ?? "").replace(/^\+91/, "") };
        const merged = saved ?? local ?? fromAuth;
        setProfile({ name: merged.name || fromAuth.name, phone: merged.phone || fromAuth.phone });
      } catch {
        setIsAdmin(false);
      } finally {
        setProfileLoaded(true);
      }
    });
  }, []);

  const token = useCallback(async () => (user ? user.getIdToken() : null), [user]);

  const authFetch = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const t = await token();
      const headers = new Headers(init.headers);
      if (t) headers.set("Authorization", `Bearer ${t}`);
      return fetch(url, { ...init, headers });
    },
    [token]
  );

  const saveProfile = useCallback(
    async (p: Profile) => {
      if (!user) return;
      const r = await authFetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Could not save your details");
      try {
        localStorage.setItem(localKey(user.uid), JSON.stringify(p));
      } catch {
        /* ignore */
      }
      if (p.name && p.name !== user.displayName) await updateProfile(user, { displayName: p.name }).catch(() => {});
      setProfile(p);
    },
    [user, authFetch]
  );

  const signOut = useCallback(async () => {
    const auth = firebaseAuth();
    if (auth) await fbSignOut(auth);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, isAdmin, configured: firebaseConfigured, profile, profileLoaded, saveProfile, token, authFetch, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}
