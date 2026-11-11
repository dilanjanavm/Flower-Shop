"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/format";
import { useStore } from "@/lib/store";
import { formatShort } from "@/lib/dates";
import { firstAvailableDate } from "@/lib/mock/delivery";
import { taxonomies } from "@/lib/mock/catalogue";
import { Icon } from "../ui/Icon";
import { Logo } from "../ui/bits";

const nav = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?occasion=birthday", label: "Occasions", mega: true },
  { href: "/custom-bouquet", label: "Custom Bouquet" },
  { href: "/track", label: "Track Order" },
  { href: "/about", label: "Our Story" },
];

export function AnnouncementBar() {
  const [earliest, setEarliest] = useState<string | null>(null);
  useEffect(() => setEarliest(firstAvailableDate()), []);
  return (
    <div className="bg-ink text-cream">
      <div className="container-x flex h-9 items-center justify-center gap-2 overflow-hidden text-[12px] tracking-wide">
        <Icon name="calendar" size={14} className="text-blush-300" />
        <span className="truncate">
          Order 2 days ahead — earliest delivery <strong className="font-semibold text-blush-200">{earliest ? formatShort(earliest) : "…"}</strong>
          <span className="hidden sm:inline"> · Pay by bank deposit · Hand-tied in Colombo</span>
        </span>
      </div>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, setCartOpen, user, hydrated } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className={cn("sticky top-0 z-50 transition-all duration-500", scrolled ? "bg-cream/85 shadow-[0_1px_0_var(--color-line)] backdrop-blur-xl" : "bg-cream")}>
      <div className={cn("container-x flex items-center justify-between gap-6 transition-all duration-500", scrolled ? "h-16" : "h-20")}>
        <div className="flex items-center gap-3">
          <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <Logo />
        </div>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {nav.map((n) =>
            n.mega ? (
              <div key={n.label} className="relative" onMouseEnter={() => setMegaOpen(true)} onMouseLeave={() => setMegaOpen(false)}>
                <button className="flex items-center gap-1 rounded-full px-4 py-2 text-[14px] text-ink-soft transition hover:text-ink" aria-expanded={megaOpen} onClick={() => setMegaOpen((v) => !v)}>
                  {n.label}
                  <Icon name="chevronDown" size={14} className={cn("transition-transform duration-300", megaOpen && "rotate-180")} />
                </button>
                <div className={cn("absolute left-1/2 top-full w-[540px] -translate-x-1/2 pt-3 transition-all duration-300", megaOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0")}>
                  <div className="grid grid-cols-2 gap-1 rounded-3xl border border-line bg-paper p-3 shadow-[var(--shadow-lift)]">
                    {taxonomies.occasions.map((o) => (
                      <Link key={o.slug} href={`/shop?occasion=${o.slug}`} className="group flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-blush-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={o.image} alt="" className="h-11 w-11 rounded-xl object-cover transition-transform duration-500 group-hover:scale-110" />
                        <span className="text-sm font-medium">{o.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={n.href}
                href={n.href}
                className={cn("relative rounded-full px-4 py-2 text-[14px] transition", pathname === n.href ? "text-ink" : "text-ink-soft hover:text-ink")}
              >
                {n.label}
                {pathname === n.href && <span className="absolute inset-x-4 -bottom-0.5 h-px bg-ink" />}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-1">
          <button className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-sand" aria-label="Search" onClick={() => setSearchOpen((v) => !v)}>
            <Icon name="search" />
          </button>
          <Link href={user ? "/account" : "/login"} className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-sand" aria-label={user ? "My account" : "Sign in"}>
            {hydrated && user ? (
              <span className="grid h-7 w-7 place-items-center rounded-full bg-blush-100 text-[11px] font-bold text-blush-700">{user.fullName.split(" ").map((p) => p[0]).join("").slice(0, 2)}</span>
            ) : (
              <Icon name="user" />
            )}
          </Link>
          <button className="relative grid h-10 w-10 place-items-center rounded-full transition hover:bg-sand" aria-label={`Cart, ${cartCount} items`} onClick={() => setCartOpen(true)}>
            <Icon name="bag" />
            {hydrated && cartCount > 0 && (
              <span key={cartCount} className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] animate-pop place-items-center rounded-full bg-blush-500 px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className={cn("overflow-hidden border-t border-line/0 transition-all duration-400", searchOpen ? "max-h-24 border-line/80" : "max-h-0")}>
        <form onSubmit={submitSearch} className="container-x flex items-center gap-3 py-4">
          <Icon name="search" className="text-muted" />
          <input
            autoFocus={searchOpen}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search roses, lilies, birthday…"
            className="flex-1 bg-transparent font-serif text-xl outline-none placeholder:text-faint"
            aria-label="Search products"
          />
          <button className="text-sm font-medium text-ink-soft hover:text-ink">Search</button>
        </form>
      </div>

      {/* Mobile menu */}
      <div className={cn("fixed inset-0 z-[60] lg:hidden", mobileOpen ? "visible" : "invisible")}>
        <button className={cn("absolute inset-0 bg-ink/40 transition-opacity duration-300", mobileOpen ? "opacity-100" : "opacity-0")} onClick={() => setMobileOpen(false)} aria-label="Close menu" />
        <div className={cn("absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-cream p-6 transition-transform duration-500 ease-[var(--ease-out-soft)]", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="mb-8 flex items-center justify-between">
            <Logo />
            <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <Icon name="close" />
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map((n, i) => (
              <Link key={n.label} href={n.href} className="animate-fade-up border-b border-line py-4 font-serif text-3xl" style={{ animationDelay: `${i * 60}ms` }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-2 text-sm text-muted">
            <Link href={user ? "/account" : "/login"} className="flex items-center gap-2 font-medium text-ink">
              <Icon name="user" size={18} /> {user ? "My account" : "Sign in / Register"}
            </Link>
            <p>Hand-tied in Colombo · Orders need 2 days&apos; notice</p>
          </div>
        </div>
      </div>
    </header>
  );
}
