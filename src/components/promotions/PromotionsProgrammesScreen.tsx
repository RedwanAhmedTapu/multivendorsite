"use client";

// /admin-dashboard/promotions/email-sms — Promotions & Programmes.
//
// Honest scope: the app has no EmailCampaign/SmsCampaign entity, no audience, no
// send log and no provider campaign integration, so this page does NOT show
// email/SMS volumes, delivery statuses, templates or sending actions. What it
// does show is real: marketing campaign pages and their vendor programme
// (GET /api/marketing/admin/campaign-pages), with the existing
// CampaignProgrammeTabs mounted for publish / cancel / registrations.
//
// Statistics are explicitly "in this list" — the list request is paginated, so
// no global total is derived from it.

import * as React from "react";
import { AlertCircle, Layers, Megaphone, RefreshCw, Search } from "lucide-react";
import { MarketingIntlProvider } from "@/i18n/MarketingIntlProvider";
import { useListMarketingCampaignPagesQuery, type CampaignPageSummary } from "@/features/marketingAdminApi";
import { CampaignProgrammeTabs } from "@/components/marketing/admin/CampaignProgrammeTabs";
import { buildListQuery, canGoNext, canGoPrevious, pageForSearch, paginationLabel, readPagination, PROMOTIONS_PAGE_SIZE } from "@/lib/promotions/promotionsProgrammesQuery";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 ring-slate-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  ENDED: "bg-slate-100 text-slate-600 ring-slate-200",
  CANCELLED: "bg-rose-50 text-rose-700 ring-rose-100",
};

function Chip({ status }: { status?: string | null }) {
  if (!status) return <span className="text-xs text-slate-500">No programme</span>;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS_STYLE[status] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Screen() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const { data, isLoading, isError, error, refetch, isFetching } = useListMarketingCampaignPagesQuery(
    buildListQuery({ page, limit: PROMOTIONS_PAGE_SIZE, search })
  );

  const pages: CampaignPageSummary[] = data?.data ?? [];
  const visible = pages;
  const selected = pages.find((p) => p.id === selectedId) ?? null;
  const meta = readPagination((data as { pagination?: unknown } | undefined)?.pagination);
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;

  const withProgramme = pages.filter((p) => p.programme).length;
  const pending = pages.reduce((n, p) => n + (p.programme?.counts?.pending ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-5 sm:px-4 sm:py-6">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <Megaphone size={18} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Promotions &amp; Programmes</h1>
              <p className="text-sm text-slate-500">
                Campaign pages and their vendor programmes. Every figure below comes from the live marketing API.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : undefined} /> Refresh
          </button>
        </header>

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 border-l-4 border-l-amber-400 bg-amber-50 px-3.5 py-2.5">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-800">
            <span className="font-semibold">Email &amp; SMS campaigns are not implemented.</span> There is no campaign
            entity, audience, send log or provider integration in this application, so no send volumes, delivery
            statuses, templates or sending actions are shown here. This page manages the promotional programmes that do
            exist.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Campaign pages (total)" value={total} hint="From the API pagination metadata" />
          <Stat label="With a vendor programme" value={withProgramme} hint={`On page ${page}`} />
          <Stat label="Pending registrations" value={pending} hint={`Sum over page ${page}`} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
            <div className="relative min-w-[240px] flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                aria-label="Search campaign pages"
                placeholder="Search campaign page by title or slug…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(pageForSearch());
                }}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <span className="text-xs text-slate-500">
              {paginationLabel({ page, totalPages, total })}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <AlertCircle size={20} className="text-rose-600" />
              <p className="text-sm font-semibold text-slate-900">Couldn&apos;t load campaign pages</p>
              <p className="max-w-md text-xs text-slate-500">
                {(error as { data?: { message?: string } })?.data?.message ?? "The marketing API did not respond."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-1 inline-flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-12 text-center">
              <Layers size={20} className="text-slate-400" />
              <p className="text-sm font-semibold text-slate-900">{pages.length ? "No page matches that search" : "No campaign pages yet"}</p>
              <p className="text-xs text-slate-500">
                {pages.length ? "Clear the search to see every page." : "Campaign pages are created from the vendor programme tools."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2.5">Campaign page</th>
                    <th className="px-4 py-2.5">Slug</th>
                    <th className="px-4 py-2.5">Programme</th>
                    <th className="px-4 py-2.5">Pending</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => {
                    const active = p.id === selectedId;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedId(active ? null : p.id)}
                        className={`cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 ${active ? "bg-indigo-50/60 shadow-[inset_3px_0_0_theme(colors.indigo.600)]" : ""}`}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.title}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">/campaign/{p.slug}</td>
                        <td className="px-4 py-3">
                          <Chip status={p.programme?.status} />
                        </td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-700">{p.programme?.counts?.pending ?? 0}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(active ? null : p.id);
                            }}
                            aria-label={`${active ? "Close" : "Open"} programme for ${p.title}`}
                            className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            {active ? "Close" : "Manage"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2.5">
            <span className="text-xs text-slate-500">Search runs on the server across all campaign pages.</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canGoPrevious(meta) || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!canGoNext(meta) || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

        {selected && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">{selected.title}</h2>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="h-8 rounded-lg px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <CampaignProgrammeTabs pageId={selected.id} />
          </section>
        )}
      </div>
    </div>
  );
}

export default function PromotionsProgrammesScreen() {
  return (
    <MarketingIntlProvider>
      <Screen />
    </MarketingIntlProvider>
  );
}
