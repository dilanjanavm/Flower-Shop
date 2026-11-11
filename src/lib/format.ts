export function lkr(amount: number, opts: { decimals?: boolean } = {}): string {
  const n = new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: opts.decimals ? 2 : 0,
    maximumFractionDigits: opts.decimals ? 2 : 0,
  }).format(amount);
  return `Rs ${n}`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Valid Sri Lankan mobile in +94 format (FR-AUTH-01.1). Accepts 07X… and normalises. */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (/^\+947\d{8}$/.test(digits)) return digits;
  if (/^07\d{8}$/.test(digits)) return `+94${digits.slice(1)}`;
  if (/^947\d{8}$/.test(digits)) return `+${digits}`;
  return null;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
