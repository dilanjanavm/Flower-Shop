"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { cn, initials } from "@/lib/format";
import { Icon, type IconName } from "@/components/ui/Icon";
import { buttonClass } from "@/components/ui/Button";

const nav: { href: string; label: string; icon: IconName }[] = [
  { href: "/account", label: "Overview", icon: "home" },
  { href: "/account/orders", label: "Orders", icon: "receipt" },
  { href: "/account/quotations", label: "My quotations", icon: "quote" },
  { href: "/account/addresses", label: "Address book", icon: "pin" },
  { href: "/account/reminders", label: "Reminders", icon: "bell" },
  { href: "/account/profile", label: "Profile & settings", icon: "user" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, hydrated, logout, login } = useStore();

  if (!hydrated) {
    return (
      <div className="container-x grid gap-8 pt-10 lg:grid-cols-[260px_1fr]">
        <div className="skeleton h-80" />
        <div className="skeleton h-96" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-x pt-16">
        <div className="card mx-auto max-w-md p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blush-50 text-blush-600"><Icon name="user" size={26} /></span>
          <h1 className="mt-5 font-serif text-3xl">Sign in to your account</h1>
          <p className="mt-2 text-sm text-muted">Track orders, upload bank slips, view quotations and save the dates that matter.</p>
          <Link href={`/login?next=${pathname}`} className={buttonClass("primary", "md", "mt-6 w-full")}>Sign in</Link>
          <button onClick={() => login()} className="mt-3 text-xs text-muted underline underline-offset-4 hover:text-ink">Use demo customer account</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x pt-10">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-3 px-2">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-blush-100 font-semibold text-blush-700">{initials(user.fullName)}</span>
            <div className="min-w-0">
              <p className="truncate font-medium">{user.fullName}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <nav className="no-scrollbar -mx-5 mt-6 flex gap-1 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:px-0">
            {nav.map((n) => {
              const active = n.href === "/account" ? pathname === "/account" : pathname.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} className={cn("flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm transition", active ? "bg-ink text-cream" : "text-ink-soft hover:bg-sand")}>
                  <Icon name={n.icon} size={18} /> {n.label}
                </Link>
              );
            })}
            <button onClick={logout} className="flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm text-muted transition hover:bg-sand hover:text-ink">
              <Icon name="logout" size={18} /> Sign out
            </button>
          </nav>
        </aside>
        <div className="min-w-0 animate-fade-up">{children}</div>
      </div>
    </div>
  );
}
