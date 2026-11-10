// lib/campaign/campaign-editor.ts
//
// Pure helpers for the admin campaign editor (/admin-dashboard/campaigns) and
// the block builder's details form (/admin-dashboard/campaigns/[id]). Unit
// tested in tests/campaign-editor.test.mjs.
//
// Backend contract (multivendorbackend campaignPage service/controller):
//   PUT /api/campaigns/:id applies the body as-is → only title, heroImage,
//   heroTitle, heroSubtitle, startDate, endDate (and status) may be sent;
//   null clears an optional field, an omitted field is unchanged; dates must
//   be full ISO-8601 datetimes. The slug is fixed at creation.

export type CampaignStatusValue = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED";

export interface CampaignLike {
  id: string;
  title: string;
  slug: string;
  status: CampaignStatusValue;
  heroImage?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  updatedAt?: string;
  _count?: { components: number };
}

/** Form values. Dates are `<input type="datetime-local">` values (local time). */
export interface CampaignFormState {
  title: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  startDate: string;
  endDate: string;
}

export type CampaignFormErrors = Partial<Record<keyof CampaignFormState, string>>;

export interface CampaignUpdatePayload {
  title?: string;
  heroImage?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * ISO datetime → `datetime-local` value in the browser's LOCAL time.
 * (`toISOString().slice(0, 16)` gives UTC, which the input then reads as local
 * time — every save shifted the campaign window by the UTC offset.)
 */
export function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `datetime-local` value (local time) → ISO datetime; "" → null; invalid → undefined. */
export function fromDateTimeLocal(value: string): string | null | undefined {
  if (!value) return null;
  const d = new Date(value); // no zone in the string → parsed as local time
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function campaignToForm(c: CampaignLike): CampaignFormState {
  return {
    title: c.title ?? "",
    heroTitle: c.heroTitle ?? "",
    heroSubtitle: c.heroSubtitle ?? "",
    heroImage: c.heroImage ?? "",
    startDate: toDateTimeLocal(c.startDate),
    endDate: toDateTimeLocal(c.endDate),
  };
}

export function validateCampaignForm(form: CampaignFormState): CampaignFormErrors {
  const errors: CampaignFormErrors = {};
  if (!form.title.trim()) errors.title = "Campaign title is required";
  const start = fromDateTimeLocal(form.startDate);
  const end = fromDateTimeLocal(form.endDate);
  if (start === undefined) errors.startDate = "Enter a valid start date and time";
  if (end === undefined) errors.endDate = "Enter a valid end date and time";
  if (start && end && new Date(end).getTime() <= new Date(start).getTime()) {
    errors.endDate = "The campaign must end after it starts";
  }
  return errors;
}

/**
 * Only the fields that differ from the saved campaign. Optional text fields
 * left empty are sent as null (cleared); dates are compared as the form shows
 * them, so an untouched date is never re-sent (and never shifted).
 */
export function buildCampaignUpdate(form: CampaignFormState, saved: CampaignLike): CampaignUpdatePayload {
  const before = campaignToForm(saved);
  const out: CampaignUpdatePayload = {};
  const title = form.title.trim();
  if (title !== before.title.trim()) out.title = title;
  for (const key of ["heroTitle", "heroSubtitle", "heroImage"] as const) {
    const v = form[key].trim();
    if (v !== before[key].trim()) out[key] = v || null;
  }
  for (const key of ["startDate", "endDate"] as const) {
    if (form[key] !== before[key]) {
      const iso = fromDateTimeLocal(form[key]);
      if (iso !== undefined) out[key] = iso;
    }
  }
  return out;
}

export function isCampaignDirty(form: CampaignFormState, saved: CampaignLike): boolean {
  return Object.keys(buildCampaignUpdate(form, saved)).length > 0;
}

export type CampaignStatusFilter = "ALL" | CampaignStatusValue;

export function filterCampaigns<T extends CampaignLike>(list: T[], query: string, status: CampaignStatusFilter): T[] {
  const q = query.trim().toLowerCase();
  return list.filter(
    (c) =>
      (status === "ALL" || c.status === status) &&
      (!q || c.title.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)),
  );
}

export function campaignStats(list: CampaignLike[]) {
  const count = (s: CampaignStatusValue) => list.filter((c) => c.status === s).length;
  return {
    total: list.length,
    live: count("PUBLISHED"),
    draft: count("DRAFT"),
    archived: count("ARCHIVED"),
    scheduled: count("SCHEDULED"),
  };
}

export type CampaignWindow = "ALWAYS" | "UPCOMING" | "RUNNING" | "ENDED";

/**
 * Where `now` falls in the campaign's date window — the same bounds the public
 * storefront lookup uses (startDate <= now, endDate >= now; a missing bound
 * never limits it).
 */
export function campaignWindow(c: Pick<CampaignLike, "startDate" | "endDate">, now: Date = new Date()): CampaignWindow {
  if (!c.startDate && !c.endDate) return "ALWAYS";
  const t = now.getTime();
  if (c.startDate && new Date(c.startDate).getTime() > t) return "UPCOMING";
  if (c.endDate && new Date(c.endDate).getTime() < t) return "ENDED";
  return "RUNNING";
}
