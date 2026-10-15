import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/format";

const POLICIES: Record<string, { title: string; body: string[] }> = {
  shipping: {
    title: "Shipping policy",
    body: [
      "We ship across India through trusted courier partners. Orders are dispatched within 1–3 business days of payment confirmation; customised or bulk orders follow the timeline agreed in your quote.",
      "Shipping is free on orders of ₹999 and above; a flat fee of ₹79 applies to smaller orders. Tracking details are shared by SMS/WhatsApp and email once your order ships.",
      "Perishable items such as chocolates are packed with cooling material. Delivery times may vary during festivals and in remote pin codes.",
    ],
  },
  returns: {
    title: "Returns & refunds",
    body: [
      "If an item arrives damaged, defective or incorrect, contact us within 48 hours of delivery with photos/video of the package and product. We will arrange a replacement or a full refund.",
      "Food products, personal-care items and customised/branded products are not eligible for return unless they arrive damaged.",
      "Approved refunds are issued to the original payment method (card, UPI, net banking, wallet) within 5–7 business days. Appliance warranty claims are handled by the respective brand's service network; we will help you raise them.",
    ],
  },
  privacy: {
    title: "Privacy policy",
    body: [
      "We collect the information needed to process your order — name, phone, email and delivery address — and use it only to fulfil orders, provide support and, if you agree, share offers.",
      "Payments are processed by Razorpay. We do not receive or store your card number, CVV or UPI PIN.",
      "We never sell your personal data. You may request access to or deletion of your data by writing to " + SITE.email + ".",
    ],
  },
  terms: {
    title: "Terms & conditions",
    body: [
      "All prices are in Indian Rupees and include applicable GST unless stated otherwise. Product images are representative; packaging and hamper contents may vary slightly based on availability, with items of equal or higher value.",
      "Orders are confirmed only after successful payment. We reserve the right to cancel an order in case of pricing errors or stock unavailability, with a full refund.",
      "These terms are governed by the laws of India, with jurisdiction in Hyderabad, Telangana.",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = POLICIES[(await params).slug];
  return p ? { title: p.title } : {};
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = POLICIES[(await params).slug];
  if (!p) notFound();
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="h-display text-4xl font-semibold">{p.title}</h1>
      <div className="mt-6 space-y-4 text-[15.5px] leading-relaxed text-ink-soft">
        {p.body.map((t, k) => (
          <p key={k}>{t}</p>
        ))}
        <p className="text-sm text-muted">
          Questions? Email {SITE.email} or call {SITE.phone}.
        </p>
      </div>
    </div>
  );
}
