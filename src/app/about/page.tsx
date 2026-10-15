import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About us" };

export default function AboutPage() {
  return (
    <div className="container-x max-w-3xl py-10 sm:py-14">
      <p className="eyebrow">Who we are</p>
      <h1 className="h-display mt-2 text-4xl font-semibold">BrandingDelight</h1>
      <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-ink-soft">
        <p>
          BrandingDelight is a Hyderabad-based premium gifting company. For years we have helped businesses create memorable impressions with bespoke corporate gifts and
          personalised brand merchandise — and now every one of our curated products is available to buy online.
        </p>
        <p>
          We partner directly with brands like Lifelong, SMOOR, Tamta, FUZO, HRX, SNITCH, Swiss Military, LOYKA, Unwrap Happiness and Everyday Organisers, so everything
          you buy is 100% genuine with full brand warranty.
        </p>
        <p>
          Need your logo on it? Our in-house branding team offers laser engraving, screen printing, digital embroidery, UV and DTF printing, banners and canvas printing.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/shop" className="btn-primary">
          Shop now
        </Link>
        <Link href="/corporate-gifting" className="btn-outline">
          Corporate gifting
        </Link>
      </div>
    </div>
  );
}
