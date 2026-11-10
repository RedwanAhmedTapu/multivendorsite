"use client";

// "New chat" picker for the admin Live Chat page. Vendors and customers need
// customerSupport; agents need agentManagement (the server enforces both).
// Starting always opens or reuses the existing conversation.

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/agent-admin/AgentAdminUI";
import { useStaffLookupQuery, useStaffStartMutation, type StaffLookupKind } from "@/features/adminInboxApi";
import { apiErrorMessage, useLookupAgentsQuery, useOpenAgentChatMutation } from "@/features/agentAdminApi";
import type { SupportQueueItem } from "@/features/chatApi";
import { InboxAvatar, KindBadge, type InboxKind } from "./InboxBits";

type Row = { id: string; name: string; image: string | null; detail: string | null };

export function NewChatDialog({
  open,
  onClose,
  canSupport,
  canAgents,
  onStartedSupport,
  onStartedAgent,
}: {
  open: boolean;
  onClose: () => void;
  canSupport: boolean;
  canAgents: boolean;
  onStartedSupport: (item: SupportQueueItem) => void;
  onStartedAgent: (conversationId: string, agent: { id: string; name: string }) => void;
}) {
  const kinds: InboxKind[] = [...(canSupport ? (["VENDOR", "CUSTOMER"] as const) : []), ...(canAgents ? (["AGENT"] as const) : [])];
  const [kind, setKind] = useState<InboxKind>(kinds[0] ?? "VENDOR");
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  const isAgent = kind === "AGENT";
  const support = useStaffLookupQuery({ kind: kind as StaffLookupKind, q }, { skip: !open || isAgent || !canSupport || (kind === "CUSTOMER" && q.length < 2) });
  const agents = useLookupAgentsQuery(q, { skip: !open || !isAgent || !canAgents });
  const [startSupport, startingSupport] = useStaffStartMutation();
  const [openAgent, openingAgent] = useOpenAgentChatMutation();
  const busy = startingSupport.isLoading || openingAgent.isLoading;
  const loading = isAgent ? agents.isFetching : support.isFetching;

  const rows: Row[] = isAgent
    ? (agents.data ?? []).filter((a) => a.status === "ACTIVE").map((a) => ({ id: a.id, name: a.name, image: null, detail: a.agentCode }))
    : kind === "CUSTOMER" && q.length < 2
      ? []
      : (support.data?.data ?? []);

  async function pick(row: Row) {
    try {
      if (isAgent) {
        const c = await openAgent(row.id).unwrap();
        onStartedAgent(c.id, { id: row.id, name: row.name });
      } else {
        const res = await startSupport({ kind: kind as StaffLookupKind, id: row.id }).unwrap();
        onStartedSupport(res.data);
      }
      setInput("");
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, (err as { data?: { error?: string } })?.data?.error ?? "Could not open the conversation"));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New chat">
      <div className="space-y-3">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Who to chat with">
          {kinds.map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${kind === k ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {k === "VENDOR" ? "Vendor" : k === "CUSTOMER" ? "Customer" : "Agent"}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={kind === "CUSTOMER" ? "Search by name, e-mail or phone (2+ characters)" : kind === "VENDOR" ? "Search stores" : "Search agents"}
            aria-label="Search"
            className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
          {loading && rows.length === 0 && (
            <li className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
              <Loader2 className="size-4 animate-spin" /> Searching…
            </li>
          )}
          {!loading && rows.length === 0 && <li className="py-8 text-center text-xs text-slate-400">{kind === "CUSTOMER" && q.length < 2 ? "Type at least 2 characters to find a customer." : "No matches."}</li>}
          {rows.map((r) => (
            <li key={r.id}>
              <button disabled={busy} onClick={() => pick(r)} className="flex w-full items-center gap-3 px-1 py-2.5 text-left hover:bg-slate-50 disabled:opacity-60">
                <InboxAvatar name={r.name} image={r.image} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">{r.name}</span>
                  {r.detail && <span className="block truncate text-xs text-slate-400">{r.detail}</span>}
                </span>
                <KindBadge kind={kind} />
              </button>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-slate-400">If a conversation already exists, it opens instead of starting a new one.</p>
      </div>
    </Modal>
  );
}
