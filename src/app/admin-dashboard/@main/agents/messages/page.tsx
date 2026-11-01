"use client";

// Agent messages (P10) — FinixMart staff's view of agent conversations, shown
// in the EXISTING chat UI (UnifiedChat / ChatBox, unchanged). Agent↔staff
// chats are a shared inbox (read + reply); agent↔vendor chats are read-only
// moderation and every read is audited by the backend. Visible only while
// NEXT_PUBLIC_AGENT_CHAT_ENABLED is "true" (and the backend flag is on).

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import type { ChatConversationParticipant } from "@/features/chatApi";
import { apiErrorMessage, useListAgentChatsQuery, type AgentChatRow } from "@/features/agentAdminApi";
import UnifiedChat from "@/components/chatbox/UnifiedChat";
import { AgentAdminHeader, Empty, Panel, Pill, fmtDateTime } from "@/components/agent-admin/AgentAdminUI";
import { AGENT_CHAT_UI_ENABLED, AgentChatNotice } from "@/lib/agent-chat-ui";

type Tab = "AGENT_SUPPORT" | "AGENT_VENDOR";

/** Reshape a staff list row into what the existing ChatBox expects (no staff participant row: shared inbox). */
function toConversation(row: AgentChatRow): ChatConversationParticipant {
  const other = row.agent;
  return {
    id: row.id,
    unreadCount: 0,
    isPinned: false,
    lastReadMessageId: null,
    userId: null,
    vendorId: null,
    employeeId: null,
    deliveryPersonId: null,
    otherParticipant: other ? { id: other.id, participantType: "AGENT" as never, displayName: other.displayName ?? "Agent", displayImage: other.displayImage } : null,
    conversation: {
      id: row.id,
      type: row.type as never,
      status: row.status as never,
      title: row.type === "AGENT_VENDOR" ? `${row.agent?.displayName ?? "Agent"} ↔ ${row.vendor?.displayName ?? "Vendor"}` : null,
      lastMessageAt: row.lastMessageAt,
      lastMessageText: row.lastMessageText,
      lastMessageType: null,
      lastSenderId: null,
      lastSenderType: null,
      priority: 0,
    },
  } as ChatConversationParticipant;
}

export default function AgentMessagesPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const [tab, setTab] = useState<Tab>("AGENT_SUPPORT");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading, isError, error } = useListAgentChatsQuery({ type: tab, limit: 50 }, { skip: !AGENT_CHAT_UI_ENABLED, pollingInterval: 15_000 });
  const rows = data?.items ?? [];
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  if (!AGENT_CHAT_UI_ENABLED) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
        <AgentAdminHeader title="Agent messages" subtitle="Agent messaging is switched off." />
        <Panel>
          <Empty title="Agent messaging is off" text="Set NEXT_PUBLIC_AGENT_CHAT_ENABLED=true (site) and AGENT_CHAT_ENABLED=1 (backend) to enable it." />
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
      <AgentAdminHeader title="Agent messages" subtitle="Conversations agents have with FinixMart (shared staff inbox) and, read-only, with their vendors." />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Panel>
          <div className="flex gap-1 border-b border-slate-100 p-2" role="tablist">
            {(["AGENT_SUPPORT", "AGENT_VENDOR"] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => {
                  setTab(t);
                  setSelectedId(null);
                }}
                className={`flex-1 rounded-md py-2 text-xs font-semibold ${tab === t ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
              >
                {t === "AGENT_SUPPORT" ? "Agents ↔ FinixMart" : "Agents ↔ vendors (read-only)"}
              </button>
            ))}
          </div>
          {isError ? (
            <p className="p-4 text-sm text-red-600">{apiErrorMessage(error)}</p>
          ) : isLoading ? (
            <p className="p-4 text-sm text-slate-400">Loading…</p>
          ) : rows.length === 0 ? (
            <Empty title="No conversations" />
          ) : (
            <ul className="max-h-[65vh] divide-y divide-slate-100 overflow-y-auto">
              {rows.map((r) => (
                <li key={r.id}>
                  <button onClick={() => setSelectedId(r.id)} className={`w-full px-4 py-3 text-left hover:bg-slate-50 ${selectedId === r.id ? "bg-blue-50" : ""}`}>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-800">
                        {r.agent?.displayName ?? "Agent"}
                        {r.type === "AGENT_VENDOR" && <span className="font-normal text-slate-500"> ↔ {r.vendor?.displayName ?? "Vendor"}</span>}
                      </span>
                      {r.awaitingStaff && <Pill tone="amber">reply</Pill>}
                    </span>
                    <span className="block truncate text-xs text-slate-500">{r.lastMessageText ?? "No messages yet"}</span>
                    <span className="block text-[11px] text-slate-400">{fmtDateTime(r.lastMessageAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="flex min-h-[60vh] flex-col overflow-hidden">
          {selected && accessToken ? (
            <>
              <AgentChatNotice readOnlyText={selected.staffMayWrite ? null : "Read-only: staff can't write in agent↔vendor conversations. Every view is logged."} />
              <div className="min-h-0 flex-1">
                <UnifiedChat key={selected.id} layout="fullscreen" role={user?.role === "EMPLOYEE" ? "EMPLOYEE" : "ADMIN"} accessToken={accessToken} initialConversation={toConversation(selected)} />
              </div>
            </>
          ) : (
            <Empty title="Select a conversation" text="Agents' messages to FinixMart appear in the first tab." />
          )}
        </Panel>
      </div>
    </div>
  );
}
