# BrandingDelight — Premium Gifting Store

Mobile-first e-commerce store for BrandingDelight (Hyderabad): 3,006 products from 34 brand catalogues — Lifelong,
SMOOR, Tamta, FUZO, HRX, SNITCH, Swiss Military, Kamiliant, LOYKA, Unwrap Happiness, Everyday Organisers,
Aquaminder, Nutsio and more.

- Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · Zustand
- Firebase Auth (mobile OTP, Google, email) · Supabase (Postgres + Storage) · Razorpay (UPI, cards incl. Amex, net banking)
- Admin panel at `/admin`, restricted to the emails in `ADMIN_EMAILS`

```bash
npm install
cp .env.example .env.local   # fill in keys — optional for a first look
npm run dev
```

See **[SETUP.md](SETUP.md)** for Firebase, Supabase, Razorpay (Amex activation) and deployment steps.
