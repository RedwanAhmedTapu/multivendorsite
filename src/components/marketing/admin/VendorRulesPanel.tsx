"use client";

// Campaigns page → "Vendor Rules" tab: the campaign's vendor programme.
//   - no programme yet: enable vendor registration (needs the page's start and
//     end dates, set in Details);
//   - DRAFT: edit registration window, rules and categories; Publish;
//   - PUBLISHED: registration window frozen; rules may only be tightened
//     after vendors registered — the 409 warning (rules + affected count) is
//     shown and the change is resent with acknowledgeTightening only after
//     the admin confirms; Cancel with a reason.
// Server errors appear per field. All text via next-intl.

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CalendarClock, Gauge, Layers, Store } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { GradientButton, OutlineButton } from "@/components/ui/section-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGetCategoriesQuery } from "@/features/apiSlice";
import type { Category } from "@/types/type";
import {
  useCancelCampaignProgrammeMutation,
  useCreateCampaignProgrammeMutation,
  useGetCampaignProgrammeQuery,
  usePublishCampaignProgrammeMutation,
  useUpdateCampaignProgrammeMutation,
  type AdminProgramme,
  type ProgrammePage,
} from "@/features/marketingAdminApi";
import {
  buildProgrammeUpdate,
  emptyProgrammeForm,
  formToBody,
  mapServerError,
  programmeToForm,
  validateProgrammeForm,
  type FieldErrors,
  type ProgrammeField,
  type ProgrammeFormState,
} from "@/lib/marketing/campaign-admin";
import { CampaignStatusBadge, ErrorState, FieldMessage, NoticeBox, PhaseBadge, useDateTime, useRuleLabel } from "./MarketingShared";

const REASON_MAX = 500;

function flatten(list: Category[] | undefined, depth = 0, out: { id: string; name: string; depth: number }[] = []) {
  for (const c of list ?? []) {
    out.push({ id: c.id, name: c.name, depth });
    flatten(c.children, depth + 1, out);
  }
  return out;
}

export function VendorRulesPanel({ pageId }: { pageId: string }) {
  const { data, isLoading, isError, error, refetch } = useGetCampaignProgrammeQuery(pageId);
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError || !data) return <ErrorState message={(error as any)?.data?.message} onRetry={refetch} />;
  const { page, programme } = data.data;
  // Remount the form when the stored programme changes.
  return <RulesForm key={programme ? `${programme.id}:${programme.updatedAt}` : "new"} page={page} programme={programme} />;
}

function RulesForm({ page, programme }: { page: ProgrammePage; programme: AdminProgramme | null }) {
  const t = useTranslations("marketing.rulesTab");
  const tf = useTranslations("marketing.fields");
  const ruleLabel = useRuleLabel();
  const fmt = useDateTime();
  const published = programme?.status === "PUBLISHED";
  const locked = programme?.status === "CANCELLED" || programme?.status === "ENDED";
  const hasDates = !!page.startDate && !!page.endDate;

  const [form, setForm] = React.useState<ProgrammeFormState>(() => (programme ? programmeToForm(programme) : emptyProgrammeForm()));
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [topError, setTopError] = React.useState<string | null>(null);
  const [tightening, setTightening] = React.useState<null | { tightened: string[]; affectedRegistrations: number }>(null);
  const [dialog, setDialog] = React.useState<null | "publish" | "cancel">(null);
  const [reason, setReason] = React.useState("");
  const [categorySearch, setCategorySearch] = React.useState("");

  const { data: categories, isLoading: catLoading, isError: catError, refetch: refetchCategories } = useGetCategoriesQuery();
  const options = React.useMemo(() => flatten(categories), [categories]);
  const visibleOptions = options.filter((o) => o.name.toLowerCase().includes(categorySearch.trim().toLowerCase()));

  const [createProgramme, createState] = useCreateCampaignProgrammeMutation();
  const [updateProgramme, updateState] = useUpdateCampaignProgrammeMutation();
  const [publishProgramme, publishState] = usePublishCampaignProgrammeMutation();
  const [cancelProgramme, cancelState] = useCancelCampaignProgrammeMutation();
  const busy = createState.isLoading || updateState.isLoading || publishState.isLoading || cancelState.isLoading;

  const set = <K extends keyof ProgrammeFormState>(k: K, v: ProgrammeFormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const err = (k: ProgrammeField) => errors[k];
  const describedBy = (k: ProgrammeField) => (errors[k] ? `rule-err-${k}` : undefined);

  function applyServerError(e: unknown) {
    const m = mapServerError(e);
    if (m.tightening) {
      setTightening(m.tightening);
      return;
    }
    setErrors(m.fieldErrors);
    setTopError(Object.keys(m.fieldErrors).length ? t("fixFields") : m.message || t("saveFailed"));
  }

  async function save(acknowledgeTightening = false) {
    setTopError(null);
    const clientErrors = validateProgrammeForm(form, page.startDate);
    if (published) for (const k of ["registrationStartAt", "registrationEndAt"] as const) delete clientErrors[k];
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      setTopError(t("fixFields"));
      return;
    }
    try {
      if (!programme) {
        await createProgramme({ pageId: page.id, body: formToBody(form) }).unwrap();
        toast.success(t("created"));
        return;
      }
      const body = buildProgrammeUpdate(form, programme);
      if (Object.keys(body).length === 0) {
        toast.info(t("noChanges"));
        return;
      }
      const res = await updateProgramme({ id: programme.id, pageId: page.id, body: acknowledgeTightening ? { ...body, acknowledgeTightening: true } : body }).unwrap();
      setTightening(null);
      toast.success(res.warning ? t("savedWithTightening", { count: res.warning.affectedRegistrations }) : t("saved"));
    } catch (e) {
      applyServerError(e);
    }
  }

  async function doPublish() {
    if (!programme) return;
    try {
      await publishProgramme({ id: programme.id, pageId: page.id }).unwrap();
      toast.success(t("published"));
      setDialog(null);
    } catch (e) {
      setDialog(null);
      applyServerError(e);
    }
  }

  async function doCancel() {
    if (!programme) return;
    try {
      await cancelProgramme({ id: programme.id, pageId: page.id, reason: reason.trim() }).unwrap();
      toast.success(t("cancelled"));
      setDialog(null);
    } catch (e) {
      setTopError(mapServerError(e).message || t("saveFailed"));
      setDialog(null);
    }
  }

  const dateInput = (k: "registrationStartAt" | "registrationEndAt") => (
    <div>
      <Label htmlFor={`rule-${k}`}>{tf(k)}</Label>
      <Input id={`rule-${k}`} type="datetime-local" className="mt-1.5" value={form[k]} onChange={(e) => set(k, e.target.value)} disabled={published || locked} aria-invalid={!!err(k)} aria-describedby={describedBy(k)} />
      <FieldMessage id={`rule-err-${k}`} error={err(k)} />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Status */}
      <SectionCard icon={<Store className="h-4 w-4" />} title={t("title")} subtitle={programme ? undefined : t("intro")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            {programme ? (
              <>
                <CampaignStatusBadge status={programme.status} />
                {programme.phase !== programme.status && <PhaseBadge phase={programme.phase as any} />}
                <span className="text-[#7A90AB]">{t("counts", { vendors: programme.counts?.vendors ?? 0, pending: programme.counts?.pending ?? 0, approved: programme.counts?.approved ?? 0 })}</span>
              </>
            ) : (
              <span className="font-semibold text-[#3D5068]">{t("notEnabled")}</span>
            )}
          </div>
          {programme && !locked && (
            <div className="flex flex-wrap gap-2">
              {programme.status === "DRAFT" && (
                <Button onClick={() => setDialog("publish")} disabled={busy}>
                  {t("publish")}
                </Button>
              )}
              <Button variant="destructive" onClick={() => { setReason(""); setDialog("cancel"); }} disabled={busy}>
                {t("cancel")}
              </Button>
            </div>
          )}
        </div>
        <div className="mt-3 rounded-lg border border-[#F0F4FA] bg-[#FAFBFD] px-3 py-2 text-[12.5px] text-[#3D5068]">
          <span className="font-semibold">{t("liveWindow")}: </span>
          {hasDates ? `${fmt(page.startDate)} – ${fmt(page.endDate)}` : t("noLiveWindow")}
          <p className="mt-0.5 text-[11.5px] text-[#7A90AB]">{published ? t("liveWindowPublished") : t("liveWindowHint")}</p>
          <FieldMessage id="rule-err-liveWindow" error={err("liveWindow")} />
        </div>
      </SectionCard>

      {locked && <NoticeBox title={t("lockedTitle")}>{t("lockedBody")}</NoticeBox>}
      {!programme && !hasDates && <NoticeBox title={t("needDatesTitle")} tone="warning">{t("needDatesBody")}</NoticeBox>}
      {published && <NoticeBox title={t("publishedTitle")} tone="warning">{t("publishedBody")}</NoticeBox>}
      {topError && <NoticeBox title={topError} tone="danger" />}

      {(programme || hasDates) && (
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void save(false);
          }}
        >
          <SectionCard icon={<CalendarClock className="h-4 w-4" />} title={t("registrationWindow")} badge="required" error={!!(err("registrationStartAt") || err("registrationEndAt"))}>
            <p className="mb-3 text-[12px] text-[#7A90AB]">{published ? t("registrationFrozen") : t("registrationHint")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {dateInput("registrationStartAt")}
              {dateInput("registrationEndAt")}
            </div>
          </SectionCard>

          <SectionCard icon={<Gauge className="h-4 w-4" />} title={t("rules")} badge="required" error={!!(err("minDiscountPercent") || err("minStock") || err("maxProductsPerVendor"))}>
            {published && <p className="mb-3 text-[12px] text-amber-800">{t("rulesPublishedHint")}</p>}
            <div className="grid gap-3 sm:grid-cols-3">
              {(["minDiscountPercent", "minStock", "maxProductsPerVendor"] as const).map((k) => (
                <div key={k}>
                  <Label htmlFor={`rule-${k}`}>{tf(k)}</Label>
                  <Input
                    id={`rule-${k}`}
                    className="mt-1.5"
                    inputMode={k === "minDiscountPercent" ? "decimal" : "numeric"}
                    placeholder={k === "maxProductsPerVendor" ? t("noLimit") : undefined}
                    value={form[k]}
                    onChange={(e) => set(k, e.target.value)}
                    disabled={locked}
                    aria-invalid={!!err(k)}
                    aria-describedby={describedBy(k)}
                  />
                  <FieldMessage id={`rule-err-${k}`} error={err(k)} />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={<Layers className="h-4 w-4" />} title={t("categories")} subtitle={t("categoriesHint")} error={!!err("categoryIds")}>
            {catLoading ? (
              <p className="text-[13px] text-[#7A90AB]">{t("categoriesLoading")}</p>
            ) : catError ? (
              <div className="flex items-center gap-2 text-[13px] text-red-700">
                {t("categoriesError")}
                <Button type="button" variant="outline" size="sm" onClick={() => refetchCategories()}>
                  {t("retry")}
                </Button>
              </div>
            ) : (
              <>
                <Input value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} placeholder={t("categorySearch")} aria-label={t("categorySearch")} className="mb-2" />
                <p className="mb-2 text-[12px] text-[#3D5068]">{form.categoryIds.length ? t("categoriesSelected", { count: form.categoryIds.length }) : t("categoriesAll")}</p>
                <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-[#F0F4FA] p-2" aria-label={t("categories")}>
                  {visibleOptions.map((o) => (
                    <li key={o.id} style={{ paddingLeft: o.depth * 16 }}>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-[13px] hover:bg-[#F5F7FB]">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={form.categoryIds.includes(o.id)}
                          disabled={locked}
                          onChange={(e) => set("categoryIds", e.target.checked ? [...form.categoryIds, o.id] : form.categoryIds.filter((x) => x !== o.id))}
                        />
                        {o.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <FieldMessage id="rule-err-categoryIds" error={err("categoryIds")} />
          </SectionCard>

          {!locked && (
            <div className="flex justify-end">
              <GradientButton type="submit" isLoading={busy}>
                {programme ? t("save") : t("enable")}
              </GradientButton>
            </div>
          )}
        </form>
      )}

      {/* Tightening confirmation */}
      <Dialog open={tightening !== null} onOpenChange={(o) => !o && setTightening(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("tightenTitle")}</DialogTitle>
            <DialogDescription>{t("tightenBody", { count: tightening?.affectedRegistrations ?? 0 })}</DialogDescription>
          </DialogHeader>
          <ul className="list-disc pl-5 text-[13px] text-[#3D5068]" aria-label={t("tightenRules")}>
            {tightening?.tightened.map((r) => (
              <li key={r}>{ruleLabel(r)}</li>
            ))}
          </ul>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTightening(null)} disabled={busy}>
              {t("back")}
            </Button>
            <Button onClick={() => void save(true)} disabled={busy}>
              {t("tightenConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish */}
      <Dialog open={dialog === "publish"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("publishTitle")}</DialogTitle>
            <DialogDescription>{t("publishBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <OutlineButton onClick={() => setDialog(null)} disabled={busy}>
              {t("back")}
            </OutlineButton>
            <Button onClick={() => void doPublish()} disabled={busy}>
              {t("publish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel */}
      <Dialog open={dialog === "cancel"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cancelTitle")}</DialogTitle>
            <DialogDescription>{t("cancelBody")}</DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="programme-cancel-reason">{t("reason")}</Label>
            <Textarea id="programme-cancel-reason" className="mt-1.5" rows={3} maxLength={REASON_MAX} value={reason} onChange={(e) => setReason(e.target.value)} aria-describedby="programme-cancel-count" />
            <p id="programme-cancel-count" className="mt-1 text-[11px] text-[#7A90AB]">
              {reason.trim().length}/{REASON_MAX}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialog(null)} disabled={busy}>
              {t("back")}
            </Button>
            <Button variant="destructive" onClick={() => void doCancel()} disabled={!reason.trim() || busy}>
              {t("confirmCancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
