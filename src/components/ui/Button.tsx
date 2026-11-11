import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/format";

type Variant = "primary" | "outline" | "ghost" | "blush" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-300 ease-[var(--ease-out-soft)] disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.97]";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-cream hover:bg-ink-soft hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5",
  outline: "border border-ink/80 text-ink hover:bg-ink hover:text-cream",
  ghost: "text-ink hover:bg-sand",
  blush: "bg-blush-400 text-ink hover:bg-blush-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
  light: "bg-cream text-ink hover:bg-white hover:-translate-y-0.5",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-[15px] py-3.5",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(base, variants[variant], sizes[size], extra);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: { variant?: Variant; size?: Size } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}
