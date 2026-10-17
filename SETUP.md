# BrandingDelight Store — Setup Guide

A mobile-first e-commerce store (Next.js 15 + Tailwind 4) with **3,019 products** extracted from your 34 PDF catalogues,
customer accounts (Firebase), a database + image storage (Supabase), Razorpay payments (**UPI, Visa, Mastercard, RuPay,
American Express**, net banking, wallets, EMI) and an admin panel restricted to approved emails.

```
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

The site works immediately without any keys: products come from `src/data/catalog.json` and checkout runs in
**demo mode** (no money is taken). Add the services below one by one; each switches on a feature.

---

## 1. Firebase — customer login (Mobile OTP, Google, Email)

1. https://console.firebase.google.com → **Add project** (e.g. `brandingdelight`).
2. **Build → Authentication → Get started → Sign-in method**, enable:
   - **Phone** (OTP for Indian mobiles; add your test numbers under "Phone numbers for testing")
   - **Google**
   - **Email/Password**
3. **Authentication → Settings → Authorized domains**: add your live domain (e.g. `brandingdelight.in`) and your Vercel/Netlify domain.
4. **Project settings → General → Your apps → Web (</>)** → register → copy the config into the `NEXT_PUBLIC_FIREBASE_*` values.
5. **Project settings → Service accounts → Generate new private key** → from the downloaded JSON copy
   `project_id`, `client_email`, `private_key` into `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
   (keep the key on one line with `\n`, inside double quotes).

## 2. Admin access (only selected emails)

Set `ADMIN_EMAILS` to a comma-separated list, e.g.

```
ADMIN_EMAILS=brandingdelight@gmail.com,partner@yourcompany.com
```

An admin signs in at `/login` (use **Continue with Google**, or email + password after clicking the verification link),
then opens `/admin`. Every admin API re-checks the Firebase token **and** that the email is on the list **and** verified,
so nobody else can add/edit products or see orders — even by calling the API directly.

## 3. Supabase — products, orders, enquiries, product photos

1. https://supabase.com → **New project** (region: Mumbai `ap-south-1`).
2. **SQL Editor → New query** → paste the whole of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   This creates the tables, locks them down with RLS and creates the public `product-images` storage bucket.
3. **Project settings → API** → copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` and the **service_role** secret →
   `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose it in the browser).
4. Restart the server, sign in as an admin, open **/admin → Import catalogue**. All 3,019 catalogue products are copied
   into Supabase. From then on the store reads from Supabase and every admin change is live within seconds.
   Do this once, before adding your own products. Run it again whenever the bundled catalogue gets new products: it
   only adds missing ones and never overwrites products you have edited.

## 4. Razorpay — payments including American Express (Amex)

Razorpay was chosen because a single integration covers UPI, all card networks **including American Express**,
RuPay, net banking, wallets, EMI and Pay Later, with an Indian KYC flow and T+2 settlements. (CCAvenue and PayU also
support Amex; HDFC SmartGateway is bank-specific. Razorpay has the best mobile checkout and dashboard for this store.)

1. Sign up at https://dashboard.razorpay.com and complete business KYC (PAN, GST, bank account, website URL —
   use your live site so their team can see the policy pages under `/policies/*`).
2. **Enable American Express — this is a separate activation:** Dashboard → **Account & Settings → Payment methods**
   (or raise a request via **Support → Payment methods → Cards → Amex**). Razorpay activates Amex after Amex's own
   approval of your business; ask them to also enable **international cards** if you want foreign Amex/Visa cards.
   Once enabled, Amex cards appear automatically in the "Cards" block of the checkout — no code change needed.
3. **Account & Settings → API keys → Generate** (Test mode first) → `NEXT_PUBLIC_RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`.
4. **Settings → Webhooks → Add**: URL `https://YOUR-DOMAIN/api/webhooks/razorpay`, secret → `RAZORPAY_WEBHOOK_SECRET`,
   events `payment.captured`, `payment.failed`, `order.paid`.
5. Test with Razorpay's **test cards / test UPI IDs** (see https://razorpay.com/docs/payments/payments/test-card-details/ —
   includes an Amex test card). When everything passes, switch to **Live mode** keys.

How it's secured: the browser only sends product IDs + quantities; the server re-prices every item from the catalogue,
creates the Razorpay order, and marks the order paid only after verifying Razorpay's HMAC signature (and again via webhook).

## 5. Deploy (Vercel recommended)

1. Push this folder to GitHub → https://vercel.com → **Import** → framework auto-detected.
2. Add all variables from `.env.example` under **Settings → Environment Variables** (set `NEXT_PUBLIC_SITE_URL` to your domain).
3. Add your domain under **Settings → Domains** and add the same domain to Firebase "Authorized domains" and Razorpay.

Netlify also works (`npm run build`, Next.js runtime is auto-installed).

---

## What's inside

| Area | Path |
| --- | --- |
| Home (hero, categories, rails, brands) | `src/app/page.tsx` |
| Shop / search / filters | `src/app/shop`, `src/components/Listing.tsx` |
| Category & brand pages | `src/app/category/[slug]`, `src/app/brand/[slug]` |
| Product page (gallery, options, buy box, specs) | `src/app/product/[slug]` |
| Cart, wishlist, checkout, order confirmation | `src/app/cart`, `wishlist`, `checkout`, `order/[id]` |
| Login & account | `src/app/login`, `src/app/account` |
| Admin (dashboard, products, add/edit with image upload, orders, enquiries) | `src/app/admin/*` |
| APIs | `src/app/api/*` |
| Catalogue data (792 products) | `src/data/catalog.json` |
| Product images — full resolution / 640px thumbnails | `public/catalog/*`, `public/thumbs/*` |

**Speed:** every page is statically generated or cached (ISR, 10 min) and refreshed instantly when an admin saves;
listing pages filter in the browser with infinite scroll; images are pre-optimised WebP with instant thumbnails and
full-resolution images fading in; skeleton loaders appear while pages load.

**Products marked "Price on request"** (≈210, from the FUZO, electronics, dry fruits and SNITCH catalogues, which had no
prices) show a WhatsApp quote button. Add a price in **Admin → Products → Edit** and they become buyable instantly.
