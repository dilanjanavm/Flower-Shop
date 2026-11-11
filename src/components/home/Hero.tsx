"use client";

import { heroStrip } from "@/lib/mock/catalogue";
import { FlowerImage } from "../ui/FlowerImage";
import { ButtonLink } from "../ui/Button";
import { Icon } from "../ui/Icon";

/** Wave offsets give the strip the staggered, breathing rhythm of the reference design. */
const wave = [0, 36, 64, 36, 0, 36, 64, 36];

export function Hero() {
  const strip = [...heroStrip, ...heroStrip];
  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pt-16">
      {/* soft blush glow */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--color-blush-100),transparent)] opacity-70 blur-2xl" />

      <div className="container-x relative text-center">
        <p className="eyebrow animate-fade-up">Sithuliya Flora · Colombo</p>
        <h1 className="h-display mx-auto mt-5 max-w-4xl animate-fade-up text-[2.75rem] sm:text-6xl md:text-7xl [animation-delay:80ms]">
          Flowers that say it <em className="text-blush-600">beautifully</em> for you
        </h1>
        <p className="mx-auto mt-6 max-w-xl animate-fade-up text-[15px] leading-relaxed text-muted [animation-delay:160ms] sm:text-base">
          Fresh bouquets and hand-tied arrangements for every moment. Each one is made by hand in our studio and delivered on the day you choose.
        </p>
        <div className="mt-8 flex animate-fade-up flex-wrap items-center justify-center gap-3 [animation-delay:240ms]">
          <ButtonLink href="/shop" size="lg">
            Shop bouquets
            <Icon name="arrowRight" size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
          </ButtonLink>
          <ButtonLink href="/custom-bouquet" variant="outline" size="lg">
            Design your own
          </ButtonLink>
        </div>
      </div>

      {/* Staggered auto-scrolling photo strip */}
      <div className="relative mt-14 animate-fade-in [animation-delay:300ms]">
        <div className="flex w-max animate-marquee-slow gap-5 pb-20 marquee-track" aria-hidden>
          {strip.map((src, i) => (
            <div
              key={i}
              className="w-[200px] shrink-0 sm:w-[260px]"
              style={{ marginTop: wave[i % wave.length] }}
            >
              <div className="animate-sway" style={{ animationDelay: `${(i % 4) * -1.6}s` }}>
                <FlowerImage
                  src={src}
                  alt=""
                  priority={i < 4}
                  className="aspect-[3/4] rounded-[2rem] shadow-[var(--shadow-soft)]"
                  imgClassName="hover:scale-105"
                  sizes="260px"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-cream sm:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-cream sm:w-40" />
      </div>
    </section>
  );
}
