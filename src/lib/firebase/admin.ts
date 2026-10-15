import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let app: App | null = null;

export const firebaseAdminConfigured = () =>
  Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

function adminApp(): App | null {
  if (!firebaseAdminConfigured()) return null;
  if (!app) {
    app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // env files store the key with literal \n sequences
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        }),
      });
  }
  return app;
}

export type SessionUser = { uid: string; email: string | null; emailVerified: boolean; phone: string | null; name: string | null };

/** Verifies a Firebase ID token from the `Authorization: Bearer <token>` header. */
export async function userFromRequest(req: Request): Promise<SessionUser | null> {
  const a = adminApp();
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!a || !token) return null;
  try {
    const d = await getAuth(a).verifyIdToken(token);
    return { uid: d.uid, email: d.email ?? null, emailVerified: d.email_verified === true, phone: d.phone_number ?? null, name: (d.name as string) ?? null };
  } catch {
    return null;
  }
}

export const adminEmails = () =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const isAdminEmail = (email: string | null | undefined) =>
  Boolean(email && adminEmails().includes(email.toLowerCase()));

/** An admin must hold a valid Firebase token for an allow-listed email that Firebase has VERIFIED
 *  (Google sign-in, or email/password after clicking the verification link). Without the verified check,
 *  anyone could register an unverified password account using an admin's address. */
export const isAdminUser = (u: SessionUser | null) => Boolean(u && u.emailVerified && isAdminEmail(u.email));

export async function requireAdmin(req: Request) {
  const u = await userFromRequest(req);
  return isAdminUser(u) ? u : null;
}
