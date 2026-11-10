"use client";

// Admin › POS subscriptions. Mirrors the backend gate (ADMIN, or admin-side
// staff holding posSubscriptionManagement) for display only — every action is
// re-authorized on the server. Plans and the trial policy are editable by
// ADMIN only. Nothing here gives access to a vendor's POS.

import { useEffect, useState } from "react";
import { CreditCard, History, Settings2, Store } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useGetMeQuery } from "@/features/authApi";
import {
  useAdminCreatePosPlanMutation,
  useAdminPosLifecycleMutation,
  useAdminPosPlansQuery,
  useAdminPosPolicyQuery,
  useAdminPosSubscriptionQuery,
  useAdminPosSubscriptionsQuery,
  useAdminSetPosPolicyMutation,
  useAdminUpdatePosPlanMutation,
  type LifecycleOp,
} from "@/features/posSubscriptionAdminApi";
import { ENTITLEMENT_LABEL, SOURCE_LABEL, durationText, formatDate, formatTaka } from "@/lib/pos/subscription-view";
import { validateLifecycleForm } from "@/lib/pos/admin-subscription";

const card = "rounded-[20px] border border-[#e4e1ff] bg-white p-4 shadow-[0_6px_20px_rgba(79,70,229,0.08)]";
const input = "h-11 w-full rounded-[12px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#1e1b4b] placeholder:text-[#64748b] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/40";
const btn = "pos-btn inline-flex h-11 items-center justify-center gap-2 rounded-[12px] px-5 text-sm font-bold text-white";
const STATE_TONE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  GRACE: "bg-amber-50 text-amber-700 ring-amber-200",
  EXPIRED: "bg-rose-50 text-rose-600 ring-rose-200",
  CANCELLED: "bg-rose-50 text-rose-700 ring-rose-200",
  SUSPENDED: "bg-slate-100 text-slate-700 ring-slate-200",
  NONE: "bg-slate-50 text-slate-500 ring-slate-200",
  INVALID: "bg-amber-50 text-amber-800 ring-amber-200",
};

function errText(err: unknown) {
  return (err as { data?: { message?: string } })?.data?.message ?? "Request failed";
}

export default function PosSubscriptionsAdminPage() {
  const { can, isLoading } = usePermissions();
  const { data: meRes } = useGetMeQuery();
  const isAdmin = meRes?.data?.role === "ADMIN";
  const [tab, setTab] = useState<"vendors" | "plans" | "policy">("vendors");

  if (isLoading) return <div className={card}>Loading…</div>;
  if (!can("posSubscriptionManagement")) {
    return <div className={card}><p className="text-sm text-[#3D5068]">You don&apos;t have POS subscription management permission.</p></div>;
  }
  return (
    <div className="pos-shell">
      <style>{`
  .pos-shell{position:relative;min-height:100%;padding:20px 24px;background:#f1f2ff;font-family:Inter,system-ui,sans-serif;isolation:isolate;border-radius:16px}
  .pos-shell::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;border-radius:16px;
    background:radial-gradient(720px 420px at 100% 0%,#e9d5ff 0%,transparent 60%),radial-gradient(680px 400px at 0% 100%,#c7f9ee 0%,transparent 60%)}
  .pos-btn{background:linear-gradient(110deg,#4f46e5,#7c3aed 60%,#c026d3);background-size:200% 100%;background-position:0% 50%;
    box-shadow:0 8px 18px rgba(99,52,224,0.32);transition:background-position .5s ease,transform .2s ease,box-shadow .2s ease;cursor:pointer}
  .pos-btn:hover:not(:disabled){background-position:100% 50%;transform:translateY(-2px);box-shadow:0 12px 24px rgba(99,52,224,0.42)}
  .pos-btn:active:not(:disabled){transform:translateY(0) scale(.98)}
  .pos-btn:focus-visible{outline:3px solid #c4b5fd;outline-offset:2px}
  .pos-btn:disabled{opacity:.6;cursor:not-allowed}
  @media (prefers-reduced-motion: reduce){.pos-btn{transition:none}.pos-btn:hover:not(:disabled){transform:none}}
`}</style>
      <div className="pos-inner space-y-4">
      <header className={`${card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white"><CreditCard className="h-5 w-5" aria-hidden /></span>
          <div>
            <h1 className="text-xl font-bold text-[#0D1B2E]">POS subscriptions</h1>
            <p className="text-sm text-[#7A90AB]">Vendor POS access, plans and the trial policy. Every change needs a reason and is audited.</p>
          </div>
        </div>
        <div role="tablist" aria-label="Sections" className="flex gap-1 rounded-xl bg-[#F1F4F9] p-1">
          {([["vendors", "Vendors", Store], ["plans", "Plans", CreditCard], ["policy", "Trial policy", Settings2]] as const).map(([v, label, Icon]) => (
            <button key={v} type="button" role="tab" aria-selected={tab === v} onClick={() => setTab(v)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${tab === v ? "bg-white text-indigo-700 shadow-sm" : "text-[#3D5068]"}`}>
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </button>
          ))}
        </div>
      </header>
      {tab === "vendors" ? <VendorsTab /> : tab === "plans" ? <PlansTab isAdmin={isAdmin} /> : <PolicyTab isAdmin={isAdmin} />}
      </div>
    </div>
  );
}

function VendorsTab() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => { setQ(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);
  const params = { search: q || undefined, page, limit: 20, ...(filter === "none" ? { hasSubscription: "no" } : filter ? { status: filter } : {}) };
  const list = useAdminPosSubscriptionsQuery(params);
  const rows = list.data?.data ?? [];
  const pages = list.data?.pagination.pages ?? 1;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
      <section className={`${card} overflow-hidden p-0`} aria-label="Vendors">
        <div className="flex flex-col gap-2 border-b border-[#EEF2F7] p-3 sm:flex-row">
          <input className={input} aria-label="Search stores" placeholder="Search store name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className={`${input} sm:w-56`} aria-label="Filter" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
            <option value="">All vendors</option>
            <option value="none">No POS subscription</option>
            <option value="ACTIVE">Status: active</option>
            <option value="EXPIRED">Status: expired</option>
            <option value="CANCELLED">Status: revoked</option>
            <option value="SUSPENDED">Status: suspended</option>
          </select>
        </div>
        {list.isLoading ? <p className="p-4 text-sm text-[#7A90AB]">Loading…</p> : list.isError ? (
          <p role="alert" className="p-4 text-sm text-rose-600">{errText(list.error)}</p>
        ) : rows.length === 0 ? <p className="p-4 text-sm text-[#7A90AB]">No vendors match.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-[#FAFBFD] text-left text-[11px] uppercase tracking-wide text-[#7A90AB]">
                <th className="px-3 py-2">Store</th><th className="px-3 py-2">Access</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Until</th><th className="px-3 py-2">Trial</th><th className="px-3 py-2"><span className="sr-only">Actions</span></th>
              </tr></thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {rows.map((r) => (
                  <tr key={r.vendorId} className={selected === r.vendorId ? "bg-indigo-50/40" : ""}>
                    <td className="px-3 py-2"><p className="font-semibold text-[#0D1B2E]">{r.storeName}</p><p className="text-xs text-[#7A90AB]">{r.vendorStatus}</p></td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${STATE_TONE[r.entitlement.state]}`}>{ENTITLEMENT_LABEL[r.entitlement.state]}</span></td>
                    <td className="px-3 py-2 text-xs">{r.subscription ? SOURCE_LABEL[r.subscription.source] ?? r.subscription.source : "—"}</td>
                    <td className="px-3 py-2 text-xs">{r.subscription ? (r.subscription.expiresAt ? formatDate(r.subscription.expiresAt) : "Open-ended") : "—"}</td>
                    <td className="px-3 py-2 text-xs">{r.trial ? `Used (${r.trial.days}d)` : "Not used"}</td>
                    <td className="px-3 py-2 text-right"><button type="button" className="text-xs font-semibold text-indigo-700 hover:underline" onClick={() => setSelected(r.vendorId)}>Manage</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-[#EEF2F7] px-3 py-2 text-xs text-[#7A90AB]">
            <span>Page {page} of {pages}</span>
            <div className="flex gap-1">
              <button type="button" className="rounded border px-2 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <button type="button" className="rounded border px-2 py-1 disabled:opacity-40" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </section>
      {selected ? <VendorDetail vendorId={selected} /> : <div className={card}><p className="text-sm text-[#7A90AB]">Select a vendor to see its POS history and manage access.</p></div>}
    </div>
  );
}

function VendorDetail({ vendorId }: { vendorId: string }) {
  const d = useAdminPosSubscriptionQuery(vendorId);
  const [run, { isLoading }] = useAdminPosLifecycleMutation();
  const [op, setOp] = useState<LifecycleOp>("extend");
  const [days, setDays] = useState("30");
  const [until, setUntil] = useState("");
  const [openEnded, setOpenEnded] = useState(false);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const detail = d.data?.data;
  const submit = async () => {
    setMsg(null);
    const v = validateLifecycleForm({ op, reason, days, until, openEnded });
    if (!v.ok) return setMsg({ ok: false, text: v.message });
    try {
      await run({ vendorId, ...v.body }).unwrap();
      setMsg({ ok: true, text: "Saved." });
      setReason("");
    } catch (err) {
      setMsg({ ok: false, text: errText(err) });
    }
  };

  if (d.isLoading) return <div className={card}>Loading…</div>;
  if (d.isError || !detail) return <div className={card}><p role="alert" className="text-sm text-rose-600">{errText(d.error)}</p></div>;
  const s = detail.subscription;
  return (
    <section className={`${card} space-y-4`} aria-label="Vendor POS detail">
      <div>
        <p className="text-base font-bold text-[#0D1B2E]">{detail.vendor.storeName}</p>
        <p className="text-xs text-[#7A90AB]">{detail.vendor.email ?? "—"}</p>
        <p className="mt-2 text-sm">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${STATE_TONE[detail.entitlement.state]}`}>{ENTITLEMENT_LABEL[detail.entitlement.state]}</span>
          <span className="ml-2 text-xs text-[#3D5068]">{s ? `${SOURCE_LABEL[s.source] ?? s.source} · ${s.expiresAt ? `until ${formatDate(s.expiresAt)}` : "open-ended"}` : "no subscription"}</span>
        </p>
        <p className="mt-1 text-xs text-[#7A90AB]">Automatic trial: {detail.vendor.posTrialGrant ? `used ${formatDate(detail.vendor.posTrialGrant.grantedAt)} (${detail.vendor.posTrialGrant.days} days)` : "not used"}</p>
      </div>

      <form className="space-y-2 rounded-xl bg-[#FAFBFD] p-3 ring-1 ring-[#EEF2F7]" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <label className="block text-xs font-semibold text-[#3D5068]">Action
          <select className={input} value={op} onChange={(e) => setOp(e.target.value as LifecycleOp)}>
            <option value="extend">Extend access</option>
            <option value="grant">Grant complimentary access</option>
            <option value="suspend">Suspend</option>
            <option value="restore">Restore from suspension</option>
            <option value="revoke">Revoke access</option>
          </select>
        </label>
        {op === "extend" && (
          <label className="block text-xs font-semibold text-[#3D5068]">Days to add
            <input className={input} type="number" min={1} max={3660} value={days} onChange={(e) => setDays(e.target.value)} />
          </label>
        )}
        {op === "grant" && (
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs text-[#3D5068]"><input type="checkbox" checked={openEnded} onChange={(e) => setOpenEnded(e.target.checked)} /> Open-ended (no end date)</label>
            {!openEnded && <label className="block text-xs font-semibold text-[#3D5068]">Access until<input className={input} type="date" value={until} onChange={(e) => setUntil(e.target.value)} /></label>}
          </div>
        )}
        <label className="block text-xs font-semibold text-[#3D5068]">Reason (required, saved in the audit history)
          <textarea className={`${input} h-16 py-2`} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        {msg && <p role="status" className={`text-xs font-semibold ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</p>}
        <button type="submit" className={btn} disabled={isLoading}>{isLoading ? "Saving…" : "Apply"}</button>
      </form>

      <div>
        <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-[#0D1B2E]"><History className="h-4 w-4" aria-hidden /> History</p>
        {!s?.periods?.length ? <p className="text-xs text-[#7A90AB]">No history.</p> : (
          <ul className="max-h-64 space-y-1.5 overflow-y-auto text-xs">
            {s.periods.map((p) => (
              <li key={p.id} className="rounded-lg bg-[#FAFBFD] px-2.5 py-1.5 ring-1 ring-[#EEF2F7]">
                <span className="font-semibold">{p.kind}</span> · {formatDate(p.createdAt)} · {p.previousStatus ?? "—"} → {p.newStatus ?? "—"}, until {p.newExpiresAt ? formatDate(p.newExpiresAt) : "open-ended"}
                {p.reason && <span className="block text-[#7A90AB]">{p.reason} ({p.actorRole ?? "?"})</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-1 text-sm font-semibold text-[#0D1B2E]">Payments</p>
        {!detail.payments.length ? <p className="text-xs text-[#7A90AB]">No payments.</p> : (
          <ul className="space-y-1 text-xs">
            {detail.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2"><span>{formatDate(p.createdAt)} · {p.plan?.name ?? "—"} · {formatTaka(p.amount)}</span><span className="font-mono">{p.status} · {p.tranId}</span>
                {p.failureReason && <span className="w-full text-rose-600">{p.failureReason}</span>}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function PlansTab({ isAdmin }: { isAdmin: boolean }) {
  const plans = useAdminPosPlansQuery();
  const [create, { isLoading }] = useAdminCreatePosPlanMutation();
  const [update] = useAdminUpdatePosPlanMutation();
  const [form, setForm] = useState({ code: "", name: "", price: "", durationDays: "30", description: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = async () => {
    setMsg(null);
    try {
      await create({ code: form.code, name: form.name, price: form.price, durationDays: Number(form.durationDays), description: form.description || undefined }).unwrap();
      setForm({ code: "", name: "", price: "", durationDays: "30", description: "" });
      setMsg({ ok: true, text: "Plan created." });
    } catch (err) {
      setMsg({ ok: false, text: errText(err) });
    }
  };
  return (
    <div className="pos-shell">
      <style>{`
  .pos-shell{position:relative;min-height:100%;padding:20px 24px;background:#f1f2ff;font-family:Inter,system-ui,sans-serif;isolation:isolate;border-radius:16px}
  .pos-shell::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;border-radius:16px;
    background:radial-gradient(720px 420px at 100% 0%,#e9d5ff 0%,transparent 60%),radial-gradient(680px 400px at 0% 100%,#c7f9ee 0%,transparent 60%)}
  .pos-btn{background:linear-gradient(110deg,#4f46e5,#7c3aed 60%,#c026d3);background-size:200% 100%;background-position:0% 50%;
    box-shadow:0 8px 18px rgba(99,52,224,0.32);transition:background-position .5s ease,transform .2s ease,box-shadow .2s ease;cursor:pointer}
  .pos-btn:hover:not(:disabled){background-position:100% 50%;transform:translateY(-2px);box-shadow:0 12px 24px rgba(99,52,224,0.42)}
  .pos-btn:active:not(:disabled){transform:translateY(0) scale(.98)}
  .pos-btn:focus-visible{outline:3px solid #c4b5fd;outline-offset:2px}
  .pos-btn:disabled{opacity:.6;cursor:not-allowed}
  @media (prefers-reduced-motion: reduce){.pos-btn{transition:none}.pos-btn:hover:not(:disabled){transform:none}}
`}</style>
      <div className="pos-inner space-y-4">
      <section className={card} aria-label="Plans">
        {plans.isLoading ? <p className="text-sm text-[#7A90AB]">Loading…</p> : !plans.data?.data?.length ? <p className="text-sm text-[#7A90AB]">No plans yet. Vendors can&apos;t buy until a plan exists.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-[#7A90AB]"><th className="py-2">Plan</th><th>Price</th><th>Duration</th><th>Status</th><th /></tr></thead>
            <tbody className="divide-y divide-[#EEF2F7]">
              {plans.data.data.map((p) => (
                <tr key={p.id}>
                  <td className="py-2"><p className="font-semibold">{p.name}</p><p className="font-mono text-xs text-[#7A90AB]">{p.code}</p></td>
                  <td>{formatTaka(p.price)}</td>
                  <td>{durationText(p.durationDays)}</td>
                  <td>{p.isActive ? "Active" : "Hidden"}</td>
                  <td className="text-right">{isAdmin && (
                    <button type="button" className="text-xs font-semibold text-indigo-700 hover:underline" onClick={() => update({ planId: p.id, isActive: !p.isActive })}>
                      {p.isActive ? "Hide" : "Show"}
                    </button>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {isAdmin ? (
        <form className={`${card} grid gap-2 sm:grid-cols-2`} onSubmit={(e) => { e.preventDefault(); submit(); }} aria-label="New plan">
          <p className="sm:col-span-2 text-sm font-semibold text-[#0D1B2E]">New plan</p>
          <input className={input} aria-label="Code" placeholder="Code, e.g. MONTHLY" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <input className={input} aria-label="Name" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={input} aria-label="Price (BDT)" placeholder="Price in BDT, e.g. 1500.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input className={input} aria-label="Duration (days)" type="number" min={1} max={3660} value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} />
          <input className={`${input} sm:col-span-2`} aria-label="Description" placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {msg && <p role="status" className={`sm:col-span-2 text-xs font-semibold ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</p>}
          <button type="submit" className={`${btn} sm:col-span-2 sm:justify-self-start`} disabled={isLoading}>Create plan</button>
        </form>
      ) : <p className="text-xs text-[#7A90AB]">Only an administrator can create or change plans.</p>}
      </div>
    </div>
  );
}

function PolicyTab({ isAdmin }: { isAdmin: boolean }) {
  const pol = useAdminPosPolicyQuery();
  const [save, { isLoading }] = useAdminSetPosPolicyMutation();
  const [form, setForm] = useState<{ trialEnabled: boolean; trialDays: string; graceDays: string } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    const p = pol.data?.data;
    if (p && !form) setForm({ trialEnabled: p.trialEnabled, trialDays: p.trialDays ? String(p.trialDays) : "", graceDays: String(p.graceDays) });
  }, [pol.data, form]);
  if (pol.isLoading || !form) return <div className={card}>Loading…</div>;
  const submit = async () => {
    setMsg(null);
    try {
      await save({ trialEnabled: form.trialEnabled, trialDays: form.trialDays ? Number(form.trialDays) : null, graceDays: Number(form.graceDays || 0) }).unwrap();
      setMsg({ ok: true, text: "Policy saved. It applies to vendors approved from now on." });
    } catch (err) {
      setMsg({ ok: false, text: errText(err) });
    }
  };
  return (
    <form className={`${card} max-w-lg space-y-3`} onSubmit={(e) => { e.preventDefault(); submit(); }} aria-label="Trial policy">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={!isAdmin} checked={form.trialEnabled} onChange={(e) => setForm({ ...form, trialEnabled: e.target.checked })} /> Give newly approved vendors a free POS trial</label>
      <label className="block text-xs font-semibold text-[#3D5068]">Trial length (days, 1–365)
        <input className={input} type="number" min={1} max={365} disabled={!isAdmin} value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: e.target.value })} />
      </label>
      <label className="block text-xs font-semibold text-[#3D5068]">Grace period after expiry (days, 0–30)
        <input className={input} type="number" min={0} max={30} disabled={!isAdmin} value={form.graceDays} onChange={(e) => setForm({ ...form, graceDays: e.target.value })} />
      </label>
      <p className="text-xs text-[#7A90AB]">Each vendor can receive the automatic trial at most once — re-approval never grants another.</p>
      {msg && <p role="status" className={`text-xs font-semibold ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</p>}
      {isAdmin ? <button type="submit" className={btn} disabled={isLoading}>Save policy</button> : <p className="text-xs text-[#7A90AB]">Only an administrator can change the policy.</p>}
    </form>
  );
}
