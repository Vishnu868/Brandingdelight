import type { Metadata } from "next";
import Link from "next/link";
import { Award, Boxes, Brush, FileText, Gift, Truck } from "lucide-react";
import { EnquiryForm } from "@/components/EnquiryForm";

export const metadata: Metadata = {
  title: "Corporate gifting",
  description: "Bulk corporate gifts with your logo — Diwali hampers, welcome kits, tech gifts, copper bottles and more. GST invoices, pan-India multi-address delivery.",
};

export default function CorporatePage() {
  return (
    <>
      <section className="bg-maroon text-white">
        <div className="container-x py-12 sm:py-16">
          <p className="eyebrow !text-[#e9c98b]">BrandingDelight for Business</p>
          <h1 className="h-display mt-2 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">Gifts that carry your brand — beautifully</h1>
          <p className="mt-4 max-w-2xl text-white/80">
            From 25 to 25,000 units: festive hampers, employee onboarding kits, client gifts and event merchandise, branded and delivered anywhere in India.
          </p>
        </div>
      </section>
      <section className="container-x mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          [Brush, "Custom branding", "Laser engraving, screen & UV printing, DTF, embroidery, branded sleeves and ribbons."],
          [Boxes, "3,000+ products", "Hampers, gift sets, chocolates, copper, brass decor, appliances, gadgets, desk and travel gear."],
          [Gift, "Curated hampers", "Build-your-own boxes with personalised notes and premium packaging."],
          [FileText, "GST invoicing", "Proper tax invoices, POs and flexible payment terms for companies."],
          [Truck, "Multi-address delivery", "Ship to every employee's home or one office — pan-India."],
          [Award, "Genuine brands", "Lifelong, SMOOR, Tamta, FUZO, HRX, Swiss Military, LOYKA and more."],
        ].map(([I, t, d]) => {
          const Icon = I as typeof Gift;
          return (
            <div key={t as string} className="card p-6">
              <Icon className="text-gold" size={28} />
              <h3 className="mt-3 text-lg font-semibold">{t as string}</h3>
              <p className="mt-1 text-sm text-muted">{d as string}</p>
            </div>
          );
        })}
      </section>
      <section className="container-x mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="h-display text-3xl font-semibold">How it works</h2>
          <ol className="mt-5 space-y-5">
            {[
              "Tell us the occasion, quantity, budget and timeline.",
              "Get a curated shortlist with mock-ups of your logo on the products.",
              "Approve samples, confirm the order and share delivery addresses.",
              "We brand, pack and dispatch — with tracking for every parcel.",
            ].map((s, k) => (
              <li key={k} className="flex gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-soft font-semibold text-gold">{k + 1}</span>
                <p className="pt-1.5 text-ink-soft">{s}</p>
              </li>
            ))}
          </ol>
          <Link href="/category/festive-hampers-gift-boxes" className="btn-outline mt-6">
            Browse hampers
          </Link>
        </div>
        <EnquiryForm />
      </section>
    </>
  );
}
