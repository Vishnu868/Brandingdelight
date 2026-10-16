import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQs" };

const FAQ = [
  ["Which payment methods do you accept?", "UPI (GPay, PhonePe, Paytm, BHIM), credit and debit cards, net banking, wallets, EMI and Pay Later. All payments are processed securely by Razorpay."],
  ["Is it safe to pay with my card?", "Yes. You pay on Razorpay's PCI-DSS Level 1 certified checkout with 3-D Secure / OTP authentication. We never see or store your card number."],
  ["How long does delivery take?", "Most orders ship within 1–3 business days. Delivery typically takes 1–3 days within Hyderabad and 3–7 days elsewhere in India. Chocolates are shipped in cool packaging."],
  ["Is shipping free?", "Shipping is free on orders above ₹999. A flat ₹79 applies below that."],
  ["Can I add my company logo?", "Yes — most products can be branded with laser engraving, printing or custom sleeves. Use the Corporate Gifting page or WhatsApp us with quantity and artwork."],
  ["Some products say “Price on request”. Why?", "These are bulk/corporate items whose price depends on quantity and branding. Tap “Get a quote” and we'll reply quickly."],
  ["What is your return policy?", "Report damaged or wrong items within 48 hours of delivery with photos and we'll replace or refund. Food items and customised/branded products can't be returned unless damaged."],
  ["Do you provide GST invoices?", "Yes. Tick “business purchase” at checkout and enter your company name and GSTIN."],
];

export default function FaqPage() {
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="h-display text-4xl font-semibold">Frequently asked questions</h1>
      <div className="mt-8 space-y-3">
        {FAQ.map(([q, a]) => (
          <details key={q} className="card group p-5 open:shadow-[var(--shadow-pop)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
              {q}
              <span className="text-xl text-gold transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
