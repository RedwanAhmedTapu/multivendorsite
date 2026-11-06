"use client";

// Admin › Subscriptions: Feature Management, Billing Cycle Management and the
// Plan builder. Everything shown or sold comes from these records.

import { useEffect, useMemo, useState } from "react";
import { Archive, Copy, Eye, EyeOff, Layers, Pencil, Plus, Puzzle, Repeat, Send, Star, Trash2, Undo2 } from "lucide-react";
import {
  apiError,
  useSubsCyclesQuery,
  useSubsDuplicatePlanMutation,
  useSubsFeaturesQuery,
  useSubsPlanFeaturesMutation,
  useSubsPlanPricesMutation,
  useSubsPlanQuery,
  useSubsPlanStatusMutation,
  useSubsPlansQuery,
  useSubsSaveCycleMutation,
  useSubsSaveFeatureMutation,
  useSubsSavePlanMutation,
  type LimitConfig,
  type LimitDef,
  type SubCycle,
  type SubFeature,
  type SubPackage,
} from "@/features/billingApi";
import { STATE_TONE, limitText, perCycle, taka } from "@/lib/billing/format";
import { Badge, Button, Card, EmptyState, Field, Modal, Notice, Skeleton, Toggle, cx, inputCls, tableCls, tdCls, textareaCls, thCls } from "@/components/billing/ui";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
const keyify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/^(\d)/, "f_$1").slice(0, 50);

// ─── features ───────────────────────────────────────────────────────────────

export function FeaturesSection() {
  const { data, isLoading } = useSubsFeaturesQuery();
  const [editing, setEditing] = useState<Partial<SubFeature> | null>(null);
  const features = data?.data ?? [];
  return (
    <Card title="Features" action={<Button size="sm" onClick={() => setEditing({ limitDefs: [], isActive: true, enforced: false })}><Plus className="h-4 w-4" />New feature</Button>}>
      <Notice tone="violet">
        A feature&apos;s key is what the backend checks (for example <code>pos</code>, <code>accounting</code>, <code>virtual_try_on</code>). Turning on <b>Block without a plan</b> makes the server refuse vendors whose plan
        doesn&apos;t include it, so switch it on only after vendors have had time to subscribe.
      </Notice>
      <div className="mt-4">
        {isLoading ? <Skeleton /> : !features.length ? (
          <EmptyState icon={<Puzzle className="h-5 w-5" />} title="No features yet" body="Create the modules you sell: POS, Virtual Try-On, Accounting, Analytics, Inventory…" />
        ) : (
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead><tr className="border-b border-[#ede9fe]"><th className={thCls}>Feature</th><th className={thCls}>Key</th><th className={thCls}>Limits</th><th className={thCls}>Plans</th><th className={thCls}>Status</th><th className={thCls} /></tr></thead>
              <tbody>
                {features.map((f) => (
                  <tr key={f.id} className="border-b border-[#f5f3ff] last:border-0">
                    <td className={tdCls}><div className="font-medium">{f.name}</div>{f.category && <div className="text-xs text-[#64748b]">{f.category}</div>}</td>
                    <td className={tdCls}><code className="rounded bg-[#f5f3ff] px-1.5 py-0.5 text-xs text-[#6d28d9]">{f.key}</code></td>
                    <td className={tdCls}>{f.limitDefs.length ? f.limitDefs.map((d) => d.label).join(", ") : <span className="text-[#94a3b8]">On / off</span>}</td>
                    <td className={tdCls}>{f._count?.packages ?? 0}</td>
                    <td className={tdCls}>
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={f.isActive ? "green" : "slate"}>{f.isActive ? "Active" : "Inactive"}</Badge>
                        <Badge tone={f.enforced ? "violet" : "amber"}>{f.enforced ? "Blocking" : "Monitor only"}</Badge>
                      </div>
                    </td>
                    <td className={`${tdCls} text-right`}><Button size="sm" variant="ghost" onClick={() => setEditing(f)}><Pencil className="h-3.5 w-3.5" />Edit</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editing && <FeatureModal feature={editing} onClose={() => setEditing(null)} />}
    </Card>
  );
}

function FeatureModal({ feature, onClose }: { feature: Partial<SubFeature>; onClose: () => void }) {
  const [save, { isLoading }] = useSubsSaveFeatureMutation();
  const [f, setF] = useState<Partial<SubFeature>>(feature);
  const [err, setErr] = useState<string | null>(null);
  const isNew = !feature.id;
  const defs = f.limitDefs ?? [];
  const setDef = (i: number, patch: Partial<LimitDef>) => setF({ ...f, limitDefs: defs.map((d, j) => (j === i ? { ...d, ...patch } : d)) });
  const submit = async () => {
    setErr(null);
    try {
      const body: Partial<SubFeature> = { name: f.name, description: f.description ?? null, icon: f.icon ?? null, color: f.color || null, category: f.category ?? null, sortOrder: Number(f.sortOrder ?? 0), isActive: f.isActive !== false, enforced: Boolean(f.enforced), limitDefs: defs.map((d) => ({ ...d, unit: d.unit || undefined, period: d.period || undefined })) };
      await save(isNew ? { ...body, key: f.key } : { ...body, id: feature.id }).unwrap();
      onClose();
    } catch (e) {
      setErr(apiError(e));
    }
  };
  return (
    <Modal open title={isNew ? "New feature" : `Edit ${feature.name}`} onClose={onClose} wide footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={isLoading}>Save feature</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name"><input className={inputCls} value={f.name ?? ""} onChange={(e) => setF({ ...f, name: e.target.value })} onBlur={() => isNew && !f.key && f.name && setF((x) => ({ ...x, key: keyify(x.name ?? "") }))} /></Field>
        <Field label="Key" hint={isNew ? "Used by the backend; can't be changed later." : "Can't be changed."}><input className={inputCls} value={f.key ?? ""} disabled={!isNew} onChange={(e) => setF({ ...f, key: keyify(e.target.value) })} /></Field>
        <Field label="Category"><input className={inputCls} value={f.category ?? ""} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Sales, Operations…" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Colour"><input type="color" className={cx(inputCls, "p-1")} value={f.color || "#7c3aed"} onChange={(e) => setF({ ...f, color: e.target.value })} /></Field>
          <Field label="Order"><input type="number" className={inputCls} value={f.sortOrder ?? 0} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} /></Field>
        </div>
        <div className="sm:col-span-2"><Field label="Description"><textarea className={textareaCls} value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field></div>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#1e1b4b]">Limits</p>
          <Button size="sm" variant="secondary" onClick={() => setF({ ...f, limitDefs: [...defs, { key: "", label: "", type: "number" }] })}><Plus className="h-3.5 w-3.5" />Add limit</Button>
        </div>
        {!defs.length && <p className="text-sm text-[#64748b]">No limits: plans simply include the feature or not.</p>}
        <div className="space-y-2">
          {defs.map((d, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-[#ede9fe] p-3 sm:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.9fr_auto]">
              <input className={inputCls} placeholder="Label (e.g. Staff users)" value={d.label} onChange={(e) => setDef(i, { label: e.target.value })} onBlur={() => !d.key && d.label && setDef(i, { key: keyify(d.label) })} />
              <input className={inputCls} placeholder="key" value={d.key} onChange={(e) => setDef(i, { key: keyify(e.target.value) })} />
              <select className={inputCls} value={d.type} onChange={(e) => setDef(i, { type: e.target.value as LimitDef["type"], period: e.target.value === "boolean" ? undefined : d.period })}>
                <option value="number">Number</option><option value="boolean">Yes / no</option>
              </select>
              <input className={inputCls} placeholder="unit" value={d.unit ?? ""} onChange={(e) => setDef(i, { unit: e.target.value })} disabled={d.type === "boolean"} />
              <select className={inputCls} value={d.period ?? ""} onChange={(e) => setDef(i, { period: (e.target.value || undefined) as LimitDef["period"] })} disabled={d.type === "boolean"}>
                <option value="">No reset</option><option value="MONTH">Resets monthly</option>
              </select>
              <Button size="sm" variant="ghost" onClick={() => setF({ ...f, limitDefs: defs.filter((_, j) => j !== i) })} title="Remove limit"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Toggle checked={f.isActive !== false} onChange={(v) => setF({ ...f, isActive: v })} label="Active" hint="Inactive features are hidden from plans and never block anyone." />
        <Toggle checked={Boolean(f.enforced)} onChange={(v) => setF({ ...f, enforced: v })} label="Block without a plan" hint="Off = monitor only: denials are logged, nothing is blocked." />
      </div>
      {err && <div className="mt-4"><Notice tone="red">{err}</Notice></div>}
    </Modal>
  );
}

// ─── cycles ─────────────────────────────────────────────────────────────────

export function CyclesSection() {
  const { data, isLoading } = useSubsCyclesQuery();
  const [editing, setEditing] = useState<Partial<SubCycle> | null>(null);
  const cycles = data?.data ?? [];
  return (
    <Card title="Billing cycles" action={<Button size="sm" onClick={() => setEditing({ isActive: true, months: 1 })}><Plus className="h-4 w-4" />New cycle</Button>}>
      <p className="mb-4 text-sm text-[#64748b]">Monthly, half-yearly, yearly or any custom length in months. Each plan sets its own price per cycle. Changing a cycle&apos;s length only affects future purchases.</p>
      {isLoading ? <Skeleton /> : !cycles.length ? <EmptyState icon={<Repeat className="h-5 w-5" />} title="No billing cycles yet" body="Add Monthly (1 month), Half-yearly (6) and Yearly (12) to start." /> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cycles.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-[#ede9fe] bg-white p-4">
              <div>
                <p className="font-semibold text-[#1e1b4b]">{c.name}</p>
                <p className="text-xs text-[#64748b]">{c.months} month{c.months === 1 ? "" : "s"} · <code>{c.key}</code></p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={c.isActive ? "green" : "slate"}>{c.isActive ? "Active" : "Off"}</Badge>
                <Button size="sm" variant="ghost" onClick={() => setEditing(c)}><Pencil className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && <CycleModal cycle={editing} onClose={() => setEditing(null)} />}
    </Card>
  );
}

function CycleModal({ cycle, onClose }: { cycle: Partial<SubCycle>; onClose: () => void }) {
  const [save, { isLoading }] = useSubsSaveCycleMutation();
  const [c, setC] = useState(cycle);
  const [err, setErr] = useState<string | null>(null);
  const isNew = !cycle.id;
  const submit = async () => {
    setErr(null);
    try {
      const body = { name: c.name, months: Number(c.months), sortOrder: Number(c.sortOrder ?? 0), isActive: c.isActive !== false };
      await save(isNew ? { ...body, key: c.key } : { ...body, id: cycle.id }).unwrap();
      onClose();
    } catch (e) {
      setErr(apiError(e));
    }
  };
  return (
    <Modal open title={isNew ? "New billing cycle" : `Edit ${cycle.name}`} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={isLoading}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name"><input className={inputCls} value={c.name ?? ""} onChange={(e) => setC({ ...c, name: e.target.value })} onBlur={() => isNew && !c.key && c.name && setC((x) => ({ ...x, key: keyify(x.name ?? "") }))} placeholder="Half-yearly" /></Field>
        <Field label="Key"><input className={inputCls} value={c.key ?? ""} disabled={!isNew} onChange={(e) => setC({ ...c, key: keyify(e.target.value) })} /></Field>
        <Field label="Length (months)"><input type="number" min={1} max={120} className={inputCls} value={c.months ?? 1} onChange={(e) => setC({ ...c, months: Number(e.target.value) })} /></Field>
        <Field label="Order"><input type="number" className={inputCls} value={c.sortOrder ?? 0} onChange={(e) => setC({ ...c, sortOrder: Number(e.target.value) })} /></Field>
      </div>
      <div className="mt-4"><Toggle checked={c.isActive !== false} onChange={(v) => setC({ ...c, isActive: v })} label="Active" hint="Inactive cycles can't be bought." /></div>
      {err && <div className="mt-4"><Notice tone="red">{err}</Notice></div>}
    </Modal>
  );
}

// ─── plans ──────────────────────────────────────────────────────────────────

export function PlansSection() {
  const [status, setStatus] = useState<string>("");
  const { data, isLoading } = useSubsPlansQuery(status ? { status } : undefined);
  const [setPlanStatus] = useSubsPlanStatusMutation();
  const [duplicate] = useSubsDuplicatePlanMutation();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [msg, setMsg] = useState<{ tone: "green" | "red"; text: string } | null>(null);
  const plans = data?.data ?? [];
  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setMsg(null);
    try { await fn(); setMsg({ tone: "green", text: ok }); } catch (e) { setMsg({ tone: "red", text: apiError(e) }); }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm">
          {[["", "All"], ["PUBLISHED", "Published"], ["DRAFT", "Draft"], ["ARCHIVED", "Archived"]].map(([k, l]) => (
            <button key={k} onClick={() => setStatus(k)} className={cx("rounded-lg px-3 py-1.5 text-sm font-medium", status === k ? "bg-[#ede9fe] text-[#5b21b6]" : "text-[#64748b] hover:bg-[#f5f3ff]")}>{l}</button>
          ))}
        </div>
        <Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" />New plan</Button>
      </div>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {isLoading ? <Skeleton rows={4} /> : !plans.length ? (
        <EmptyState icon={<Layers className="h-5 w-5" />} title="No plans here" body="Create a plan, choose its features and limits, set a price for each billing cycle, then publish it." action={<Button onClick={() => setEditing("new")}>Create a plan</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {plans.map((p) => {
            const active = (p.prices ?? []).filter((x) => x.isActive && x.cycle?.isActive).sort((a, b) => (a.cycle?.months ?? 0) - (b.cycle?.months ?? 0));
            const feats = (p.features ?? []).filter((f) => f.enabled && f.feature?.isActive);
            return (
              <article key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-[#e6e3ff] bg-white shadow-[0_6px_24px_rgba(79,70,229,0.07)]">
                <div className="h-1.5" style={{ background: p.color || "linear-gradient(90deg,#4f46e5,#9333ea)" }} />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="flex items-center gap-1.5 text-lg font-bold text-[#1e1b4b]">{p.name}{p.isPopular && <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-label="Popular" />}</h3>
                      <p className="text-xs text-[#64748b]">/{p.slug} · {p._count?.subscribers ?? 0} subscriber{p._count?.subscribers === 1 ? "" : "s"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge tone={STATE_TONE[p.status]}>{p.status.toLowerCase()}</Badge>
                      {p.visibility === "HIDDEN" && <Badge tone="slate"><EyeOff className="h-3 w-3" />hidden</Badge>}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {active.length ? active.map((x) => (
                      <p key={x.id} className="text-sm text-[#334155]"><b>{taka(x.promoPrice ?? x.price)}</b> {perCycle(x.cycle?.months ?? 1)}{x.promoPrice && <s className="ml-1 text-xs text-[#94a3b8]">{taka(x.price)}</s>}{x.discountPercent && <span className="ml-1 text-xs text-emerald-600">−{Number(x.discountPercent)}%</span>}</p>
                    )) : <p className="text-sm text-amber-700">No active price yet</p>}
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs text-[#64748b]">{feats.length ? feats.map((f) => f.feature?.name).join(" · ") : "No features"}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#f5f3ff] pt-3">
                    <Button size="sm" variant="secondary" onClick={() => setEditing(p.id)}><Pencil className="h-3.5 w-3.5" />Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => act(() => duplicate(p.id).unwrap(), `Copied ${p.name} as a draft.`)}><Copy className="h-3.5 w-3.5" />Duplicate</Button>
                    {p.status !== "PUBLISHED" && p.status !== "ARCHIVED" && <Button size="sm" variant="ghost" onClick={() => act(() => setPlanStatus({ id: p.id, status: "PUBLISHED" }).unwrap(), `${p.name} is live.`)}><Send className="h-3.5 w-3.5" />Publish</Button>}
                    {p.status === "PUBLISHED" && <Button size="sm" variant="ghost" onClick={() => act(() => setPlanStatus({ id: p.id, status: "DRAFT" }).unwrap(), `${p.name} unpublished. Current subscribers keep it until it ends.`)}><Undo2 className="h-3.5 w-3.5" />Unpublish</Button>}
                    {p.status !== "ARCHIVED" ? <Button size="sm" variant="ghost" onClick={() => act(() => setPlanStatus({ id: p.id, status: "ARCHIVED" }).unwrap(), `${p.name} archived. Current subscribers keep it until it ends.`)}><Archive className="h-3.5 w-3.5" />Archive</Button>
                      : <Button size="sm" variant="ghost" onClick={() => act(() => setPlanStatus({ id: p.id, status: "DRAFT" }).unwrap(), `${p.name} restored as a draft.`)}><Undo2 className="h-3.5 w-3.5" />Restore</Button>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {editing && <PlanEditor id={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

type PriceForm = { cycleId: string; price: string; promoPrice: string; discountPercent: string; isActive: boolean };

function PlanEditor({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [planId, setPlanId] = useState<string | null>(id);
  const { data: planRes } = useSubsPlanQuery(planId!, { skip: !planId });
  const { data: featRes } = useSubsFeaturesQuery();
  const { data: cycleRes } = useSubsCyclesQuery();
  const [savePlan, { isLoading: savingPlan }] = useSubsSavePlanMutation();
  const [saveFeatures, { isLoading: savingFeatures }] = useSubsPlanFeaturesMutation();
  const [savePrices, { isLoading: savingPrices }] = useSubsPlanPricesMutation();
  const [tab, setTab] = useState<"details" | "features" | "prices">("details");
  const [details, setDetails] = useState<Partial<SubPackage>>({ visibility: "PUBLIC", displayOrder: 0, isPopular: false });
  const [assign, setAssign] = useState<Record<string, { enabled: boolean; config: LimitConfig }>>({});
  const [prices, setPrices] = useState<Record<string, PriceForm>>({});
  const [msg, setMsg] = useState<{ tone: "green" | "red"; text: string } | null>(null);
  const plan = planRes?.data;
  const features = useMemo(() => (featRes?.data ?? []).filter((f) => f.isActive), [featRes]);
  const cycles = cycleRes?.data ?? [];

  useEffect(() => {
    if (!plan) return;
    setDetails({ name: plan.name, slug: plan.slug, description: plan.description, icon: plan.icon, color: plan.color, displayOrder: plan.displayOrder, visibility: plan.visibility, isPopular: plan.isPopular, trialDays: plan.trialDays });
    setAssign(Object.fromEntries((plan.features ?? []).map((f) => [f.featureId, { enabled: f.enabled, config: f.config ?? {} }])));
    setPrices(Object.fromEntries((plan.prices ?? []).map((p) => [p.cycleId, { cycleId: p.cycleId, price: String(p.price), promoPrice: p.promoPrice ? String(p.promoPrice) : "", discountPercent: p.discountPercent ? String(Number(p.discountPercent)) : "", isActive: p.isActive }])));
  }, [plan]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setMsg(null);
    try { await fn(); setMsg({ tone: "green", text: ok }); } catch (e) { setMsg({ tone: "red", text: apiError(e) }); }
  };
  const saveDetails = () => run(async () => {
    const body = { ...details, trialDays: details.trialDays ? Number(details.trialDays) : null, displayOrder: Number(details.displayOrder ?? 0), color: details.color || null };
    const res = await savePlan(planId ? { ...body, id: planId } : body).unwrap();
    if (!planId) { setPlanId(res.data.id); setTab("features"); }
  }, planId ? "Details saved." : "Draft created. Now choose its features.");
  const saveAssign = () => run(() => saveFeatures({ id: planId!, features: Object.entries(assign).filter(([, a]) => a.enabled).map(([featureId, a]) => ({ featureId, enabled: true, config: a.config })) }).unwrap(), "Features and limits saved.");
  const savePriceRows = () => run(() => savePrices({
    id: planId!,
    prices: Object.values(prices).filter((p) => p.price !== "").map((p) => ({ cycleId: p.cycleId, price: p.price, promoPrice: p.promoPrice || null, discountPercent: p.discountPercent || null, isActive: p.isActive })),
  }).unwrap(), "Prices saved.");

  return (
    <Modal open wide title={planId ? `Edit plan${plan ? `: ${plan.name}` : ""}` : "New plan"} onClose={onClose}>
      <div className="mb-4 flex gap-1 rounded-xl bg-[#f5f3ff] p-1">
        {(["details", "features", "prices"] as const).map((t) => (
          <button key={t} disabled={!planId && t !== "details"} onClick={() => setTab(t)} className={cx("flex-1 rounded-lg px-3 py-1.5 text-sm font-medium capitalize disabled:opacity-40", tab === t ? "bg-white text-[#5b21b6] shadow-sm" : "text-[#64748b]")}>{t === "features" ? "Features & limits" : t}</button>
        ))}
      </div>
      {tab === "details" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Plan name"><input className={inputCls} value={details.name ?? ""} onChange={(e) => setDetails({ ...details, name: e.target.value, ...(planId ? {} : { slug: slugify(e.target.value) }) })} /></Field>
            <Field label="Slug" hint="Lowercase letters, digits and dashes."><input className={inputCls} value={details.slug ?? ""} onChange={(e) => setDetails({ ...details, slug: slugify(e.target.value) })} /></Field>
            <div className="sm:col-span-2"><Field label="Description"><textarea className={textareaCls} value={details.description ?? ""} onChange={(e) => setDetails({ ...details, description: e.target.value })} /></Field></div>
            <Field label="Badge colour"><input type="color" className={cx(inputCls, "p-1")} value={details.color || "#7c3aed"} onChange={(e) => setDetails({ ...details, color: e.target.value })} /></Field>
            <Field label="Display order"><input type="number" className={inputCls} value={details.displayOrder ?? 0} onChange={(e) => setDetails({ ...details, displayOrder: Number(e.target.value) })} /></Field>
            <Field label="Icon name" hint="Optional (e.g. rocket, crown)."><input className={inputCls} value={details.icon ?? ""} onChange={(e) => setDetails({ ...details, icon: e.target.value })} /></Field>
            <Field label="Trial days" hint="Informational; trials are granted by admins."><input type="number" min={0} className={inputCls} value={details.trialDays ?? ""} onChange={(e) => setDetails({ ...details, trialDays: e.target.value ? Number(e.target.value) : null })} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Toggle checked={Boolean(details.isPopular)} onChange={(v) => setDetails({ ...details, isPopular: v })} label="Mark as popular" hint="Highlighted on the vendor pricing page." />
            <Toggle checked={details.visibility === "HIDDEN"} onChange={(v) => setDetails({ ...details, visibility: v ? "HIDDEN" : "PUBLIC" })} label="Hidden plan" hint="Only vendors you send a special offer for it can see it." />
          </div>
          <div className="flex justify-end"><Button onClick={saveDetails} loading={savingPlan}>{planId ? "Save details" : "Create draft"}</Button></div>
        </div>
      )}
      {tab === "features" && (
        <div className="space-y-3">
          {!features.length && <EmptyState title="No active features" body="Create features under Feature Management first." />}
          {features.map((f) => {
            const a = assign[f.id] ?? { enabled: false, config: {} };
            const set = (patch: Partial<typeof a>) => setAssign({ ...assign, [f.id]: { ...a, ...patch } });
            return (
              <div key={f.id} className={cx("rounded-xl border p-3 transition", a.enabled ? "border-[#c4b5fd] bg-[#faf9ff]" : "border-[#ede9fe]")}>
                <Toggle checked={a.enabled} onChange={(v) => set({ enabled: v })} label={f.name} hint={f.description ?? undefined} />
                {a.enabled && f.limitDefs.length > 0 && (
                  <div className="mt-3 grid gap-3 pl-14 sm:grid-cols-2">
                    {f.limitDefs.map((d) => {
                      const v = d.key in a.config ? a.config[d.key] : null;
                      return d.type === "number" ? (
                        <Field key={d.key} label={`${d.label}${d.period === "MONTH" ? " / month" : ""}`} hint={v === null ? "Unlimited" : limitText("number", v as number, d.unit, d.period)}>
                          <div className="flex gap-2">
                            <input type="number" min={0} className={inputCls} disabled={v === null} value={v === null ? "" : String(v)} onChange={(e) => set({ config: { ...a.config, [d.key]: e.target.value === "" ? 0 : Number(e.target.value) } })} />
                            <Button size="sm" variant={v === null ? "primary" : "secondary"} className="h-10 shrink-0" onClick={() => set({ config: { ...a.config, [d.key]: v === null ? 0 : null } })}>∞</Button>
                          </div>
                        </Field>
                      ) : (
                        <Toggle key={d.key} checked={v !== false} onChange={(on) => set({ config: { ...a.config, [d.key]: on } })} label={d.label} />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          <div className="flex justify-end"><Button onClick={saveAssign} loading={savingFeatures}>Save features</Button></div>
        </div>
      )}
      {tab === "prices" && (
        <div className="space-y-3">
          {!cycles.length && <EmptyState title="No billing cycles" body="Create cycles under Billing Cycle Management first." />}
          {cycles.map((c) => {
            const p = prices[c.id] ?? { cycleId: c.id, price: "", promoPrice: "", discountPercent: "", isActive: true };
            const set = (patch: Partial<PriceForm>) => setPrices({ ...prices, [c.id]: { ...p, ...patch } });
            return (
              <div key={c.id} className="rounded-xl border border-[#ede9fe] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold text-[#1e1b4b]">{c.name} <span className="text-xs font-normal text-[#64748b]">({c.months} mo{!c.isActive && ", cycle off"})</span></p>
                  <Toggle checked={p.isActive} onChange={(v) => set({ isActive: v })} label="Sell" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Price (৳)"><input inputMode="decimal" className={inputCls} value={p.price} onChange={(e) => set({ price: e.target.value })} placeholder="Leave empty to skip" /></Field>
                  <Field label="Promo price (৳)"><input inputMode="decimal" className={inputCls} value={p.promoPrice} disabled={!!p.discountPercent} onChange={(e) => set({ promoPrice: e.target.value })} /></Field>
                  <Field label="or Discount %"><input inputMode="decimal" className={inputCls} value={p.discountPercent} disabled={!!p.promoPrice} onChange={(e) => set({ discountPercent: e.target.value })} /></Field>
                </div>
              </div>
            );
          })}
          <p className="text-xs text-[#64748b]">Cycles you leave out are switched off for this plan (nothing is deleted). Vendors with a special offer see their own price on top of these.</p>
          <div className="flex justify-end"><Button onClick={savePriceRows} loading={savingPrices}>Save prices</Button></div>
        </div>
      )}
      {msg && <div className="mt-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      {plan && plan.status !== "PUBLISHED" && <p className="mt-3 text-xs text-[#64748b]"><Eye className="mr-1 inline h-3.5 w-3.5" />This plan is a {plan.status.toLowerCase()}; publish it from the plan list when it&apos;s ready.</p>}
    </Modal>
  );
}
