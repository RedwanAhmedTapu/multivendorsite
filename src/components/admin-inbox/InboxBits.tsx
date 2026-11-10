// Small presentational pieces of the admin Live Chat inbox.

export type InboxKind = "CUSTOMER" | "VENDOR" | "AGENT";

const KIND_STYLE: Record<InboxKind, { label: string; cls: string }> = {
  CUSTOMER: { label: "Customer", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  VENDOR: { label: "Vendor", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  AGENT: { label: "Agent", cls: "bg-violet-50 text-violet-700 border-violet-200" },
};

export function KindBadge({ kind }: { kind: InboxKind }) {
  const s = KIND_STYLE[kind];
  return <span className={`inline-flex shrink-0 items-center rounded-full border px-1.5 py-px text-[10px] font-bold uppercase tracking-wide ${s.cls}`}>{s.label}</span>;
}

const AVATAR_COLORS = ["bg-indigo-100 text-indigo-700", "bg-sky-100 text-sky-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-violet-100 text-violet-700"];

export function InboxAvatar({ name, image, online }: { name: string; image?: string | null; online?: boolean }) {
  const code = [...name].reduce((s, c) => s + c.charCodeAt(0), 0);
  return (
    <span className="relative inline-flex size-10 shrink-0">
      {image ? (
        <img src={image} alt="" className="size-10 rounded-full object-cover" loading="lazy" />
      ) : (
        <span className={`flex size-10 items-center justify-center rounded-full text-xs font-bold ${AVATAR_COLORS[code % AVATAR_COLORS.length]}`}>{name.slice(0, 2).toUpperCase()}</span>
      )}
      {online && <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-emerald-500" aria-label="Online" />}
    </span>
  );
}

const TZ = "Asia/Dhaka";
const day = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const time = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const date = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "2-digit", month: "short" });

/** Today → "14:05", otherwise "03 Nov" (Asia/Dhaka). */
export function inboxTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return day.format(d) === day.format(new Date()) ? time.format(d) : date.format(d);
}

export function InboxSkeleton() {
  return (
    <div className="space-y-1 p-3" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg p-2">
          <div className="size-10 animate-pulse rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-2.5 w-full animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
