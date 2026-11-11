import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-24 text-center">
      <p className="font-serif text-[9rem] leading-none text-blush-300">404</p>
      <h1 className="h-display mt-4 text-4xl">This page has wilted</h1>
      <p className="mt-3 max-w-md text-muted">The link may be old or mistyped. Let&apos;s get you back to something fresh.</p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/">Go home</ButtonLink>
        <ButtonLink href="/shop" variant="outline">Shop bouquets</ButtonLink>
      </div>
    </div>
  );
}
