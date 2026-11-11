import type { ReactNode } from "react";

export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: { h: string; body: ReactNode }[] }) {
  return (
    <div className="container-x max-w-3xl pt-12">
      <p className="eyebrow">Legal</p>
      <h1 className="h-display mt-3 text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-muted">Last updated {updated}</p>
      <div className="mt-10 space-y-8">
        {sections.map((s, i) => (
          <section key={s.h}>
            <h2 className="font-serif text-2xl"><span className="mr-2 text-blush-500">{i + 1}.</span>{s.h}</h2>
            <div className="mt-2 space-y-2 leading-relaxed text-ink-soft">{s.body}</div>
          </section>
        ))}
      </div>
      <p className="mt-12 rounded-2xl bg-sand p-4 text-xs text-muted">Template text for review — have this checked by the shop&apos;s legal advisor before launch.</p>
    </div>
  );
}
