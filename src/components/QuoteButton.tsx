"use client";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { profileComplete, useAuth, type Profile } from "./AuthProvider";
import { ContactFields } from "./ContactFields";
import { Modal } from "./Modal";
import { whatsappLink } from "@/lib/format";

const openWhatsApp = (text: string) => {
  const url = whatsappLink(text);
  const w = window.open(url, "_blank", "noopener");
  if (!w) window.location.href = url; // popup blocked (some in-app browsers)
};

/**
 * WhatsApp quote button.
 * - Signed in with name + mobile saved → opens WhatsApp straight away with those details.
 * - Signed in but details missing → asks once, saves them to the profile, then opens WhatsApp.
 * - Guest → asks for name + mobile in a popup, opens WhatsApp; nothing is stored.
 */
export function QuoteButton({ message, children, className = "btn-outline", title = "Get a quote on WhatsApp" }: { message: string; children: React.ReactNode; className?: string; title?: string }) {
  const { user, profile, saveProfile } = useAuth();
  const [open, setOpen] = useState(false);

  const send = (p: Profile) => openWhatsApp(`${message}\n\nName: ${p.name}\nMobile: +91 ${p.phone}`);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          if (user && profileComplete(profile)) send(profile!);
          else setOpen(true);
        }}
      >
        {children}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} subtitle="Share your name and mobile number so our team can reply with the best price.">
        <ContactFields
          initial={profile ?? undefined}
          submitLabel="Continue to WhatsApp"
          icon={<MessageCircle size={17} />}
          onSubmit={async (p) => {
            if (user) await saveProfile(p).catch(() => {}); // signed-in: remember for next time
            send(p);
            setOpen(false);
          }}
        />
      </Modal>
    </>
  );
}
