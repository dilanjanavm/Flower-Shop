import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AnnouncementBar, Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { Toaster } from "@/components/ui/bits";

const display = DM_Serif_Display({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-display", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://sithuliyaflora.lk"),
  title: { default: "Sithuliya Flora — Hand-tied bouquets in Colombo", template: "%s · Sithuliya Flora" },
  description:
    "Fresh hand-tied bouquets, custom arrangements and gifts from Sithuliya Flora, Colombo. Order 2 days ahead and pay by bank deposit.",
  openGraph: { type: "website", siteName: "Sithuliya Flora", locale: "en_LK" },
};

export const viewport: Viewport = { themeColor: "#fbf8f3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh">
        <StoreProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-cream">
            Skip to content
          </a>
          <AnnouncementBar />
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer />
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}
