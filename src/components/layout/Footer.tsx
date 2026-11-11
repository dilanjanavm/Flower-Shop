"use client";

import Link from "next/link";
import { useState } from "react";
import { settings } from "@/lib/mock/delivery";
import { Icon } from "../ui/Icon";
import { useStore } from "@/lib/store";

const cols = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All bouquets" },
      { href: "/shop?occasion=birthday", label: "Birthday" },
      { href: "/shop?occasion=anniversary", label: "Anniversary" },
      { href: "/shop?occasion=sympathy", label: "Sympathy" },
      { href: "/custom-bouquet", label: "Design your own" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/track", label: "Track an order" },
      { href: "/delivery", label: "Delivery & payment" },
      { href: "/contact", label: "Contact us" },
      { href: "/account/quotations", label: "My quotations" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "Our story" },
      { href: "/terms", label: "Terms of service" },
      { href: "/privacy", label: "Privacy policy" },
    ],
  },
];

export function Footer() {
  const { toast } = useStore();
  const [email, setEmail] = useState("");
  return (
    <footer className="mt-24 bg-ink text-cream">
      <div className="container-x grid gap-14 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-word-white.png" alt="Sithuliya Flora" className="h-9 w-auto opacity-95" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/65">
            Hand-tied bouquets and custom arrangements from our studio in Colombo — made fresh for every order, delivered with care.
          </p>
          <form
            className="mt-7 flex max-w-sm items-center rounded-full bg-cream/10 p-1.5 ring-1 ring-cream/15 focus-within:ring-blush-300"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.includes("@")) return;
              setEmail("");
              toast({ title: "You're subscribed", body: "Seasonal blooms and offers, about twice a month.", tone: "success" });
            }}
          >
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Your email address" aria-label="Email address" className="min-w-0 flex-1 bg-transparent px-4 text-sm text-cream outline-none placeholder:text-cream/45" />
            <button className="rounded-full bg-cream px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-blush-200">Subscribe</button>
          </form>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {cols.map((c) => (
            <div key={c.title}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-blush-300">{c.title}</p>
              <ul className="space-y-2.5 text-sm text-cream/75">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="link-underline hover:text-cream">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-blush-300">Visit</p>
            <ul className="space-y-2.5 text-sm text-cream/75">
              <li className="flex gap-2"><Icon name="pin" size={16} className="mt-0.5 shrink-0" />{settings.shop.address}</li>
              <li className="flex gap-2"><Icon name="phone" size={16} className="mt-0.5 shrink-0" />{settings.shop.phone}</li>
              <li className="flex gap-2"><Icon name="clock" size={16} className="mt-0.5 shrink-0" />{settings.shop.hours}</li>
            </ul>
            <div className="mt-5 flex gap-2">
              {(["instagram", "facebook", "whatsapp"] as const).map((n) => (
                <a key={n} href="#" aria-label={n} className="grid h-9 w-9 place-items-center rounded-full bg-cream/10 transition hover:-translate-y-0.5 hover:bg-blush-400 hover:text-ink">
                  <Icon name={n} size={17} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-xs text-cream/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Sithuliya Flora (Pvt) Ltd. All rights reserved.</p>
          <p className="flex items-center gap-2"><Icon name="bank" size={14} /> Payment by bank deposit only · Prices in LKR</p>
        </div>
      </div>
    </footer>
  );
}
