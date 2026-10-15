import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { EnquiryForm } from "@/components/EnquiryForm";
import { SITE, whatsappLink } from "@/lib/format";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  return (
    <div className="container-x py-10">
      <h1 className="h-display text-4xl font-semibold">Contact us</h1>
      <p className="mt-1 text-muted">We usually reply within a few hours.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-3">
          {[
            [Phone, "Call", SITE.phone, `tel:${SITE.phoneRaw}`],
            [MessageCircle, "WhatsApp", SITE.phone, whatsappLink("Hi BrandingDelight!")],
            [Mail, "Email", SITE.email, `mailto:${SITE.email}`],
            [MapPin, "Address", SITE.address, "https://maps.google.com/?q=Hyderabad+500078"],
            [Clock, "Hours", "Mon–Sat, 10 am – 7 pm", null],
          ].map(([I, t, v, h]) => {
            const Icon = I as typeof Phone;
            const inner = (
              <>
                <Icon className="text-gold" size={22} />
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted">{t as string}</span>
                  <span className="font-medium">{v as string}</span>
                </span>
              </>
            );
            return h ? (
              <a key={t as string} href={h as string} target="_blank" rel="noreferrer" className="card flex items-center gap-4 p-4 hover:shadow-[var(--shadow-pop)]">
                {inner}
              </a>
            ) : (
              <div key={t as string} className="card flex items-center gap-4 p-4">
                {inner}
              </div>
            );
          })}
        </div>
        <EnquiryForm />
      </div>
    </div>
  );
}
