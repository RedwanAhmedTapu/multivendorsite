"use client";

// /admin-dashboard/promotions/email-sms — Email & SMS Campaigns dashboard.
//
// LAYOUT IS REAL, DATA IS NOT AVAILABLE. The backend has no campaign model, no
// recipient table, no send log and no template store, so every metric renders an
// em dash with an explicit reason instead of a fabricated zero, and the table
// shows an empty-data state rather than sample rows. Nothing here pretends a
// send happened; the Create flow is disabled with its reason shown.
//
// The vendor-programme administration lives at /admin-dashboard/promotions/programmes.

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays, ChevronLeft, ChevronRight, FileText, Filter, Mail, MessageSquare,
  Plus, RotateCcw, Search, Send, Sparkles, Users,
} from "lucide-react";

type Tab = "all" | "email" | "sms" | "scheduled" | "drafts";

const TABS: { id: Tab; label: string; disabled?: boolean; why?: string }[] = [
  { id: "all", label: "All Campaigns" },
  { id: "email", label: "Email Campaigns" },
  { id: "sms", label: "SMS Campaigns" },
  { id: "scheduled", label: "Scheduled", disabled: true, why: "No campaign status to filter on yet" },
  { id: "drafts", label: "Drafts", disabled: true, why: "No campaign status to filter on yet" },
];

const METRICS = [
  { id: "total", label: "Total Campaigns", icon: Sparkles, why: "No campaign table exists" },
  { id: "email", label: "Emails Sent", icon: Send, why: "No send log — provider acceptance is not delivery" },
  { id: "sms", label: "SMS Sent", icon: MessageSquare, why: "No send log or SMS campaign records" },
  { id: "recipients", label: "Total Recipients", icon: Users, why: "No audience or recipient records" },
];

const QUICK_ACTIONS = [
  { label: "Create Email Campaign", hint: "Needs the campaign model", icon: Mail },
  { label: "Create SMS Campaign", hint: "Needs the campaign model", icon: MessageSquare },
  { label: "Manage Templates", hint: "No template store", icon: FileText },
  { label: "View Reports", hint: "No reporting data", icon: CalendarDays },
];

export default function EmailSmsCampaignsScreen() {
  const [tab, setTab] = React.useState<Tab>("all");
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [range, setRange] = React.useState("30d");
  const reset = () => { setSearch(""); setType("all"); setStatus("all"); setRange("30d"); };

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-5 sm:px-4 sm:py-6">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-4">
        {/* header */}
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Email &amp; SMS Campaigns</h1>
            <p className="text-sm text-slate-500">Create and manage your email and SMS campaigns to reach your customers.</p>
          </div>
          <button
            type="button"
            disabled
            title="Unavailable: no campaign model or send queue exists yet"
            className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white opacity-50"
          >
            <Plus size={15} /> Create Campaign
          </button>
        </header>

        {/* metrics */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><m.icon size={15} /></span>
                <p className="text-xs font-medium text-slate-500">{m.label}</p>
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-400" aria-label={`${m.label} unavailable`}>—</p>
              <p className="mt-1 text-xs text-slate-500">{m.why}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* main card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-5 overflow-x-auto border-b border-slate-200 px-3">
              {TABS.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={t.disabled}
                    title={t.why}
                    aria-pressed={active}
                    onClick={() => setTab(t.id)}
                    className={`-mb-px shrink-0 border-b-2 px-0.5 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      active ? "border-indigo-600 font-semibold text-indigo-700" : "border-transparent font-medium text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* filters */}
            <div className="grid grid-cols-1 gap-2 border-b border-slate-200 p-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto]">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  aria-label="Search campaigns"
                  placeholder="Search campaign name, subject or description…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <select aria-label="Campaign type" value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                <option value="all">All Types</option><option value="welcome">Welcome</option><option value="promotional">Promotional</option><option value="transactional">Transactional</option><option value="reminder">Reminder</option>
              </select>
              <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                <option value="all">All Status</option><option value="completed">Completed</option><option value="running">Running</option><option value="paused">Paused</option><option value="draft">Draft</option>
              </select>
              <select aria-label="Date range" value={range} onChange={(e) => setRange(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                <option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="all">All time</option>
              </select>
              <div className="flex items-center gap-2">
                <button type="button" disabled title="No campaign data to filter" className="inline-flex h-10 cursor-not-allowed items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white opacity-50">
                  <Filter size={13} /> Apply
                </button>
                <button type="button" onClick={reset} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30">
                  <RotateCcw size={13} /> Reset
                </button>
              </div>
            </div>

            {/* table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2.5">Campaign Name</th><th className="px-4 py-2.5">Type</th><th className="px-4 py-2.5">Channel</th><th className="px-4 py-2.5">Recipients</th><th className="px-4 py-2.5">Sent At</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center">
                      <div className="mx-auto flex max-w-md flex-col items-center gap-1.5">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-400"><Mail size={18} /></span>
                        <p className="text-sm font-semibold text-slate-900">Campaign data isn&apos;t available yet</p>
                        <p className="text-xs leading-relaxed text-slate-500">
                          This table is wired for a campaign API, but no campaign records exist and no endpoint serves them.
                          Rows will appear here once the campaign model, send log and listing endpoint are in place.
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Filters: {search ? `“${search}” · ` : ""}type {type} · status {status} · {range}
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* pagination */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2.5">
              <span className="text-xs text-slate-500">Showing 0 of 0 campaigns</span>
              <div className="flex items-center gap-2">
                <button type="button" disabled className="grid h-8 w-8 cursor-not-allowed place-items-center rounded-lg border border-slate-200 text-slate-300"><ChevronLeft size={14} /></button>
                <span className="text-xs text-slate-500">Page 1 of 1</span>
                <button type="button" disabled className="grid h-8 w-8 cursor-not-allowed place-items-center rounded-lg border border-slate-200 text-slate-300"><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>

          {/* right rail */}
          <div className="flex flex-col gap-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Quick Actions</h2>
              <ul className="space-y-1.5">
                {QUICK_ACTIONS.map((a) => (
                  <li key={a.label}>
                    <button type="button" disabled title={`Unavailable: ${a.hint}`} className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-xl border border-slate-200 px-2.5 py-2 text-left opacity-60">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><a.icon size={13} /></span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800">{a.label}</span>
                        <span className="block text-xs text-slate-500">{a.hint}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Recent Activity</h2>
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center">
                <p className="text-xs font-medium text-slate-600">No activity to show</p>
                <p className="mt-1 text-xs text-slate-500">Activity is derived from campaign sends, which do not exist yet.</p>
              </div>
            </section>

            <Link href="/admin-dashboard/promotions/programmes" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30">
              Promotions &amp; Programmes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}