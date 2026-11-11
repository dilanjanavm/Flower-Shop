import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      updated="10 November 2026"
      sections={[
        { h: "Orders", body: <p>All orders, including custom bouquets, must be placed at least 2 days before the delivery or pickup date. An order is confirmed only after we verify your bank deposit slip.</p> },
        { h: "Payment", body: <p>We accept bank deposits and online transfers only. Orders without a valid slip are cancelled automatically at the end of the payment window and the delivery slot is released.</p> },
        { h: "Custom bouquets", body: <p>A custom bouquet request is not an order. We reply with a quotation valid until the time shown. Accepting a quotation creates an order that follows the same payment rules.</p> },
        { h: "Substitutions", body: <p>Flowers are natural and seasonal. If a stem is unavailable on the day, our florist may substitute one of equal or greater value in the same style and colour.</p> },
        { h: "Delivery", body: <p>We deliver within our published zones and time slots. If the recipient can&apos;t be reached, we&apos;ll contact you to arrange another attempt.</p> },
        { h: "Cancellations & refunds", body: <p>You may cancel while an order is awaiting payment. After confirmation, cancellations are at the shop&apos;s discretion; approved refunds are paid by bank transfer.</p> },
      ]}
    />
  );
}
