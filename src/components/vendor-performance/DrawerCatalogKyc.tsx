// components/vendor-performance/DrawerCatalogKyc.tsx
//
// "Catalog" and "KYC & compliance" tabs. Both read the Phase 4 detail
// endpoints, which evaluate the same pure rules the nightly snapshot uses.

"use client";

import * as React from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { dateText } from "@/lib/billing/format";
import { Button } from "@/components/ui/button";
import {
  useGetVendorPerformanceCatalogQuery,
  useGetVendorPerformanceKycQuery,
} from "@/features/vendorPerformanceApi";
import type { ScoreConfig } from "./types";
import {
  apiErrorText,
  catalogIssueText,
  coverageTone,
  docStateMeta,
  expiryText,
  formatDay,
  formatNumber,
  graceText,
  kycMeta,
  percentText,
} from "./format";
import {
  Chip,
  EmptyState,
  ErrorState,
  Kpi,
  LoadingBlock,
  Meter,
  SetExpiryDialog,
  type ExpiryTarget,
} from "./shared";

/* ─── catalog ───────────────────────────────────────────────────────────── */

export function CatalogSection({
  vendorId,
  config,
}: {
  vendorId: string;
  config: ScoreConfig | null;
}) {
  const { data, isLoading, isError, error, refetch } = useGetVendorPerformanceCatalogQuery({
    vendorId,
    limit: 50,
  });
  const [showAll, setShowAll] = React.useState(false);

  if (isLoading) return <LoadingBlock label="Loading catalog" rows={5} />;
  if (isError || !data) {
    return (
      <ErrorState
        title="Could not load the catalog"
        message={apiErrorText(error, "The catalog read failed.").message}
        onRetry={() => refetch()}
      />
    );
  }

  const target = config?.catalogFlagMinProducts ?? null;
  const items = showAll ? data.items : data.items.slice(0, 10);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi
          label="Qualified products"
          value={
            <span>
              {formatNumber(data.summary.qualified, 0)}
              {target !== null ? (
                <span className="text-base font-normal text-muted-foreground">
                  {" "}
                  / {target}
                </span>
              ) : null}
            </span>
          }
          tone={target !== null && data.summary.qualified >= target ? "emerald" : "amber"}
          hint="Fully complete products"
        />
        <Kpi
          label="Avg completeness"
          value={percentText(data.summary.averageCompletenessPct)}
          hint={`${formatNumber(data.summary.total, 0)} approved product(s)`}
        />
        <Kpi
          label="Images required"
          value={formatNumber(data.summary.minImages, 0)}
          hint="Per product, incl. variant images"
        />
        <Kpi
          label="Description required"
          value={formatNumber(data.summary.minDescriptionChars, 0)}
          hint="Characters per product"
        />
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          title="No approved products"
          description="Only approved, non-deleted products are evaluated for completeness."
        />
      ) : (
        <div className="rounded-xl border">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <h4 className="text-sm font-semibold">Weakest products first</h4>
            <p className="text-[11px] text-muted-foreground">
              Showing {formatNumber(items.length, 0)} of {formatNumber(data.items.length, 0)}
            </p>
          </div>
          <ul className="divide-y">
            {items.map((product) => (
              <li key={product.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {product.issues.length === 0 ? (
                      <Chip tone="emerald">Complete</Chip>
                    ) : (
                      product.issues.map((issue) => (
                        <Chip key={issue.code} tone="amber">
                          {catalogIssueText(issue)}
                        </Chip>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex w-28 items-center gap-2">
                  <Meter
                    value={product.completenessScore}
                    tone={coverageTone(product.completenessScore)}
                    label={`${product.name} completeness`}
                  />
                  <span className="w-10 text-right text-[11px] tabular-nums text-muted-foreground">
                    {formatNumber(product.completenessScore, 0)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {data.items.length > 10 ? (
            <div className="border-t px-3 py-2">
              <Button size="sm" variant="ghost" onClick={() => setShowAll((value) => !value)}>
                {showAll ? "Show weakest 10" : `Show all ${data.items.length}`}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ─── KYC ───────────────────────────────────────────────────────────────── */

const DOC_STATUS_TONE = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "emerald" as const;
    case "EXPIRY_UNKNOWN":
      return "sky" as const;
    case "EXPIRED":
    case "REJECTED":
      return "rose" as const;
    case "PENDING":
    case "UNDER_REVIEW":
      return "amber" as const;
    default:
      return "slate" as const;
  }
};

export function KycSection({ vendorId, storeName }: { vendorId: string; storeName: string }) {
  const { data, isLoading, isError, error, refetch } = useGetVendorPerformanceKycQuery(vendorId);
  const [target, setTarget] = React.useState<ExpiryTarget | null>(null);

  if (isLoading) return <LoadingBlock label="Loading KYC documents" rows={4} />;
  if (isError || !data) {
    return (
      <ErrorState
        title="Could not load KYC documents"
        message={apiErrorText(error, "The KYC read failed.").message}
        onRetry={() => refetch()}
      />
    );
  }

  const headline = kycMeta(data.headline);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kpi label="KYC headline" value={<span className="text-lg">{headline.label}</span>} tone={headline.tone} />
        <Kpi
          label="Valid weight"
          value={percentText(data.validWeightPct)}
          hint="Missing expiry dates earn half credit"
        />
        <Kpi
          label="Grace window"
          value={`${formatNumber(data.graceDays, 0)} days`}
          hint="After expiry before restriction"
        />
      </div>

      {data.restricted ? (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Listings are restricted: a required document is past expiry + grace.
            {data.restrictedAt ? ` Restricted since ${formatDay(data.restrictedAt)}.` : ""}
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Not restricted. Evaluated {formatDay(data.evaluatedAt)}.</p>
        </div>
      )}

      {data.documents.length === 0 ? (
        <EmptyState title="No KYC documents on file" />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-medium">Document</th>
                <th className="px-3 py-2 font-medium">Verification</th>
                <th className="px-3 py-2 font-medium">State</th>
                <th className="px-3 py-2 font-medium">Expiry</th>
                <th className="px-3 py-2 font-medium">Reminders</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {data.documents.map((doc) => {
                const state = docStateMeta(doc.state);
                const grace = graceText(doc);
                const lastNotice = doc.notices.length
                  ? doc.notices[doc.notices.length - 1]
                  : null;
                return (
                  <tr key={doc.id} className="border-b last:border-0 align-top">
                    <td className="px-3 py-2">
                      <p className="font-medium">{doc.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {doc.type.replace(/_/g, " ").toLowerCase()}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <Chip tone={DOC_STATUS_TONE(doc.status)}>{doc.status.replace(/_/g, " ")}</Chip>
                    </td>
                    <td className="px-3 py-2">
                      <Chip tone={state.tone}>{state.label}</Chip>
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-xs">{expiryText(doc)}</p>
                      {doc.expiresAt ? (
                        <p className="text-[11px] text-muted-foreground">
                          {dateText(doc.expiresAt)}
                          {grace ? ` · ${grace}` : ""}
                        </p>
                      ) : doc.requiresExpiry ? (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300">
                          Expiry date not recorded
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {!lastNotice ? (
                        <span className="text-muted-foreground">None</span>
                      ) : (
                        <>
                          <p>
                            {doc.notices.length} sent · last {lastNotice.window}-day notice
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDay(lastNotice.notifiedAt)}
                          </p>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {doc.requiresExpiry ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setTarget({
                              documentId: doc.id,
                              label: doc.label,
                              storeName,
                              expiresAt: doc.expiresAt,
                            })
                          }
                        >
                          {doc.expiresAt ? "Change expiry" : "Set expiry"}
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">No expiry</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        States are re-evaluated on read with the same rules as the nightly KYC sweep. A future
        expiry date revives an unknown or expired document to approved.
      </p>
      <SetExpiryDialog target={target} onClose={() => setTarget(null)} />
    </div>
  );
}
