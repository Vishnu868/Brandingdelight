"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

/** Small fetch hook for admin APIs (adds the Firebase token, exposes loading/error/reload). */
export function useAdminData<T>(url: string | null) {
  const { authFetch } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url));

  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const r = await authFetch(url);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Request failed");
      setData(j);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [url, authFetch]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}

export function useAdminMutation() {
  const { authFetch } = useAuth();
  return useCallback(
    async (url: string, method: string, body?: unknown) => {
      const r = await authFetch(url, {
        method,
        headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
        body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Request failed");
      return j;
    },
    [authFetch]
  );
}
