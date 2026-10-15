"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onIdTokenChanged, signOut as fbSignOut, type User } from "firebase/auth";
import { firebaseAuth, firebaseConfigured } from "@/lib/firebase/client";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  configured: boolean;
  token: () => Promise<string | null>;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const auth = firebaseAuth();
    if (!auth) return;
    return onIdTokenChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (!u) return setIsAdmin(false);
      try {
        const t = await u.getIdToken();
        const r = await fetch("/api/me", { headers: { Authorization: `Bearer ${t}` } });
        setIsAdmin(r.ok ? Boolean((await r.json()).isAdmin) : false);
      } catch {
        setIsAdmin(false);
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

  const signOut = useCallback(async () => {
    const auth = firebaseAuth();
    if (auth) await fbSignOut(auth);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, isAdmin, configured: firebaseConfigured, token, authFetch, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}
