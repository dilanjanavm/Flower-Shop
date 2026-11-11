import { cn } from "@/lib/format";
import { Icon } from "../ui/Icon";

export function Stepper({ steps, current, onStep }: { steps: string[]; current: number; onStep?: (i: number) => void }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex flex-1 items-center gap-2 sm:gap-3 last:flex-none">
            <button
              type="button"
              disabled={!done || !onStep}
              onClick={() => onStep?.(i)}
              className="flex items-center gap-2.5 disabled:cursor-default"
            >
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold transition-all duration-500",
                  done ? "bg-ink text-cream" : active ? "bg-blush-400 text-ink ring-4 ring-blush-100" : "bg-sand text-faint",
                )}
              >
                {done ? <Icon name="check" size={16} strokeWidth={2.4} /> : i + 1}
              </span>
              <span className={cn("hidden text-sm font-medium md:block", active ? "text-ink" : "text-muted")}>{s}</span>
            </button>
            {i < steps.length - 1 && (
              <span className="relative h-px flex-1 overflow-hidden bg-line">
                <span className={cn("absolute inset-y-0 left-0 bg-ink transition-all duration-700 ease-[var(--ease-out-soft)]", done ? "w-full" : "w-0")} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
