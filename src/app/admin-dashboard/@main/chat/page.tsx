"use client";

// Route: /admin-dashboard/chat — Live Chat, the one inbox for FinixMart staff.
//   Customers / Vendors: the support queue (ADMIN, or admin-side staff with customerSupport).
//   Agents: agent↔staff (shared inbox, reply) and agent↔vendor (read-only, each
//   view audited by the backend) for ADMIN or staff with agentManagement.
// The server enforces all of this; the permission checks here only shape the UI.
//
// Identity comes from /auth/me, never the login-time Redux user: its employeeId
// is null when an ADMIN logged in before their chat row existed, although the
// backend (authenticateUser) resolves that row on every request. An EMPLOYEE
// without a profile is still stopped here, and refused by the server.

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSelector, useStore } from "react-redux";
import { Eye, MessageSquare, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { RootState } from "@/store/store";
import {
  useAssignConversationMutation,
  useGetSupportQueueQuery,
  useUpdateConversationStatusMutation,
  type ChatConversationParticipant,
  type ConversationStatus,
  type SupportQueueItem,
} from "@/features/chatApi";
import { useListAgentChatsQuery, type AgentChatRow } from "@/features/agentAdminApi";
import { usePermissions } from "@/hooks/usePermissions";
import { socketService } from "@/services/socketService";
import { socketTokenRefresher } from "@/services/socketTokenRefresh";
import ChatBox from "@/components/chatbox/ChatBox";
import { AGENT_CHAT_UI_ENABLED } from "@/lib/agent-chat-ui";
import { NewChatDialog } from "@/components/admin-inbox/NewChatDialog";
import { InboxAvatar, InboxSkeleton, KindBadge, inboxTime, type InboxKind } from "@/components/admin-inbox/InboxBits";

/* ==================== TYPES ==================== */

type Tab = "ALL" | InboxKind;
type View = "UNASSIGNED" | "MINE" | "ALL";

type InboxItem = {
  id: string;
  kind: InboxKind;
  name: string;
  image: string | null;
  ownerId: string | null;
  preview: string | null;
  at: string | null;
  unread: number;
  readOnly: boolean;
  support: SupportQueueItem | null;
  agent: AgentChatRow | null;
};

/* ==================== CONSTANTS ==================== */

const VIEW_TABS: { key: View; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "UNASSIGNED", label: "Unassigned" },
  { key: "MINE", label: "Mine" },
];

const STATUS_COLORS: Record<ConversationStatus, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  PENDING: "bg-amber-100 text-amber-700",
  ASSIGNED: "bg-indigo-100 text-indigo-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-slate-100 text-slate-500",
  ARCHIVED: "bg-slate-100 text-slate-400",
};

const POLL_MS = 15_000;

/* ==================== HELPERS ==================== */

function fromSupport(item: SupportQueueItem): InboxItem {
  return {
    id: item.id,
    kind: item.type === "VENDOR_SUPPORT" ? "VENDOR" : "CUSTOMER",
    name: item.requester?.displayName ?? "Unknown",
    image: item.requester?.displayImage ?? null,
    ownerId: item.requester?.id ?? null,
    preview: item.lastMessageText,
    at: item.lastMessageAt,
    unread: item.supportParticipant?.unreadCount ?? 0,
    readOnly: false,
    support: item,
    agent: null,
  };
}

function fromAgent(row: AgentChatRow): InboxItem {
  const agentName = row.agent?.displayName ?? "Agent";
  return {
    id: row.id,
    kind: "AGENT",
    name: row.type === "AGENT_VENDOR" ? `${agentName} ↔ ${row.vendor?.displayName ?? "Vendor"}` : agentName,
    image: row.agent?.displayImage ?? null,
    ownerId: row.agent?.id ?? null,
    preview: row.lastMessageText,
    at: row.lastMessageAt,
    // Staff share one inbox with no per-person read state: "the agent is waiting for a reply".
    unread: row.awaitingStaff ? 1 : 0,
    readOnly: !row.staffMayWrite,
    support: null,
    agent: row,
  };
}

/** The participant-row shape ChatBox expects. Staff with no row of their own use the conversation id. */
function toConversation(item: InboxItem): ChatConversationParticipant {
  const sp = item.support?.supportParticipant ?? null;
  return {
    id: sp?.id ?? item.id,
    unreadCount: sp?.unreadCount ?? 0,
    isPinned: sp?.isPinned ?? false,
    lastReadMessageId: sp?.lastReadMessageId ?? null,
    userId: sp?.userId ?? null,
    vendorId: sp?.vendorId ?? null,
    employeeId: sp?.employeeId ?? null,
    deliveryPersonId: sp?.deliveryPersonId ?? null,
    otherParticipant: item.ownerId
      ? { id: item.ownerId, participantType: (item.support?.requester?.participantType ?? "AGENT") as never, displayName: item.name, displayImage: item.image }
      : null,
    conversation: {
      id: item.id,
      type: (item.support?.type ?? item.agent?.type) as never,
      status: (item.support?.status ?? item.agent?.status ?? "OPEN") as never,
      title: null,
      lastMessageAt: item.at,
      lastMessageText: item.preview,
      lastMessageType: null,
      lastSenderId: null,
      lastSenderType: null,
      priority: item.support?.priority ?? 0,
    },
  } as ChatConversationParticipant;
}

/* ==================== COMPONENT ==================== */

export default function AdminLiveChatPage() {
  return (
    <Suspense fallback={<InboxSkeleton />}>
      <LiveChat />
    </Suspense>
  );
}

function LiveChat() {
  const params = useSearchParams();
  const store = useStore();
  const user = useSelector((s: RootState) => s.auth.user);
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const { me, isLoading: meLoading, can, role } = usePermissions();

  const employeeId = me?.employeeId ?? null;
  const canSupport = can("customerSupport");
  const canAgents = AGENT_CHAT_UI_ENABLED && can("agentManagement");
  const employeeWithoutProfile = role === "EMPLOYEE" && !employeeId;
  const ready = !!me && !employeeWithoutProfile;

  const [tab, setTab] = useState<Tab>(params.get("tab") === "agents" ? "AGENT" : "ALL");
  const [view, setView] = useState<View>("ALL");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [started, setStarted] = useState<InboxItem | null>(null); // just opened, may be outside the loaded page
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [online, setOnline] = useState<Set<string>>(() => new Set());

  const queue = useGetSupportQueueQuery({ category: "ALL", view, limit: 50 }, { pollingInterval: POLL_MS, skip: !ready || !canSupport });
  const agentChats = useListAgentChatsQuery({ limit: 50 }, { pollingInterval: POLL_MS, skip: !ready || !canAgents });
  const refetchQueue = queue.refetch;
  const queueActive = ready && canSupport;

  const [assignConversation, { isLoading: isAssigning }] = useAssignConversationMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateConversationStatusMutation();

  // Same connection the shared chat component sets up. The server takes the identity from the token.
  useEffect(() => {
    socketService.bindAuth(store, socketTokenRefresher(store));
    if (!accessToken || !user?.id) return;
    if (!socketService.isConnected()) {
      socketService.connect({ token: accessToken, participantId: user.id, participantType: "ADMIN" });
    }
  }, [store, accessToken, user?.id]);

  useEffect(() => {
    const onPresence = ({ userId, status }: { userId: string; status: string }) =>
      setOnline((prev) => {
        const next = new Set(prev);
        if (status === "online") next.add(userId);
        else next.delete(userId);
        return next;
      });
    const onUpdated = () => {
      if (queueActive) refetchQueue();
    };
    socketService.on("presence:status", onPresence);
    socketService.on("conversationUpdated", onUpdated);
    return () => {
      socketService.off("presence:status", onPresence);
      socketService.off("conversationUpdated", onUpdated);
    };
  }, [queueActive, refetchQueue]);

  const all = useMemo(() => {
    const items = [...(queue.data?.data ?? []).map(fromSupport), ...(canAgents ? (agentChats.data?.items ?? []).map(fromAgent) : [])];
    return items.sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime());
  }, [queue.data, agentChats.data, canAgents]);

  const unreadOf = (t: Tab) => all.filter((i) => t === "ALL" || i.kind === t).reduce((s, i) => s + i.unread, 0);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((i) => (tab === "ALL" || i.kind === tab) && (!q || i.name.toLowerCase().includes(q) || (i.preview ?? "").toLowerCase().includes(q)));
  }, [all, tab, search]);

  const selected = all.find((i) => i.id === selectedId) ?? (started?.id === selectedId ? started : null);
  const loadingList = (canSupport && queue.isLoading) || (canAgents && agentChats.isLoading);

  /* ── Guards ─────────────────────────────────────────── */
  if (!accessToken || !user) {
    return <div className="flex h-screen items-center justify-center text-sm text-slate-400">Please log in.</div>;
  }
  if (meLoading && !me) return <InboxSkeleton />;
  if (employeeWithoutProfile) {
    return <div className="flex h-screen items-center justify-center px-6 text-center text-sm text-slate-400">Employee profile not found for this login. Ask an administrator to link your account.</div>;
  }
  if (me && !canSupport && !canAgents) {
    return <div className="flex h-screen items-center justify-center px-6 text-center text-sm text-slate-400">You don&apos;t have access to Live Chat.</div>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "ALL", label: "All" },
    ...(canSupport
      ? ([
          { key: "CUSTOMER", label: "Customers" },
          { key: "VENDOR", label: "Vendors" },
        ] as const)
      : []),
    ...(canAgents ? ([{ key: "AGENT", label: "Agents" }] as const) : []),
  ];

  const handleAssignToMe = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (!employeeId) return;
    try {
      await assignConversation({ id: conversationId, assigneeId: employeeId, assigneeType: "ADMIN" }).unwrap();
      refetchQueue();
    } catch (err) {
      console.error("[AdminSupport] assign failed:", err);
      toast.error("Could not assign the conversation");
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, conversationId: string) => {
    try {
      await updateStatus({ id: conversationId, status: e.target.value as ConversationStatus }).unwrap();
      refetchQueue();
    } catch (err) {
      console.error("[AdminSupport] status update failed:", err);
      toast.error("Could not update the status");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* ── Left: inbox ───────────────────────────────────── */}
      <div className={`${selected ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r border-slate-100 md:w-[380px]`}>
        <div className="space-y-3 border-b border-slate-100 p-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <MessageSquare size={18} className="text-indigo-600" />
              Live Chat
            </h1>
            <button onClick={() => setNewChatOpen(true)} className="inline-flex h-8 items-center gap-1 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700">
              <Plus size={14} /> New chat
            </button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations"
              aria-label="Search conversations"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Conversation type">
            {tabs.map((t) => {
              const n = unreadOf(t.key);
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${tab === t.key ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {t.label}
                  {n > 0 && <span className="min-w-4 rounded-full bg-indigo-600 px-1 text-[10px] font-bold leading-4 text-white">{n > 99 ? "99+" : n}</span>}
                </button>
              );
            })}
          </div>

          {canSupport && tab !== "AGENT" && (
            <div className="flex gap-1 text-xs">
              {VIEW_TABS.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={`rounded-full px-3 py-1 font-medium transition-colors ${view === v.key ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingList && visible.length === 0 && <InboxSkeleton />}
          {!loadingList && visible.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-slate-400">
              <MessageSquare size={26} strokeWidth={1.5} className="mb-3 opacity-50" />
              <div className="text-sm font-semibold text-slate-500">{search ? "No matches" : "No conversations here"}</div>
              <div className="mt-1 text-xs">{search ? "Try a different search." : "Start one with New chat."}</div>
            </div>
          )}
          {visible.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSelectedId(item.id);
              }}
              className={`cursor-pointer border-b border-l-2 border-b-slate-50 px-4 py-3 transition-colors ${item.id === selectedId ? "border-l-indigo-600 bg-indigo-50" : "border-l-transparent hover:bg-slate-50"}`}
            >
              <div className="flex items-start gap-3">
                <InboxAvatar name={item.name} image={item.image} online={!!item.ownerId && online.has(item.ownerId)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm text-slate-800 ${item.unread > 0 ? "font-bold" : "font-semibold"}`}>{item.name}</span>
                    <span className="shrink-0 text-[10px] text-slate-400">{inboxTime(item.at)}</span>
                  </div>
                  <div className="truncate text-xs text-slate-500">{item.preview ?? "No messages yet"}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <KindBadge kind={item.kind} />
                    {item.readOnly && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <Eye size={11} /> Read-only
                      </span>
                    )}
                    {item.support && <span className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${STATUS_COLORS[item.support.status]}`}>{item.support.status}</span>}
                    {item.support && item.support.priority > 0 && <span className="text-[10px] font-bold text-red-500">{"🔥".repeat(Math.min(item.support.priority, 3))}</span>}
                    {item.unread > 0 && (
                      <span className="ml-auto min-w-5 rounded-full bg-indigo-600 px-1.5 text-center text-[10px] font-bold leading-5 text-white">{item.kind === "AGENT" ? "reply" : item.unread}</span>
                    )}
                    {item.support && !item.support.assignedTo && employeeId && (
                      <button onClick={(e) => handleAssignToMe(e, item.id)} disabled={isAssigning} className={`text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 ${item.unread > 0 ? "" : "ml-auto"}`}>
                        Assign to me
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: thread ─────────────────────────────────── */}
      <div className={`${selected ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
        {selected ? (
          <>
            {selected.support && (
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-2">
                <span className="text-xs text-slate-500">Conversation status</span>
                <select
                  value={selected.support.status}
                  onChange={(e) => handleStatusChange(e, selected.id)}
                  disabled={isUpdatingStatus}
                  aria-label="Conversation status"
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                >
                  {(Object.keys(STATUS_COLORS) as ConversationStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {selected.readOnly && (
              <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-5 py-2 text-xs font-medium text-amber-800" role="note">
                <Eye size={14} className="shrink-0" /> Read-only: staff can&apos;t write in agent↔vendor conversations. Every view is logged.
              </div>
            )}
            <div className="relative flex min-h-0 flex-1 flex-col">
              <ChatBox key={selected.id} conversation={toConversation(selected)} role="ADMIN" myEmployeeId={employeeId} readOnly={selected.readOnly} onClose={() => setSelectedId(null)} />
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
            <MessageSquare size={40} strokeWidth={1.5} className="text-indigo-100" />
            <div className="text-sm font-semibold text-slate-500">Select a conversation</div>
            <div className="text-xs">Or start one with New chat.</div>
          </div>
        )}
      </div>

      <NewChatDialog
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        canSupport={canSupport}
        canAgents={canAgents}
        onStartedSupport={(item) => {
          const row = fromSupport(item);
          setStarted(row);
          setView("ALL");
          setTab(row.kind);
          setSelectedId(row.id);
        }}
        onStartedAgent={(id, agent) => {
          setStarted(
            fromAgent({
              id,
              type: "AGENT_SUPPORT",
              status: "OPEN",
              lastMessageAt: null,
              lastMessageText: null,
              awaitingStaff: false,
              agent: { id: agent.id, displayName: agent.name, displayImage: null },
              vendor: null,
              staffMayWrite: true,
              readOnlyReason: null,
              notice: "",
            }),
          );
          setTab("AGENT");
          setSelectedId(id);
          agentChats.refetch();
        }}
      />
    </div>
  );
}
