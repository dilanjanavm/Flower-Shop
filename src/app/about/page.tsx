import type { Metadata } from "next";
import { FlowerImage } from "@/components/ui/FlowerImage";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { IMG } from "@/lib/mock/images";

export const metadata: Metadata = { title: "Our story", description: "A small flower studio in Colombo, tying every bouquet by hand." };

const values = [
  { t: "Made the morning it leaves", b: "We don't keep bouquets in a fridge waiting for an order. Every arrangement is tied on its delivery day." },
  { t: "Honest pricing", b: "No hidden fees at checkout. Custom bouquets are quoted by a real florist before you pay a rupee." },
  { t: "Small by design", b: "One studio, our own riders, and a team who know Colombo's lanes — and its traffic." },
];

export default function AboutPage() {
  return (
    <div className="container-x pt-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Our story</p>
        <h1 className="h-display mt-4 text-5xl sm:text-7xl">A small studio with a <em className="text-blush-600">big heart</em> for flowers</h1>
      </div>
      <div className="mt-14 grid gap-4 sm:grid-cols-3">
        <Reveal><FlowerImage src={IMG.aisle} alt="Wedding flower arrangement" className="aspect-[3/4] rounded-[2rem]" sizes="33vw" /></Reveal>
        <Reveal delay={100} className="sm:mt-16"><FlowerImage src={IMG.hangingAssorted} alt="Flowers drying in the studio" className="aspect-[3/4] rounded-[2rem]" sizes="33vw" /></Reveal>
        <Reveal delay={200}><FlowerImage src={IMG.centerpiece} alt="Centerpiece" className="aspect-[3/4] rounded-[2rem]" sizes="33vw" /></Reveal>
      </div>
      <div className="mx-auto mt-20 grid max-w-5xl gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="font-serif text-3xl leading-snug">Sithuliya Flora began on a kitchen table in Colombo, wrapping bouquets for friends&apos; birthdays. Twelve years later we still wrap every one by hand.</p>
        </Reveal>
        <Reveal delay={100} className="space-y-4 text-muted">
          <p>Today our studio on Flower Road sources from growers in Nuwara Eliya and the best importers in Colombo. We moved from WhatsApp orders to this website so you can choose an exact date and slot, pay by bank deposit, and follow your flowers all the way to the door.</p>
          <p>We ask for two days&apos; notice because that&apos;s what it takes to do it properly: buying the right stems, conditioning them, and arranging them fresh on the day.</p>
        </Reveal>
      </div>
      <div className="mt-20 grid gap-4 md:grid-cols-3">
        {values.map((v, i) => (
          <Reveal key={v.t} delay={i * 100} className="card p-8">
            <span className="font-serif text-4xl text-blush-500">0{i + 1}</span>
            <p className="mt-4 font-serif text-2xl">{v.t}</p>
            <p className="mt-2 text-sm text-muted">{v.b}</p>
          </Reveal>
        ))}
      </div>
      <div className="mt-16 text-center">
        <ButtonLink href="/shop" size="lg">Explore the collection</ButtonLink>
      </div>
    </div>
  );
}
