import { Hero } from "@/components/home/Hero";
import { BestSellers, CustomPromo, Occasions, PromiseStrip, ReminderCta, StatsBand, Testimonials } from "@/components/home/Sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PromiseStrip />
      <Occasions />
      <BestSellers />
      <StatsBand />
      <CustomPromo />
      <Testimonials />
      <ReminderCta />
    </>
  );
}
