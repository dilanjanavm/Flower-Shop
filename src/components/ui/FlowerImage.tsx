"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/format";

/**
 * next/image wrapper with a soft floral placeholder, used for every product
 * photo. If a photo fails to load, a branded gradient is shown instead of a
 * broken image icon.
 */
export function FlowerImage({
  src,
  alt,
  sizes = "(max-width: 768px) 50vw, 25vw",
  className,
  imgClassName,
  priority,
}: {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-sand", className)}>
      {!failed && src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
          className={cn(
            "animate-fade-in object-cover transition-transform duration-700 ease-[var(--ease-out-soft)]",
            imgClassName,
          )}
        />
      ) : null}
      {(failed || !src) && (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,var(--color-blush-100),transparent_60%),radial-gradient(circle_at_80%_90%,var(--color-sage-100),transparent_55%)]">
          <svg viewBox="0 0 64 64" className="h-1/4 w-1/4 text-blush-400/70" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="32" cy="24" r="6" />
            <path d="M32 18c0-6 3-11 0-11s0 5 0 11Zm-6 6c-6 0-11-3-11 0s5 0 11 0Zm12 0c6 0 11-3 11 0s-5 0-11 0Zm-6 6v27m0-9c-6 0-10-4-11-9 6 0 10 4 11 9Zm0-5c5 0 9-3 10-8-5 0-9 3-10 8Z" />
          </svg>
        </div>
      )}
    </div>
  );
}
