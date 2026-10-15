"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  RecaptchaVerifier,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  updateProfile,
  type ConfirmationResult,
} from "firebase/auth";
import { Loader2, Mail, Smartphone } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { LogoMark } from "@/components/Logo";
import { firebaseAuth } from "@/lib/firebase/client";

function friendly(e: unknown) {
  const code = (e as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/email-already-in-use": "An account already exists with this email. Sign in instead.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-phone-number": "Enter a valid 10-digit mobile number.",
    "auth/invalid-verification-code": "That OTP is incorrect.",
    "auth/too-many-requests": "Too many attempts. Please wait a minute and try again.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
  };
  return map[code] ?? (e as Error)?.message ?? "Something went wrong.";
}

function LoginInner() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/account";
  const { user, configured } = useAuth();
  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirm, setConfirm] = useState<ConfirmationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const captcha = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  const run = async (fn: () => Promise<void>) => {
    setErr(null);
    setInfo(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setErr(friendly(e));
    } finally {
      setBusy(false);
    }
  };

  const auth = firebaseAuth();

  if (!configured || !auth)
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <h1 className="h-display text-2xl font-semibold">Sign-in not configured yet</h1>

      </div>
    );

  return (
    <div className="card mx-auto w-full max-w-md p-6 sm:p-8">
      <div className="text-center">
        <span className="inline-block">
          <LogoMark size={48} />
        </span>
        <h1 className="h-display mt-3 text-2xl font-semibold">{mode === "up" && tab === "email" ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-muted">Sign in to track orders, save addresses and your wishlist.</p>
      </div>

      <div className="mt-6 grid grid-cols-2 rounded-full bg-sand p-1 text-sm font-semibold">
        {(["phone", "email"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex items-center justify-center gap-1.5 rounded-full py-2 ${tab === t ? "bg-white shadow" : "text-muted"}`}>
            {t === "phone" ? <Smartphone size={15} /> : <Mail size={15} />} {t === "phone" ? "Mobile OTP" : "Email"}
          </button>
        ))}
      </div>

      {tab === "phone" ? (
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              if (!confirm) {
                captcha.current ??= new RecaptchaVerifier(auth, "recaptcha", { size: "invisible" });
                const c = await signInWithPhoneNumber(auth, `+91${phone}`, captcha.current);
                setConfirm(c);
                setInfo(`OTP sent to +91 ${phone}`);
              } else {
                await confirm.confirm(otp);
              }
            });
          }}
        >
          {!confirm ? (
            <div>
              <label className="label" htmlFor="phone">
                Mobile number
              </label>
              <div className="flex">
                <span className="grid place-items-center rounded-l-xl border border-r-0 border-line bg-sand px-3 text-sm font-semibold">+91</span>
                <input
                  id="phone"
                  className="input !rounded-l-none"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="98765 43210"
                  required
                  pattern="[6-9][0-9]{9}"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="label" htmlFor="otp">
                Enter 6-digit OTP
              </label>
              <input
                id="otp"
                className="input text-center text-lg tracking-[0.5em]"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                autoFocus
              />
              <button type="button" className="mt-2 text-xs font-semibold text-maroon" onClick={() => (setConfirm(null), setOtp(""))}>
                Change number
              </button>
            </div>
          )}
          <button className="btn-primary w-full !py-3.5" disabled={busy}>
            {busy && <Loader2 size={17} className="animate-spin" />} {confirm ? "Verify & continue" : "Send OTP"}
          </button>
          <div id="recaptcha" />
        </form>
      ) : (
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              if (mode === "up") {
                const c = await createUserWithEmailAndPassword(auth, email, password);
                if (name) await updateProfile(c.user, { displayName: name });
                await sendEmailVerification(c.user).catch(() => {});
              } else await signInWithEmailAndPassword(auth, email, password);
            });
          }}
        >
          {mode === "up" && (
            <div>
              <label className="label" htmlFor="name">
                Full name
              </label>
              <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div>
            <label className="label" htmlFor="pw">
              Password
            </label>
            <input
              id="pw"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "up" ? "new-password" : "current-password"}
              minLength={6}
              required
            />
            {mode === "in" && (
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-maroon"
                onClick={() =>
                  run(async () => {
                    if (!email) throw new Error("Enter your email first.");
                    await sendPasswordResetEmail(auth, email);
                    setInfo("Password reset link sent to your email.");
                  })
                }
              >
                Forgot password?
              </button>
            )}
          </div>
          <button className="btn-primary w-full !py-3.5" disabled={busy}>
            {busy && <Loader2 size={17} className="animate-spin" />} {mode === "up" ? "Create account" : "Sign in"}
          </button>
          <p className="text-center text-sm text-muted">
            {mode === "in" ? "New here?" : "Already have an account?"}{" "}
            <button type="button" className="font-semibold text-maroon" onClick={() => setMode(mode === "in" ? "up" : "in")}>
              {mode === "in" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </form>
      )}

      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{err}</p>}
      {info && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-success">{info}</p>}

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
      <button className="btn-outline w-full !py-3" disabled={busy} onClick={() => run(async () => void (await signInWithPopup(auth, new GoogleAuthProvider())))}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.4 35.4 44 30.1 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="container-x py-10">
      <Suspense>
        <LoginInner />
      </Suspense>
    </div>
  );
}
