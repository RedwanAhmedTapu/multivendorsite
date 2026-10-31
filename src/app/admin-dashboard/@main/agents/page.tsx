"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Plus, Search, UserPlus } from "lucide-react";
import {
  apiErrorMessage,
  apiFieldErrors,
  useAgentStatusActionMutation,
  useCreateAdminAgentMutation,
  useListAdminAgentsQuery,
  useListAgentLevelsQuery,
  type AgentStatus,
} from "@/features/agentAdminApi";
import { AgentAdminHeader, Btn, Empty, FieldRow, Modal, Panel, Pill, STATUS_TONE, fmtDate, fmtDateTime, inputCls, tdCls, thCls } from "@/components/agent-admin/AgentAdminUI";

const STATUSES: Array<AgentStatus | ""> = ["", "PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED"];
const STATUS_LABEL: Record<string, string> = { "": "All", PENDING: "Pending", ACTIVE: "Active", SUSPENDED: "Suspended", DEACTIVATED: "Deactivated" };

export default function AdminAgentsPage() {
  const [status, setStatus] = useState<AgentStatus | "">("");
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => setPage(1), [status, dq]);

  const { data, isLoading, isFetching } = useListAdminAgentsQuery({ status, q: dq, page, limit: 20 });
  const { data: levels } = useListAgentLevelsQuery();
  const [statusAction] = useAgentStatusActionMutation();
  const [createAgent, { isLoading: creating }] = useCreateAdminAgentMutation();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", phone: "", levelId: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const total = data ? Object.values(data.statusCounts).reduce((a, b) => a + b, 0) : 0;

  async function approve(id: string, name: string) {
    try {
      await statusAction({ id, action: "approve" }).unwrap();
      toast.success(`${name} approved`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not approve"));
    }
  }

  async function submit() {
    setErrors({});
    try {
      const res = await createAgent({
        name: draft.name.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim() || undefined,
        levelId: draft.levelId || null,
      }).unwrap();
      toast.success(res.inviteEmailSent ? `Agent created — invite sent to ${res.agent.email}` : "Agent created, but the invite email could not be sent. Ask them to use “Forgot password”.");
      setOpen(false);
      setDraft({ name: "", email: "", phone: "", levelId: "" });
    } catch (err) {
      setErrors(apiFieldErrors(err));
      toast.error(apiErrorMessage(err, "Could not create the agent"));
    }
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
      <AgentAdminHeader
        title="Agents"
        subtitle="Field agents who bring vendors to FinixMart. Approve registrations, manage status and vendor assignments."
        actions={
          <Btn
            onClick={() => {
              setErrors({});
              setOpen(true);
            }}
          >
            <UserPlus className="size-4" /> Add agent
          </Btn>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => {
          const count = s === "" ? total : (data?.statusCounts[s] ?? 0);
          return (
            <button
              key={s || "all"}
              onClick={() => setStatus(s)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${status === s ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {STATUS_LABEL[s]}
              <span className={`rounded-full px-1.5 text-[11px] ${status === s ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{count}</span>
            </button>
          );
        })}
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls(false)} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, phone or code" aria-label="Search agents" />
        </div>
      </div>

      <Panel>
        {isLoading ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : !data?.items.length ? (
          <Empty title="No agents found" text={dq || status ? "Try a different filter." : "Agents appear here once they register or you add one."} />
        ) : (
          <div className={`overflow-x-auto ${isFetching ? "opacity-70" : ""}`}>
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th className={thCls}>Agent</th>
                  <th className={thCls}>Code</th>
                  <th className={thCls}>Phone</th>
                  <th className={thCls}>Level</th>
                  <th className={thCls}>Active vendors</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Joined</th>
                  <th className={thCls}>Last login</th>
                  <th className={thCls} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className={tdCls}>
                      <Link href={`/admin-dashboard/agents/${a.id}`} className="font-semibold text-slate-800 hover:text-blue-700">
                        {a.name}
                      </Link>
                      <p className="text-xs text-slate-400">{a.email}</p>
                    </td>
                    <td className={`${tdCls} font-mono text-xs`}>{a.agentCode}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>{a.phone ?? "—"}</td>
                    <td className={tdCls}>{a.level?.name ?? <span className="text-slate-400">None</span>}</td>
                    <td className={tdCls}>{a.activeVendorCount ?? 0}</td>
                    <td className={tdCls}>
                      <Pill tone={STATUS_TONE[a.status]}>{a.status}</Pill>
                    </td>
                    <td className={`${tdCls} whitespace-nowrap`}>{fmtDate(a.createdAt)}</td>
                    <td className={`${tdCls} whitespace-nowrap text-xs text-slate-500`}>{a.lastLoginAt ? fmtDateTime(a.lastLoginAt) : "Never"}</td>
                    <td className={`${tdCls} whitespace-nowrap text-right`}>
                      {a.status === "PENDING" && (
                        <Btn variant="success" onClick={() => approve(a.id, a.name)}>
                          <Check className="size-4" /> Approve
                        </Btn>
                      )}
                      <Link href={`/admin-dashboard/agents/${a.id}`} className="ml-2 text-sm font-semibold text-blue-700 hover:underline">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              <span>{data.total} agent(s)</span>
              <span className="flex gap-2">
                <Btn variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Btn>
                <Btn variant="outline" disabled={page * data.limit >= data.total} onClick={() => setPage(page + 1)}>
                  Next
                </Btn>
              </span>
            </div>
          </div>
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add agent"
        footer={
          <>
            <Btn variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Btn>
            <Btn onClick={submit} loading={creating}>
              <Plus className="size-4" /> Create and send invite
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">The agent is created as active and receives an email link to set their own password. No password is set or shown here.</p>
          <FieldRow label="Full name" error={errors.name}>
            <input className={inputCls(!!errors.name)} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </FieldRow>
          <FieldRow label="Email" error={errors.email}>
            <input type="email" className={inputCls(!!errors.email)} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          </FieldRow>
          <FieldRow label="Phone (optional)" error={errors.phone} hint="Bangladesh mobile, e.g. 01712345678">
            <input className={inputCls(!!errors.phone)} inputMode="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          </FieldRow>
          <FieldRow label="Level (optional)" error={errors.levelId}>
            <select className={inputCls(!!errors.levelId)} value={draft.levelId} onChange={(e) => setDraft({ ...draft, levelId: e.target.value })}>
              <option value="">No level</option>
              {levels
                ?.filter((l) => l.isActive)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} (rank {l.rank})
                  </option>
                ))}
            </select>
          </FieldRow>
        </div>
      </Modal>
    </div>
  );
}
