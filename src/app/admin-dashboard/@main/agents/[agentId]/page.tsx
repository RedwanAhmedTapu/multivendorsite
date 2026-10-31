"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Link2, Search, Store, Unlink } from "lucide-react";
import {
  apiErrorMessage,
  apiFieldErrors,
  useAgentStatusActionMutation,
  useAssignAgentVendorMutation,
  useEndAgentVendorLinkMutation,
  useGetAdminAgentQuery,
  useGetAgentAuditQuery,
  useListAgentLevelsQuery,
  useLookupAgentVendorsQuery,
  useUpdateAdminAgentMutation,
} from "@/features/agentAdminApi";
import { AgentAdminHeader, Btn, Empty, FieldRow, Modal, Panel, Pill, STATUS_TONE, fmtDate, fmtDateTime, inputCls, tdCls, thCls } from "@/components/agent-admin/AgentAdminUI";

type Action = "approve" | "suspend" | "reactivate" | "deactivate";
const ACTION_META: Record<Action, { label: string; needsReason: boolean; variant: "success" | "danger" | "outline"; text: string }> = {
  approve: { label: "Approve", needsReason: false, variant: "success", text: "The agent can sign in and will receive an approval email." },
  suspend: { label: "Suspend", needsReason: true, variant: "danger", text: "Signs the agent out everywhere and blocks sign-in until reactivated." },
  reactivate: { label: "Reactivate", needsReason: false, variant: "success", text: "The agent can sign in again." },
  deactivate: { label: "Deactivate", needsReason: true, variant: "danger", text: "Permanent: signs the agent out everywhere. A deactivated agent cannot be reactivated." },
};
const ALLOWED: Record<string, Action[]> = {
  PENDING: ["approve", "deactivate"],
  ACTIVE: ["suspend", "deactivate"],
  SUSPENDED: ["reactivate", "deactivate"],
  DEACTIVATED: [],
};

export default function AdminAgentDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data, isLoading, error } = useGetAdminAgentQuery(agentId, { skip: !agentId });
  const { data: levels } = useListAgentLevelsQuery();
  const { data: history } = useGetAgentAuditQuery({ entity: "AGENT", entityId: agentId, limit: 10 }, { skip: !agentId });
  const [update, { isLoading: saving }] = useUpdateAdminAgentMutation();
  const [statusAction, { isLoading: acting }] = useAgentStatusActionMutation();
  const [assign, { isLoading: assigning }] = useAssignAgentVendorMutation();
  const [endLink] = useEndAgentVendorLinkMutation();

  const [profile, setProfile] = useState({ name: "", phone: "", levelId: "" });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const [assignOpen, setAssignOpen] = useState(false);
  const [vq, setVq] = useState("");
  const [dvq, setDvq] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [transferAsk, setTransferAsk] = useState<{ vendorId: string; storeName: string; currentAgentName: string } | null>(null);
  const [showEnded, setShowEnded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDvq(vq.trim()), 300);
    return () => clearTimeout(t);
  }, [vq]);
  const vendors = useLookupAgentVendorsQuery(dvq, { skip: !assignOpen });

  useEffect(() => {
    if (data) setProfile({ name: data.agent.name, phone: data.agent.phone ?? "", levelId: data.agent.level?.id ?? "" });
  }, [data]);

  if (isLoading) return <p className="p-8 text-sm text-slate-400">Loading…</p>;
  if (error || !data) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6">
        <p className="text-sm text-red-600">{apiErrorMessage(error, "Agent not found")}</p>
        <Link href="/admin-dashboard/agents" className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline">
          Back to agents
        </Link>
      </div>
    );
  }

  const { agent, vendorLinks } = data;
  const openLinks = vendorLinks.filter((l) => !l.endedAt);
  const shownLinks = showEnded ? vendorLinks : openLinks;
  const dirty =
    profile.name.trim() !== agent.name || (profile.phone.trim() || null) !== (agent.phone ?? null) || (profile.levelId || null) !== (agent.level?.id ?? null);

  async function saveProfile() {
    const body: { name?: string; phone?: string | null; levelId?: string | null } = {};
    if (profile.name.trim() !== agent.name) body.name = profile.name.trim();
    if ((profile.phone.trim() || null) !== (agent.phone ?? null)) body.phone = profile.phone.trim() || null;
    if ((profile.levelId || null) !== (agent.level?.id ?? null)) body.levelId = profile.levelId || null;
    setProfileErrors({});
    try {
      await update({ id: agent.id, body }).unwrap();
      toast.success("Agent updated");
    } catch (err) {
      setProfileErrors(apiFieldErrors(err));
      toast.error(apiErrorMessage(err, "Could not update the agent"));
    }
  }

  async function runAction() {
    if (!action) return;
    const meta = ACTION_META[action];
    if (meta.needsReason && reason.trim().length < 3) {
      setReasonError("Give a reason (at least 3 characters)");
      return;
    }
    try {
      await statusAction({ id: agent.id, action, reason: reason.trim() || undefined }).unwrap();
      toast.success(`Agent ${action === "approve" ? "approved" : `${action}d`}`);
      setAction(null);
    } catch (err) {
      setReasonError(apiFieldErrors(err).reason ?? "");
      toast.error(apiErrorMessage(err));
    }
  }

  async function doAssign(vendorId: string, storeName: string, transfer = false) {
    try {
      await assign({ id: agent.id, vendorId, note: assignNote.trim() || undefined, transfer }).unwrap();
      toast.success(transfer ? `${storeName} transferred to ${agent.name}` : `${storeName} assigned`);
      setAssignOpen(false);
      setTransferAsk(null);
      setAssignNote("");
      setVq("");
    } catch (err) {
      const d = (err as { data?: { code?: string; details?: { currentAgentName?: string } } })?.data;
      if (d?.code === "VENDOR_LINKED_ELSEWHERE") {
        setTransferAsk({ vendorId, storeName, currentAgentName: d.details?.currentAgentName ?? "another agent" });
        return;
      }
      toast.error(apiErrorMessage(err, "Could not assign the vendor"));
    }
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
      <Link href="/admin-dashboard/agents" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> All agents
      </Link>
      <AgentAdminHeader
        title={agent.name}
        subtitle={`${agent.agentCode} · ${agent.email} · joined ${fmtDate(agent.createdAt)}`}
        actions={
          <>
            <Pill tone={STATUS_TONE[agent.status]}>{agent.status}</Pill>
            {ALLOWED[agent.status].map((a) => (
              <Btn
                key={a}
                variant={ACTION_META[a].variant}
                onClick={() => {
                  setReason("");
                  setReasonError("");
                  setAction(a);
                }}
              >
                {ACTION_META[a].label}
              </Btn>
            ))}
          </>
        }
      />

      {agent.statusReason && agent.status !== "ACTIVE" && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Status reason: <b>{agent.statusReason}</b>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Profile" subtitle="Email can't be changed here." className="lg:col-span-1">
          <div className="space-y-4 p-5">
            <FieldRow label="Full name" error={profileErrors.name}>
              <input className={inputCls(!!profileErrors.name)} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} disabled={agent.status === "DEACTIVATED"} />
            </FieldRow>
            <FieldRow label="Phone" error={profileErrors.phone}>
              <input className={inputCls(!!profileErrors.phone)} inputMode="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} disabled={agent.status === "DEACTIVATED"} />
            </FieldRow>
            <FieldRow label="Level" error={profileErrors.levelId} hint="Sets the level-based commission rate for new commissions.">
              <select className={inputCls(!!profileErrors.levelId)} value={profile.levelId} onChange={(e) => setProfile({ ...profile, levelId: e.target.value })} disabled={agent.status === "DEACTIVATED"}>
                <option value="">No level</option>
                {levels
                  ?.filter((l) => l.isActive || l.id === agent.level?.id)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} (rank {l.rank}){l.isActive ? "" : " — inactive"}
                    </option>
                  ))}
              </select>
            </FieldRow>
            <dl className="grid grid-cols-2 gap-2 text-xs text-slate-500">
              <dt>Referral code</dt>
              <dd className="font-mono text-slate-700">{agent.referralCode}</dd>
              <dt>Approved</dt>
              <dd className="text-slate-700">{fmtDate(agent.approvedAt)}</dd>
              <dt>Last login</dt>
              <dd className="text-slate-700">{agent.lastLoginAt ? fmtDateTime(agent.lastLoginAt) : "Never"}</dd>
            </dl>
            <div className="flex justify-end">
              <Btn onClick={saveProfile} disabled={!dirty} loading={saving}>
                Save changes
              </Btn>
            </div>
          </div>
        </Panel>

        <Panel
          title={`Vendors (${openLinks.length} active)`}
          subtitle="Commission is earned on a vendor's delivered orders while the link is open."
          className="lg:col-span-2"
          actions={
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <input type="checkbox" className="size-3.5 accent-blue-600" checked={showEnded} onChange={(e) => setShowEnded(e.target.checked)} /> Show ended
              </label>
              <Btn onClick={() => setAssignOpen(true)} disabled={agent.status !== "ACTIVE"} title={agent.status !== "ACTIVE" ? "Only active agents can get vendors" : undefined}>
                <Link2 className="size-4" /> Assign vendor
              </Btn>
            </div>
          }
        >
          {!shownLinks.length ? (
            <Empty title="No vendors linked" text={agent.status === "ACTIVE" ? "Assign a vendor, or the agent's referral sign-ups will appear here." : undefined} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50/60">
                  <tr>
                    <th className={thCls}>Vendor</th>
                    <th className={thCls}>Source</th>
                    <th className={thCls}>Since</th>
                    <th className={thCls}>Ended</th>
                    <th className={thCls}>Note</th>
                    <th className={thCls} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shownLinks.map((l) => (
                    <tr key={l.id}>
                      <td className={tdCls}>
                        <span className="inline-flex items-center gap-2 font-semibold">
                          <Store className="size-4 text-slate-400" /> {l.vendor.storeName}
                        </span>
                        <p className="text-xs text-slate-400">{l.vendor.status}</p>
                      </td>
                      <td className={tdCls}>
                        <Pill tone="violet">{l.source}</Pill>
                      </td>
                      <td className={`${tdCls} whitespace-nowrap`}>{fmtDate(l.startedAt)}</td>
                      <td className={`${tdCls} whitespace-nowrap`}>{l.endedAt ? fmtDate(l.endedAt) : "—"}</td>
                      <td className={`${tdCls} max-w-48 truncate text-xs text-slate-500`}>{l.note ?? ""}</td>
                      <td className={`${tdCls} text-right`}>
                        {!l.endedAt && (
                          <Btn
                            variant="ghost"
                            onClick={async () => {
                              if (!confirm(`End the link with ${l.vendor.storeName}? Orders created after now won't earn this agent commission.`)) return;
                              try {
                                await endLink({ linkId: l.id }).unwrap();
                                toast.success("Link ended");
                              } catch (err) {
                                toast.error(apiErrorMessage(err));
                              }
                            }}
                          >
                            <Unlink className="size-4 text-red-500" /> End
                          </Btn>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Recent changes" subtitle="Status, profile and level changes for this agent.">
          {!history?.items.length ? (
            <Empty title="No changes recorded" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {history.items.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                  <span>
                    <Pill tone="blue">{h.action}</Pill> <span className="ml-1 text-slate-600">by {h.actorName ?? h.actorUserId}</span>
                  </span>
                  <span className="text-xs text-slate-400">{fmtDateTime(h.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-slate-100 px-5 py-3 text-right">
            <Link href="/admin-dashboard/agents/audit" className="text-xs font-semibold text-blue-700 hover:underline">
              Full audit log
            </Link>
          </div>
        </Panel>
      </div>

      <Modal
        open={!!action}
        onClose={() => setAction(null)}
        title={action ? `${ACTION_META[action].label} ${agent.name}?` : ""}
        footer={
          <>
            <Btn variant="outline" onClick={() => setAction(null)}>
              Cancel
            </Btn>
            {action && (
              <Btn variant={ACTION_META[action].variant === "outline" ? "primary" : ACTION_META[action].variant} onClick={runAction} loading={acting}>
                {ACTION_META[action].label}
              </Btn>
            )}
          </>
        }
      >
        {action && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">{ACTION_META[action].text}</p>
            <FieldRow label={ACTION_META[action].needsReason ? "Reason (required)" : "Reason (optional)"} error={reasonError}>
              <textarea className={`${inputCls(!!reasonError)} h-20 py-2`} value={reason} onChange={(e) => setReason(e.target.value)} />
            </FieldRow>
          </div>
        )}
      </Modal>

      <Modal
        open={assignOpen}
        onClose={() => {
          setAssignOpen(false);
          setTransferAsk(null);
        }}
        title={`Assign a vendor to ${agent.name}`}
        footer={
          transferAsk ? (
            <>
              <Btn variant="outline" onClick={() => setTransferAsk(null)}>
                Back
              </Btn>
              <Btn variant="danger" onClick={() => doAssign(transferAsk.vendorId, transferAsk.storeName, true)} loading={assigning}>
                Transfer to {agent.name}
              </Btn>
            </>
          ) : undefined
        }
      >
        {transferAsk ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
            <b>{transferAsk.storeName}</b> is currently linked to <b>{transferAsk.currentAgentName}</b>. Transferring ends that link now; orders created from now on count for {agent.name}. Already-created commissions are not moved.
          </p>
        ) : (
          <div className="space-y-4">
            <FieldRow label="Note (optional)">
              <input className={inputCls(false)} value={assignNote} onChange={(e) => setAssignNote(e.target.value)} placeholder="e.g. Signed at the Dhanmondi meetup" />
            </FieldRow>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input className={`${inputCls(false)} pl-9`} value={vq} onChange={(e) => setVq(e.target.value)} placeholder="Search vendors by store name" autoFocus />
            </div>
            <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-100">
              {(vendors.data ?? []).map((v) => {
                const mine = v.currentAgent?.id === agent.id;
                return (
                  <li key={v.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{v.storeName}</p>
                      <p className="text-xs text-slate-400">
                        {v.status} · {v.currentAgent ? `Agent: ${v.currentAgent.name}` : "No agent"}
                      </p>
                    </div>
                    <Btn variant={v.currentAgent ? "outline" : "primary"} disabled={mine || assigning} onClick={() => doAssign(v.id, v.storeName)}>
                      {mine ? "Linked" : v.currentAgent ? "Transfer…" : "Assign"}
                    </Btn>
                  </li>
                );
              })}
              {vendors.data && vendors.data.length === 0 && <li className="px-3 py-4 text-xs text-slate-400">No vendors match.</li>}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}
