"use client";

// Campaigns page → "Registrations" tab: review vendor products registered
// for the campaign's vendor programme.
//   - Approve; on 422 the server's rule violations are listed.
//   - Reject requires a reason (≤ 500 chars).
//   - Bulk: step 1 calls bulk-review WITHOUT confirm (preview: count +
//     eligible items); step 2 confirms with the same expectedCount and the
//     same selection; the result lists per-item failures. A 409 means the
//     selection changed — the admin previews again.

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, ChevronRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useApproveCampaignRegistrationMutation,
  useBulkReviewRegistrationsMutation,
  useGetCampaignProgrammeQuery,
  useListProgrammeRegistrationsQuery,
  useRejectCampaignRegistrationMutation,
  type AdminProgramme,
  type AdminRegistration,
  type BulkPreview,
  type BulkResult,
  type RegistrationStatus,
  type RuleViolation,
} from "@/features/marketingAdminApi";
import { discountPercent, mapServerError } from "@/lib/marketing/campaign-admin";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState, LoadingRows, NoticeBox, RegistrationStatusBadge, useMoney, useRuleLabel } from "./MarketingShared";

const REASON_MAX = 500;
const PAGE_SIZE = 20;
const FILTERS: (RegistrationStatus | "ALL")[] = ["PENDING", "APPROVED", "REJECTED", "WITHDRAWN", "ALL"];

type BulkState =
  | null
  | { step: "reason"; action: "reject"; ids?: string[]; reason: string }
  | { step: "preview"; action: "approve" | "reject"; ids?: string[]; reason?: string; preview: BulkPreview; error?: string }
  | { step: "result"; result: BulkResult };

function ViolationList({ violations }: { violations: RuleViolation[] }) {
  const ruleLabel = useRuleLabel();
  return (
    <ul className="list-disc space-y-0.5 pl-5 text-[12.5px] text-red-800">
      {violations.map((v, i) => (
        <li key={i}>
          <span className="font-semibold">{ruleLabel(v.rule)}:</span> {v.message}
        </li>
      ))}
    </ul>
  );
}

/** Loads the page's programme; landing-page-only campaigns have nothing to review. */
export function RegistrationsTab({ pageId }: { pageId: string }) {
  const t = useTranslations("marketing.registrations");
  const { data, isLoading, isError, error, refetch } = useGetCampaignProgrammeQuery(pageId);
  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (isError || !data) return <ErrorState message={(error as any)?.data?.message} onRetry={refetch} />;
  if (!data.data.programme) return <NoticeBox title={t("noProgrammeTitle")}>{t("noProgrammeBody")}</NoticeBox>;
  return <RegistrationsPanel programme={data.data.programme} />;
}

export function RegistrationsPanel({ programme }: { programme: AdminProgramme }) {
  const pageId = programme.campaignPageId;
  const t = useTranslations("marketing.registrations");
  const ts = useTranslations("marketing.registrationStatus");
  const tc = useTranslations("marketing.common");
  const money = useMoney();
  const [status, setStatus] = React.useState<RegistrationStatus | "ALL">("PENDING");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [rejecting, setRejecting] = React.useState<null | { reg: AdminRegistration; reason: string; error?: string }>(null);
  const [violations, setViolations] = React.useState<null | { reg: AdminRegistration; list: RuleViolation[] }>(null);
  const [bulk, setBulk] = React.useState<BulkState>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useListProgrammeRegistrationsQuery({
    id: programme.id,
    status: status === "ALL" ? undefined : status,
    page,
    limit: PAGE_SIZE,
  });
  const [approve, approveState] = useApproveCampaignRegistrationMutation();
  const [reject, rejectState] = useRejectCampaignRegistrationMutation();
  const [bulkReview, bulkState] = useBulkReviewRegistrationsMutation();

  const rows = data?.data ?? [];
  const pg = data?.pagination;
  const reviewable = programme.status === "PUBLISHED";
  const pendingOnPage = rows.filter((r) => r.status === "PENDING").map((r) => r.id);
  const allSelected = pendingOnPage.length > 0 && pendingOnPage.every((id) => selected.includes(id));
  React.useEffect(() => setSelected([]), [status, page]);

  async function doApprove(reg: AdminRegistration) {
    try {
      await approve({ registrationId: reg.id, pageId }).unwrap();
      toast.success(t("approved", { product: reg.product.name }));
    } catch (e) {
      const m = mapServerError(e);
      if (m.violations?.length) setViolations({ reg, list: m.violations });
      else toast.error(m.message || t("actionFailed"));
    }
  }

  async function doReject() {
    if (!rejecting) return;
    try {
      await reject({ registrationId: rejecting.reg.id, pageId, reason: rejecting.reason.trim() }).unwrap();
      toast.success(t("rejected", { product: rejecting.reg.product.name }));
      setRejecting(null);
    } catch (e) {
      setRejecting({ ...rejecting, error: mapServerError(e).message || t("actionFailed") });
    }
  }

  async function startBulk(action: "approve" | "reject") {
    const ids = selected.length ? [...selected] : undefined;
    if (action === "reject") {
      setBulk({ step: "reason", action, ids, reason: "" });
      return;
    }
    await preview("approve", ids);
  }

  async function preview(action: "approve" | "reject", ids?: string[], reason?: string) {
    try {
      const res = await bulkReview({ id: programme.id, pageId, body: { action, registrationIds: ids, reason } }).unwrap();
      setBulk({ step: "preview", action, ids, reason, preview: res.data as BulkPreview });
    } catch (e) {
      toast.error(mapServerError(e).message || t("actionFailed"));
      setBulk(null);
    }
  }

  async function confirmBulk() {
    if (bulk?.step !== "preview") return;
    try {
      const res = await bulkReview({
        id: programme.id,
        pageId,
        body: { action: bulk.action, registrationIds: bulk.ids, reason: bulk.reason, confirm: true, expectedCount: bulk.preview.count },
      }).unwrap();
      setSelected([]);
      setBulk({ step: "result", result: res.data as BulkResult });
    } catch (e) {
      const m = mapServerError(e);
      setBulk({ ...bulk, error: m.status === 409 ? t("bulkSelectionChanged") : m.message || t("actionFailed") });
    }
  }

  const productCell = (r: AdminRegistration) => (
    <>
      <div className="font-medium text-[#0D1B2E]">{r.product.name}</div>
      <div className="text-[11.5px] text-[#7A90AB]">{r.variant.sku}</div>
    </>
  );
  const actions = (r: AdminRegistration) =>
    r.status === "PENDING" && reviewable ? (
      <div className="flex justify-end gap-1.5">
        <Button size="sm" onClick={() => void doApprove(r)} disabled={approveState.isLoading} aria-label={t("approveItem", { product: r.product.name })}>
          <CheckCircle2 className="mr-1 h-3.5 w-3.5" aria-hidden /> {t("approve")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setRejecting({ reg: r, reason: "" })} aria-label={t("rejectItem", { product: r.product.name })}>
          <XCircle className="mr-1 h-3.5 w-3.5" aria-hidden /> {t("reject")}
        </Button>
      </div>
    ) : null;

  return (
    <div className="space-y-3">
      {!reviewable && <NoticeBox title={t("notReviewable")} />}
      <div className="rounded-[14px] border-[1.5px] border-[#E5EAF2] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-3 border-b border-[#F0F4FA] p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={status} onValueChange={(v) => { setStatus(v as RegistrationStatus | "ALL"); setPage(1); }}>
            <TabsList className="h-auto flex-wrap justify-start" aria-label={t("statusFilter")}>
              {FILTERS.map((f) => (
                <TabsTrigger key={f} value={f}>
                  {f === "ALL" ? t("all") : ts(f)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {reviewable && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] text-[#7A90AB]">{selected.length ? t("selectedCount", { count: selected.length }) : t("allPendingScope")}</span>
              <Button size="sm" onClick={() => void startBulk("approve")} disabled={bulkState.isLoading}>
                {t("bulkApprove")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => void startBulk("reject")} disabled={bulkState.isLoading}>
                {t("bulkReject")}
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <LoadingRows />
        ) : isError ? (
          <ErrorState message={(error as any)?.data?.message} onRetry={refetch} />
        ) : rows.length === 0 ? (
          <EmptyState title={t("empty")} />
        ) : (
          <div aria-busy={isFetching}>
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    {reviewable && (
                      <TableHead className="w-8">
                        <input
                          type="checkbox"
                          aria-label={t("selectAllPending")}
                          checked={allSelected}
                          disabled={pendingOnPage.length === 0}
                          onChange={(e) => setSelected(e.target.checked ? pendingOnPage : [])}
                        />
                      </TableHead>
                    )}
                    <TableHead>{t("vendor")}</TableHead>
                    <TableHead>{t("product")}</TableHead>
                    <TableHead className="text-right">{t("originalPrice")}</TableHead>
                    <TableHead className="text-right">{t("campaignPrice")}</TableHead>
                    <TableHead className="text-right">{t("stock")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="text-right">
                      <span className="sr-only">{t("actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      {reviewable && (
                        <TableCell>
                          {r.status === "PENDING" && (
                            <input
                              type="checkbox"
                              aria-label={t("selectItem", { product: r.product.name })}
                              checked={selected.includes(r.id)}
                              onChange={(e) => setSelected((s) => (e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id)))}
                            />
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-[13px]">{r.vendor.storeName}</TableCell>
                      <TableCell>{productCell(r)}</TableCell>
                      <TableCell className="text-right text-[13px]">{money(r.originalPrice)}</TableCell>
                      <TableCell className="text-right text-[13px]">
                        <div className="font-semibold">{money(r.campaignPrice)}</div>
                        <div className="text-[11px] text-[#7A90AB]">{t("discountOff", { percent: discountPercent(r.campaignPrice, r.originalPrice) })}</div>
                      </TableCell>
                      <TableCell className="text-right text-[13px]">{t("stockValue", { committed: r.committedStock, available: r.variant.stock })}</TableCell>
                      <TableCell>
                        <RegistrationStatusBadge status={r.status} />
                        {r.rejectionReason && <div className="mt-1 max-w-[220px] text-[11px] text-red-700">{r.rejectionReason}</div>}
                      </TableCell>
                      <TableCell className="text-right">{actions(r)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="divide-y divide-[#F0F4FA] lg:hidden">
              {rows.map((r) => (
                <li key={r.id} className="space-y-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      {reviewable && r.status === "PENDING" && (
                        <input
                          type="checkbox"
                          className="mt-1"
                          aria-label={t("selectItem", { product: r.product.name })}
                          checked={selected.includes(r.id)}
                          onChange={(e) => setSelected((s) => (e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id)))}
                        />
                      )}
                      <div>{productCell(r)}</div>
                    </div>
                    <RegistrationStatusBadge status={r.status} />
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
                    <dt className="text-[#7A90AB]">{t("vendor")}</dt>
                    <dd>{r.vendor.storeName}</dd>
                    <dt className="text-[#7A90AB]">{t("originalPrice")}</dt>
                    <dd>{money(r.originalPrice)}</dd>
                    <dt className="text-[#7A90AB]">{t("campaignPrice")}</dt>
                    <dd className="font-semibold">
                      {money(r.campaignPrice)} <span className="font-normal text-[#7A90AB]">({t("discountOff", { percent: discountPercent(r.campaignPrice, r.originalPrice) })})</span>
                    </dd>
                    <dt className="text-[#7A90AB]">{t("stock")}</dt>
                    <dd>{t("stockValue", { committed: r.committedStock, available: r.variant.stock })}</dd>
                  </dl>
                  {r.rejectionReason && <p className="text-[11.5px] text-red-700">{r.rejectionReason}</p>}
                  {actions(r)}
                </li>
              ))}
            </ul>
            {pg && (
              <nav className="flex items-center justify-between gap-2 border-t border-[#F0F4FA] px-4 py-3 text-[12.5px] text-[#7A90AB]" aria-label={tc("pagination")}>
                <span>{tc("pageOf", { page: pg.page, totalPages: pg.totalPages, total: pg.total })}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(pg.page - 1)} disabled={pg.page <= 1} aria-label={tc("previous")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(pg.page + 1)} disabled={pg.page >= pg.totalPages} aria-label={tc("next")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </nav>
            )}
          </div>
        )}
      </div>

      {/* Reject one */}
      <Dialog open={rejecting !== null} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rejectTitle")}</DialogTitle>
            <DialogDescription>{rejecting && t("rejectBody", { product: rejecting.reg.product.name, vendor: rejecting.reg.vendor.storeName })}</DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="reject-reason">{t("reason")}</Label>
            <Textarea id="reject-reason" className="mt-1.5" rows={3} maxLength={REASON_MAX} value={rejecting?.reason ?? ""} onChange={(e) => rejecting && setRejecting({ ...rejecting, reason: e.target.value, error: undefined })} aria-describedby="reject-reason-count" />
            <p id="reject-reason-count" className="mt-1 text-[11px] text-[#7A90AB]">
              {(rejecting?.reason.trim().length ?? 0)}/{REASON_MAX}
            </p>
          </div>
          {rejecting?.error && <NoticeBox title={rejecting.error} tone="danger" />}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejecting(null)} disabled={rejectState.isLoading}>
              {t("back")}
            </Button>
            <Button variant="destructive" onClick={() => void doReject()} disabled={!rejecting?.reason.trim() || rejectState.isLoading}>
              {t("reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval refused: rule violations from the server */}
      <Dialog open={violations !== null} onOpenChange={(o) => !o && setViolations(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("violationsTitle")}</DialogTitle>
            <DialogDescription>{violations && t("violationsBody", { product: violations.reg.product.name })}</DialogDescription>
          </DialogHeader>
          {violations && <ViolationList violations={violations.list} />}
          <DialogFooter>
            <Button onClick={() => setViolations(null)}>{t("close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk review */}
      <Dialog open={bulk !== null} onOpenChange={(o) => !o && !bulkState.isLoading && setBulk(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {bulk?.step === "reason" && (
            <>
              <DialogHeader>
                <DialogTitle>{t("bulkRejectTitle")}</DialogTitle>
                <DialogDescription>{bulk.ids ? t("bulkScopeSelected", { count: bulk.ids.length }) : t("bulkScopeAll")}</DialogDescription>
              </DialogHeader>
              <div>
                <Label htmlFor="bulk-reason">{t("reason")}</Label>
                <Textarea id="bulk-reason" className="mt-1.5" rows={3} maxLength={REASON_MAX} value={bulk.reason} onChange={(e) => setBulk({ ...bulk, reason: e.target.value })} />
                <p className="mt-1 text-[11px] text-[#7A90AB]">
                  {bulk.reason.trim().length}/{REASON_MAX}
                </p>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setBulk(null)}>
                  {t("back")}
                </Button>
                <Button onClick={() => void preview("reject", bulk.ids, bulk.reason.trim())} disabled={!bulk.reason.trim() || bulkState.isLoading}>
                  {t("bulkPreviewButton")}
                </Button>
              </DialogFooter>
            </>
          )}
          {bulk?.step === "preview" && (
            <>
              <DialogHeader>
                <DialogTitle>{bulk.action === "approve" ? t("bulkApproveTitle") : t("bulkRejectTitle")}</DialogTitle>
                <DialogDescription>
                  {bulk.action === "approve"
                    ? t("bulkApprovePreview", { count: bulk.preview.count, eligible: bulk.preview.eligibleCount ?? 0 })
                    : t("bulkRejectPreview", { count: bulk.preview.count })}
                </DialogDescription>
              </DialogHeader>
              {bulk.action === "approve" && (bulk.preview.ineligible?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <p className="text-[12.5px] font-semibold text-[#0D1B2E]">{t("bulkIneligible", { count: bulk.preview.ineligible!.length })}</p>
                  <ul className="space-y-2">
                    {bulk.preview.ineligible!.map((x) => {
                      const r = rows.find((row) => row.id === x.id);
                      return (
                        <li key={x.id} className="rounded-lg border border-red-100 bg-red-50/50 p-2">
                          <p className="text-[12.5px] font-medium">{r ? `${r.product.name} — ${r.vendor.storeName}` : x.id}</p>
                          <ViolationList violations={x.violations} />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {bulk.error && <NoticeBox title={bulk.error} tone="danger" />}
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setBulk(null)} disabled={bulkState.isLoading}>
                  {t("back")}
                </Button>
                {bulk.error ? (
                  <Button onClick={() => void preview(bulk.action, bulk.ids, bulk.reason)} disabled={bulkState.isLoading}>
                    {t("bulkPreviewAgain")}
                  </Button>
                ) : (
                  <Button
                    variant={bulk.action === "reject" ? "destructive" : "default"}
                    onClick={() => void confirmBulk()}
                    disabled={bulkState.isLoading || bulk.preview.count === 0 || (bulk.action === "approve" && (bulk.preview.eligibleCount ?? 0) === 0)}
                  >
                    {bulk.action === "approve" ? t("bulkConfirmApprove", { count: bulk.preview.eligibleCount ?? 0 }) : t("bulkConfirmReject", { count: bulk.preview.count })}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
          {bulk?.step === "result" && (
            <>
              <DialogHeader>
                <DialogTitle>{t("bulkResultTitle")}</DialogTitle>
                <DialogDescription>{t("bulkResultBody", { applied: bulk.result.appliedCount, total: bulk.result.count })}</DialogDescription>
              </DialogHeader>
              {bulk.result.skipped.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[12.5px] font-semibold text-[#0D1B2E]">{t("bulkSkipped", { count: bulk.result.skipped.length })}</p>
                  <ul className="space-y-2">
                    {bulk.result.skipped.map((s) => {
                      const r = rows.find((row) => row.id === s.id);
                      return (
                        <li key={s.id} className="rounded-lg border border-red-100 bg-red-50/50 p-2">
                          <p className="text-[12.5px] font-medium">{r ? `${r.product.name} — ${r.vendor.storeName}` : s.id}</p>
                          <p className="text-[12px] text-red-800">{s.message}</p>
                          {s.details?.violations && <ViolationList violations={s.details.violations} />}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setBulk(null)}>{t("close")}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
