"use client";

// Route: /admin-dashboard/chat — Live Chat, the one inbox for FinixMart staff.
//   Customers / Vendors: the support queue (ADMIN, or admin-side staff with customerSupport).
//   Agents: agent↔staff (shared inbox, reply) and agent↔vendor (read-only, each
//   view audited by the backend) for ADMIN or staff with agentManagement.
// The server enforces all of this; the permission checks here only shape the UI.
// Redesigned on the payouts/commission design kit (src/components/payouts/ui.tsx):
// 3-panel shell (inbox / thread / details) + stat cards. The shared ChatBox thread
// (bubbles, typing, seen ticks, optimistic send, composer) is embedded untouched.
//
// Identity comes from /auth/me, never the login-time Redux user: its employeeId
// is null when an ADMIN logged in before their chat row existed, although the
// backend (authenticateUser) resolves that row on every request. An EMPLOYEE
// without a profile is still stopped here, and refused by the server.

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSelector, useStore } from "react-redux";
import { CheckCheck, Eye, Inbox, MessageSquare, PanelRight, Plus, RefreshCw, ShieldAlert, UserCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { RootState } from "@/store/store";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Notice,
  PageHeader,
  PillTabs,
  SearchBox,
  Skeleton,
  StatCard,
  cx,
  inputCls,
} from "@/components/payouts/ui";
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
type StatusFilter = "ALL" | "UNREAD" | "ACTIVE" | "RESOLVED";

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

const STATUS_TONE: Record<ConversationStatus, "blue" | "amber" | "violet" | "green" | "slate"> = {
  OPEN: "blue",
  PENDING: "amber",
  ASSIGNED: "violet",
  RESOLVED: "green",
  CLOSED: "slate",
  ARCHIVED: "slate",
};

const ACTIVE_STATUSES: ConversationStatus[] = ["OPEN", "PENDING", "ASSIGNED"];

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

function itemStatus(item: InboxItem): ConversationStatus | null {
  return (item.support?.status ?? item.agent?.status ?? null) as ConversationStatus | null;
}

function matchesStatusFilter(item: InboxItem, filter: StatusFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "UNREAD") return item.unread > 0;
  const status = itemStatus(item);
  if (filter === "ACTIVE") return status !== null && ACTIVE_STATUSES.includes(status);
  return status === "RESOLVED";
}

/* ==================== COMPONENT ==================== */

export default function AdminLiveChatPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LiveChat />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col gap-3" aria-busy="true" aria-label="Loading Live Chat">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-6 w-44 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[92px] animate-pulse rounded-lg border border-slate-200 bg-white" />
        ))}
      </div>
      <Card flush className="min-h-0 flex-1">
        <Skeleton rows={6} />
      </Card>
    </div>
  );
}

function GuardState({ icon, title, body }: { icon: React.ReactNode; title: string; body?: string }) {
  return (
    <div className="grid h-[calc(100dvh-3rem)] place-items-center p-4">
      <div className="w-full max-w-sm">
        <EmptyState icon={icon} title={title} body={body} />
      </div>
    </div>
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [started, setStarted] = useState<InboxItem | null>(null); // just opened, may be outside the loaded page
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
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

  const scoped = useMemo(() => all.filter((i) => tab === "ALL" || i.kind === tab), [all, tab]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((i) => !q || i.name.toLowerCase().includes(q) || (i.preview ?? "").toLowerCase().includes(q));
  }, [scoped, search]);

  const visible = useMemo(() => searched.filter((i) => matchesStatusFilter(i, statusFilter)), [searched, statusFilter]);

  const statusCounts = useMemo(() => {
    const count = (f: StatusFilter) => searched.filter((i) => matchesStatusFilter(i, f)).length;
    return { unread: count("UNREAD"), active: count("ACTIVE"), resolved: count("RESOLVED") };
  }, [searched]);

  const selected = all.find((i) => i.id === selectedId) ?? (started?.id === selectedId ? started : null);
  const loadingList = (canSupport && queue.isLoading) || (canAgents && agentChats.isLoading);
  const listError = (canSupport && queue.isError) || (canAgents && agentChats.isError);
  const listRefreshing = (canSupport && queue.isFetching) || (canAgents && agentChats.isFetching);

  /* ── Guards ─────────────────────────────────────────── */
  if (!accessToken || !user) {
    return <GuardState icon={<ShieldAlert />} title="Please log in." body="Log in to an admin or staff account to open Live Chat." />;
  }
  if (meLoading && !me) return <PageSkeleton />;
  if (employeeWithoutProfile) {
    return <GuardState icon={<ShieldAlert />} title="Employee profile not found" body="Ask an administrator to link your account to an employee profile." />;
  }
  if (me && !canSupport && !canAgents) {
    return <GuardState icon={<ShieldAlert />} title="No access to Live Chat" body="Your role does not include customer support or agent management." />;
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

  const handleAssignToMe = async (conversationId: string) => {
    if (!employeeId) return;
    try {
      await assignConversation({ id: conversationId, assigneeId: employeeId, assigneeType: "ADMIN" }).unwrap();
      toast.success("Conversation assigned to you");
      refetchQueue();
    } catch (err) {
      console.error("[AdminSupport] assign failed:", err);
      toast.error("Could not assign the conversation");
    }
  };

  const handleStatusChange = async (conversationId: string, status: ConversationStatus) => {
    try {
      await updateStatus({ id: conversationId, status }).unwrap();
      toast.success(`Conversation marked ${status.toLowerCase()}`);
      refetchQueue();
    } catch (err) {
      console.error("[AdminSupport] status update failed:", err);
      toast.error("Could not update the status");
    }
  };

  const handleRetryList = () => {
    if (canSupport) queue.refetch();
    if (canAgents) agentChats.refetch();
  };

  const statusOptions: { key: string; label: string; count?: number }[] = [
    { key: "ALL", label: "All", count: searched.length },
    { key: "UNREAD", label: "Unread", count: statusCounts.unread },
    { key: "ACTIVE", label: "Active", count: statusCounts.active },
    { key: "RESOLVED", label: "Resolved", count: statusCounts.resolved },
  ];

  return (
    <div className="live-chat-shell flex h-[calc(100dvh-3rem)] flex-col gap-3">
      <PageHeader
        icon={<MessageSquare />}
        title="Live Chat"
        subtitle={canSupport && canAgents ? "Customer & vendor support queue plus agent conversations." : canSupport ? "Customer & vendor support queue." : "Agent conversations."}
        actions={
          <>
            {listError && (
              <Button size="sm" variant="secondary" onClick={handleRetryList}>
                <RefreshCw /> Retry
              </Button>
            )}
            <Button size="sm" onClick={() => setNewChatOpen(true)}>
              <Plus /> New chat
            </Button>
          </>
        }
      />

      <StatCardRow
        total={scoped.length}
        unread={scoped.filter((i) => i.unread > 0).length}
        active={scoped.filter((i) => matchesStatusFilter(i, "ACTIVE")).length}
        resolved={scoped.filter((i) => matchesStatusFilter(i, "RESOLVED")).length}
        loading={loadingList}
      />

      {/* Plain card surface instead of the kit Card: its inner wrapper div is not a flex
          container, which broke the bounded-height chain and made the thread overflow. */}
      <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex h-full min-h-0 flex-1">
          {/* ── Left: inbox ─────────────────────────────────── */}
          <aside
            aria-label="Conversations"
            className={cx("w-full flex-col md:flex md:w-[330px] md:shrink-0 md:border-r md:border-slate-100", selected ? "hidden" : "flex")}
          >
            <div className="space-y-2 border-b border-slate-100 p-3">
              <SearchBox value={search} onChange={setSearch} placeholder="Search name or message" />
              <PillTabs
                options={tabs.map((t) => ({ key: t.key, label: t.label, count: unreadOf(t.key) || undefined }))}
                value={tab}
                onChange={(k) => setTab(k as Tab)}
              />
              {canSupport && tab !== "AGENT" && (
                <PillTabs options={VIEW_TABS} value={view} onChange={(k) => setView(k as View)} />
              )}
              <div className="flex items-center justify-between gap-2">
                <PillTabs options={statusOptions} value={statusFilter} onChange={(k) => setStatusFilter(k as StatusFilter)} />
                {listRefreshing && !loadingList && (
                  <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-300" aria-label="Refreshing" />
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto" role="list" aria-label="Conversation list">
              {listError && (
                <div className="space-y-2 p-3">
                  <Notice tone="red">Couldn&apos;t load conversations. Check your connection and try again.</Notice>
                  <Button size="sm" variant="secondary" onClick={handleRetryList}>
                    <RefreshCw /> Retry
                  </Button>
                </div>
              )}
              {!listError && loadingList && visible.length === 0 && <InboxSkeleton />}
              {!listError && !loadingList && visible.length === 0 && (
                <div className="p-3">
                  <EmptyState
                    icon={<Inbox />}
                    title={search ? "No matches" : statusFilter !== "ALL" ? `No ${statusFilter.toLowerCase()} conversations` : "No conversations here"}
                    body={search ? "Try a different name or message." : "Start one with New chat."}
                  />
                </div>
              )}
              {!listError &&
                visible.map((item) => (
                  <ConversationRow
                    key={item.id}
                    item={item}
                    selected={item.id === selectedId}
                    online={!!item.ownerId && online.has(item.ownerId)}
                    isAssigning={isAssigning}
                    employeeId={employeeId}
                    onSelect={() => setSelectedId(item.id)}
                    onAssignToMe={() => handleAssignToMe(item.id)}
                  />
                ))}
            </div>
          </aside>

          {/* ── Middle: thread ──────────────────────────────── */}
          <section
            aria-label="Conversation thread"
            className={cx("min-w-0 flex-1 flex-col md:flex", selected ? "flex" : "hidden")}
          >
            {selected ? (
              <>
                <ThreadActionBar
                  item={selected}
                  employeeId={employeeId}
                  isAssigning={isAssigning}
                  isUpdatingStatus={isUpdatingStatus}
                  onStatusChange={handleStatusChange}
                  onAssignToMe={handleAssignToMe}
                  onToggleDetails={() => setDetailsOpen(true)}
                />
                {selected.readOnly && (
                  <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800" role="note">
                    <Eye size={14} className="shrink-0" aria-hidden /> Read-only: staff can&apos;t write in agent↔vendor conversations. Every view is logged.
                  </div>
                )}
                <div className="relative flex min-h-0 flex-1 flex-col">
                  <ChatBox key={selected.id} conversation={toConversation(selected)} role="ADMIN" myEmployeeId={employeeId} readOnly={selected.readOnly} onClose={() => setSelectedId(null)} />
                </div>
              </>
            ) : (
              <div className="grid flex-1 place-items-center p-6">
                <EmptyState
                  icon={<MessageSquare />}
                  title="Select a conversation"
                  body="Pick a chat on the left, or start a new one."
                  action={
                    <Button size="sm" onClick={() => setNewChatOpen(true)}>
                      <Plus /> New chat
                    </Button>
                  }
                />
              </div>
            )}
          </section>

          {/* ── Right: details (desktop) ────────────────────── */}
          <aside
            aria-label="Conversation details"
            className={cx("w-[290px] shrink-0 flex-col border-l border-slate-100", selected ? "hidden xl:flex" : "hidden")}
          >
            {selected ? (
              <DetailsPanel item={selected} online={!!selected.ownerId && online.has(selected.ownerId)} />
            ) : (
              <div className="grid flex-1 place-items-center p-4">
                <p className="text-center text-xs leading-5 text-slate-400">Select a conversation to see its details here.</p>
              </div>
            )}
          </aside>
        </div>

        {/* ── Details drawer (tablet) ─────────────────────────── */}
        {selected && detailsOpen && (
          <>
            <button
              type="button"
              aria-label="Close details"
              onClick={() => setDetailsOpen(false)}
              className="absolute inset-0 z-30 cursor-default bg-slate-900/30 motion-safe:animate-[fadein_0.2s_ease-out] xl:hidden"
            />
            <div
              role="dialog"
              aria-label="Conversation details"
              className="absolute inset-y-0 right-0 z-40 flex w-[300px] max-w-[85vw] flex-col border-l border-slate-200 bg-white shadow-2xl motion-safe:animate-[slidein_0.25s_ease-out] xl:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                <h2 className="text-[13px] font-semibold text-slate-800">Details</h2>
                <Button size="sm" variant="ghost" onClick={() => setDetailsOpen(false)} title="Close details">
                  Close
                </Button>
              </div>
              <DetailsPanel item={selected} online={!!selected.ownerId && online.has(selected.ownerId)} />
            </div>
          </>
        )}
      </section>

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

      <style jsx global>{`
        @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slidein { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse { animation: none !important; }
        }
        /* Slim, rounded scrollbars for every scroll area inside the chat shell
           (inbox list, message log, details panel). */
        .live-chat-shell,
        .live-chat-shell * {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .live-chat-shell ::-webkit-scrollbar,
        .live-chat-shell::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .live-chat-shell ::-webkit-scrollbar-track,
        .live-chat-shell::-webkit-scrollbar-track {
          background: transparent;
        }
        .live-chat-shell ::-webkit-scrollbar-thumb,
        .live-chat-shell::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 9999px;
        }
        .live-chat-shell ::-webkit-scrollbar-thumb:hover,
        .live-chat-shell::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
        /* The shared ChatBox message log must shrink so it scrolls, not the page. */
        .live-chat-shell .chat-messages-scroll {
          min-height: 0;
        }
      `}</style>
    </div>
  );
}

/* ==================== SUBCOMPONENTS ==================== */

function StatCardRow({ total, unread, active, resolved, loading }: { total: number; unread: number; active: number; resolved: number; loading: boolean }) {
  const v = (n: number) => (loading ? "—" : n);
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Total chats" value={v(total)} icon={<MessageSquare />} accent="indigo" hint="In the current queue view" />
      <StatCard label="Unread" value={v(unread)} icon={<Zap />} accent="rose" hint="Waiting for a reply" />
      <StatCard label="Active" value={v(active)} icon={<Inbox />} accent="sky" hint="Open, pending or assigned" />
      <StatCard label="Resolved" value={v(resolved)} icon={<CheckCheck />} accent="green" />
    </div>
  );
}

function ConversationRow({
  item,
  selected,
  online,
  isAssigning,
  employeeId,
  onSelect,
  onAssignToMe,
}: {
  item: InboxItem;
  selected: boolean;
  online: boolean;
  isAssigning: boolean;
  employeeId: string | null;
  onSelect: () => void;
  onAssignToMe: () => void;
}) {
  const status = itemStatus(item);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-current={selected ? "true" : undefined}
      aria-label={`Open conversation with ${item.name}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cx(
        "cursor-pointer border-b border-l-2 border-b-slate-50 px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4338CA]/40",
        selected ? "border-l-[#4338CA] bg-[#eef2ff]" : "border-l-transparent hover:bg-slate-50",
      )}
    >
      <div className="flex items-start gap-3">
        <InboxAvatar name={item.name} image={item.image} online={online} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={cx("truncate text-sm text-slate-800", item.unread > 0 ? "font-bold" : "font-semibold")}>{item.name}</span>
            <span className="shrink-0 text-[10px] tabular-nums text-slate-400">{inboxTime(item.at)}</span>
          </div>
          <div className="truncate text-xs text-slate-500">{item.preview ?? "No messages yet"}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <KindBadge kind={item.kind} />
            {item.readOnly && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                <Eye size={11} aria-hidden /> Read-only
              </span>
            )}
            {status && <Badge tone={STATUS_TONE[status]}>{status}</Badge>}
            {item.support && item.support.priority > 0 && (
              <span className="text-[10px] font-bold text-rose-500" aria-label={`Priority ${item.support.priority}`}>
                {"🔥".repeat(Math.min(item.support.priority, 3))}
              </span>
            )}
            {item.unread > 0 && (
              <span className="ml-auto min-w-5 rounded-full bg-[#4338CA] px-1.5 text-center text-[10px] font-bold leading-5 text-white motion-safe:animate-pulse">
                {item.kind === "AGENT" ? "reply" : item.unread > 99 ? "99+" : item.unread}
              </span>
            )}
            {item.support && !item.support.assignedTo && employeeId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignToMe();
                }}
                disabled={isAssigning}
                className={cx(
                  "inline-flex items-center gap-1 text-[10px] font-semibold text-[#4338CA] hover:text-[#3730A3] disabled:opacity-50",
                  item.unread > 0 ? "" : "ml-auto",
                )}
              >
                <UserCheck size={11} aria-hidden /> Assign to me
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadActionBar({
  item,
  employeeId,
  isAssigning,
  isUpdatingStatus,
  onStatusChange,
  onAssignToMe,
  onToggleDetails,
}: {
  item: InboxItem;
  employeeId: string | null;
  isAssigning: boolean;
  isUpdatingStatus: boolean;
  onStatusChange: (conversationId: string, status: ConversationStatus) => void;
  onAssignToMe: (conversationId: string) => void;
  onToggleDetails: () => void;
}) {
  const status = item.support?.status ?? null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-3 py-2">
      {item.support && (
        <>
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            Status
            <select
              value={status ?? "OPEN"}
              onChange={(e) => onStatusChange(item.id, e.target.value as ConversationStatus)}
              disabled={isUpdatingStatus}
              aria-label="Conversation status"
              className={cx(inputCls, "h-8 w-auto py-0 text-xs font-medium")}
            >
              {(Object.keys(STATUS_TONE) as ConversationStatus[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          {status !== "RESOLVED" ? (
            <Button size="sm" variant="secondary" loading={isUpdatingStatus} onClick={() => onStatusChange(item.id, "RESOLVED")}>
              <CheckCheck /> Resolve
            </Button>
          ) : (
            <Button size="sm" variant="ghost" loading={isUpdatingStatus} onClick={() => onStatusChange(item.id, "OPEN")}>
              Reopen
            </Button>
          )}
          {!item.support.assignedTo && employeeId && (
            <Button size="sm" variant="ghost" loading={isAssigning} onClick={() => onAssignToMe(item.id)}>
              <UserCheck /> Assign to me
            </Button>
          )}
        </>
      )}
      <Button size="sm" variant="ghost" className="ml-auto xl:hidden" onClick={onToggleDetails} title="Conversation details">
        <PanelRight aria-hidden />
      </Button>
    </div>
  );
}

function DetailsPanel({ item, online }: { item: InboxItem; online: boolean }) {
  const status = itemStatus(item);
  const typeLabel = ((item.support?.type ?? item.agent?.type) ?? "").replaceAll("_", " ").toLowerCase();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col items-center gap-2 border-b border-slate-100 px-4 py-5 text-center">
        <InboxAvatar name={item.name} image={item.image} online={online} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
          <p className="text-[11px] text-slate-500">{online ? "Online now" : "Offline"}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <KindBadge kind={item.kind} />
          {status && (
            <Badge tone={STATUS_TONE[status]} dot>
              {status}
            </Badge>
          )}
          {item.agent?.awaitingStaff && <Badge tone="amber">Awaiting reply</Badge>}
          {item.readOnly && <Badge tone="slate">Read-only</Badge>}
        </div>
      </div>

      <dl className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {typeLabel && <DetailsRow label="Type" value={typeLabel} />}
        <DetailsRow
          label="Priority"
          value={item.support && item.support.priority > 0 ? "High " + "🔥".repeat(Math.min(item.support.priority, 3)) : "Normal"}
        />
        <DetailsRow
          label="Assignee"
          value={item.support?.assignedTo ? item.support.assignedTo.assigneeType.toLowerCase() : "Unassigned"}
        />
        <DetailsRow label="Last activity" value={inboxTime(item.at) || "—"} />
        <DetailsRow label="Unread" value={String(item.unread)} />
        {item.agent?.vendor?.displayName && <DetailsRow label="Vendor" value={item.agent.vendor.displayName} />}
      </dl>

      <div className="space-y-2 border-t border-slate-100 p-4">
        {item.agent?.notice && <Notice tone="violet">{item.agent.notice}</Notice>}
        {item.readOnly && (
          <Notice tone="amber">Read-only: staff can&apos;t write in agent↔vendor conversations. Every view is logged.</Notice>
        )}
        <p className="text-[11px] leading-4 text-slate-400">Use the actions above the chat to change the status or assign this conversation.</p>
      </div>
    </div>
  );
}

function DetailsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-[11px] font-medium text-slate-500">{label}</dt>
      <dd className="truncate text-[12px] font-medium capitalize text-slate-800" title={value}>
        {value}
      </dd>
    </div>
  );
}
