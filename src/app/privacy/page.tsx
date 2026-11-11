import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="10 November 2026"
      sections={[
        { h: "What we collect", body: <p>Your name, email, mobile number, recipient details and order history; bank slips you upload; and delivery photos taken by our riders.</p> },
        { h: "How we use it", body: <p>To fulfil and deliver orders, verify payments, send order updates by SMS, email or WhatsApp, and — only if you opt in — seasonal offers.</p> },
        { h: "Anonymous gifting", body: <p>If you choose to send anonymously, your name and contact details are hidden from the recipient, the rider, the waybill and the public tracking link.</p> },
        { h: "Retention", body: <p>Order and payment records are kept for 7 years for tax purposes. Bank slips and delivery photos are deleted after 2 years.</p> },
        { h: "Your rights (PDPA No. 9 of 2022)", body: <p>You can request a copy of your data or ask us to delete your account. We&apos;ll respond within 30 days. Deleting an account anonymises personal data while keeping financial records.</p> },
        { h: "Contact", body: <p>Email privacy@sithuliyaflora.lk for any privacy request.</p> },
      ]}
    />
  );
}
