"use client";
import { socketService } from "@/services/socketService";
import React, { useState, useEffect, useMemo } from "react";
import {
  useGetMyConversationsQuery,
  type ChatConversationParticipant,
} from "@/features/chatApi";
import { Search, MessageSquare, X, Loader2, Settings, WifiOff, RefreshCw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useChatConnection, CONNECTION_COPY } from "./useChatConnection";
import { AGENT_CHAT_UI_ENABLED, AgentChatBadge, isAgentConversation } from "@/lib/agent-chat-ui";

interface ChatListProps {
  role: "VENDOR" | "ADMIN" | "USER" | "EMPLOYEE" | "DELIVERY";
  currentVendorId?: string;
  selectedConversationId?: string;
  onSelectConversation: (conversation: ChatConversationParticipant) => void;
}

type FilterTab = "all" | "unread";

// ── Helpers ────────────────────────────────────────────────────

// Identifies the OTHER person in the chat so the list can be grouped
// "one row per person", like a normal messenger, instead of one row
// per conversation record.
//
// FIX: the old version tried to read item.vendorId / item.employeeId /
// item.userId — but those fields on a ConversationParticipant row always
// describe the OWNER of that row (i.e. me), never the counterpart. Exactly
// one of them is ever set, and it's always my own id, so the old function
// returned null for every single conversation regardless of role.
//
// The counterpart must be resolved server-side (the sibling participant
// row(s) in the same conversation) and returned as `otherParticipant`.
// See chatApi.ts — ChatConversationParticipant.otherParticipant.
function getOtherParticipantId(item: ChatConversationParticipant): string | null {
  return item.otherParticipant?.id ?? null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "#4f46e5", "#7c3aed", "#0891b2", "#059669",
    "#d97706", "#dc2626", "#db2777", "#6d28d9",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Chat List Item ─────────────────────────────────────────────

function ChatListItem({
  item,
  onClick,
  isActive,
  chatType,
}: {
  item: ChatConversationParticipant;
  onClick: () => void;
  isActive: boolean;
  chatType?: string;
}) {
  // FIX: show the counterpart's name, not conversation.title (which is
  // often null / a generic subject line, not "who am I talking to").
  const displayName =
    item.otherParticipant?.displayName || item.conversation.title || "Unknown Chat";
  const displayImage = item.otherParticipant?.displayImage || null;
  const isUnread = item.unreadCount > 0;
  const time = formatTime(item.conversation.lastMessageAt);
  const lastMessage = item.conversation.lastMessageText || "No messages yet";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      aria-label={`${displayName}${isUnread ? `, ${item.unreadCount} unread` : ""}${time ? `, ${time}` : ""}: ${lastMessage}`}
      className="chat-list-item"
      style={{
        width: "100%",
        textAlign: "left",
        border: "none",
        font: "inherit",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        cursor: "pointer",
        background: isActive
          ? "linear-gradient(135deg, #eef2ff, #f5f3ff)"
          : "transparent",
        borderLeft: isActive ? "3px solid #4f46e5" : "3px solid transparent",
        borderBottom: "1px solid #f8fafc",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "#f8fafc";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Avatar */}
      {displayImage ? (
        <img
          src={displayImage}
          alt={displayName}
          style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
            boxShadow: `0 2px 8px ${getAvatarColor(displayName)}33`,
          }}
        />
      ) : (
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${getAvatarColor(displayName)}, ${getAvatarColor(displayName)}cc)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            flexShrink: 0,
            boxShadow: `0 2px 8px ${getAvatarColor(displayName)}33`,
          }}
        >
          {getInitials(displayName)}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: isUnread ? 700 : 600,
              color: isUnread ? "#0f172a" : "#334155",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayName}
            {AGENT_CHAT_UI_ENABLED && (item.otherParticipant?.participantType as string | undefined) === "AGENT" && <AgentChatBadge />}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: isUnread ? 700 : 500,
              color: isUnread ? "#4f46e5" : "#94a3b8",
              whiteSpace: "nowrap",
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            {time}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: isUnread ? "#475569" : "#94a3b8",
              fontWeight: isUnread ? 500 : 400,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {chatType === "PRODUCT_INQUIRY" ? `📦 ${lastMessage}` : lastMessage}
          </span>

          {isUnread && (
            <div
              style={{
                minWidth: 22,
                height: 22,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 6px",
                flexShrink: 0,
              }}
            >
              {item.unreadCount > 99 ? "99+" : item.unreadCount}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────

export const ChatList: React.FC<ChatListProps> = ({
  role,
  currentVendorId,
  selectedConversationId,
  onSelectConversation,
})  => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  const [allConversations, setAllConversations] = useState<ChatConversationParticipant[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);

  const connection = useChatConnection();
  const { data, isFetching, isError, refetch } = useGetMyConversationsQuery({
    cursor: currentCursor,
    limit: 30,
  });

  useEffect(() => {
    if (data?.data) {
      if (currentCursor === undefined) {
        setAllConversations(data.data);
      } else {
        setAllConversations((prev) => [...prev, ...data.data]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
useEffect(() => {
    const handleConversationUpdated = (data: {
      conversationId: string;
      lastMessageAt: string;
      lastMessageText: string;
      lastMessageType: string;
      lastSenderId: string;
      lastSenderType: string;
    }) => {
      setAllConversations((prev) => {
        const idx = prev.findIndex((c) => c.conversation.id === data.conversationId);
        if (idx === -1) {
          // Conversation not in the current page yet (e.g. a brand new
          // conversation) — simplest correct fix is to refetch page 1.
          refetch();
          return prev;
        }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          unreadCount: updated[idx].unreadCount + 1,
          conversation: {
            ...updated[idx].conversation,
            lastMessageAt: data.lastMessageAt,
            lastMessageText: data.lastMessageText,
            lastMessageType: data.lastMessageType as any,
            lastSenderId: data.lastSenderId,
            lastSenderType: data.lastSenderType as any,
          },
        };
        return updated;
      });
    };

    socketService.on("conversationUpdated", handleConversationUpdated);
    return () => socketService.off("conversationUpdated", handleConversationUpdated);
  }, [refetch]);
  // Search + tab filter, then group by the other person in the chat
  // (like a messenger thread list — one row per person, not per conversation record)
  const groupedConversations = useMemo(() => {
    // P10: agent conversations only appear while the agent-chat flag is on.
    let source = AGENT_CHAT_UI_ENABLED ? [...allConversations] : allConversations.filter((c) => !isAgentConversation(c.conversation.type));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      source = source.filter((c) =>
        (c.otherParticipant?.displayName || c.conversation.title || "").toLowerCase().includes(q) ||
        (c.conversation.lastMessageText || "").toLowerCase().includes(q)
      );
    }

    if (filterTab === "unread") {
      source = source.filter((c) => c.unreadCount > 0);
    }

    const map = new Map<string, ChatConversationParticipant>();

    source.forEach((conv) => {
      // FIX: was getOtherParticipantId(conv, role) reading fields that can
      // never hold the counterpart's id — always returned null, so every
      // conversation was silently dropped here.
      const otherId = getOtherParticipantId(conv);
      if (!otherId) return;

      const existing = map.get(otherId);
      if (!existing) {
        map.set(otherId, conv);
      } else {
        const existingTime = new Date(existing.conversation.lastMessageAt || 0).getTime();
        const newTime = new Date(conv.conversation.lastMessageAt || 0).getTime();
        if (newTime > existingTime) {
          map.set(otherId, conv);
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const aTime = new Date(a.conversation.lastMessageAt || 0).getTime();
      const bTime = new Date(b.conversation.lastMessageAt || 0).getTime();
      return bTime - aTime;
    });
  }, [allConversations, searchQuery, filterTab]);

  const totalUnread = allConversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const loadMore = () => {
    if (data?.hasMore && data?.nextCursor) {
      setCurrentCursor(data.nextCursor);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#ffffff" }}>
      {/* Header */}
      <div style={{ padding: "20px 18px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 10 }}>
            <MessageSquare size={22} color="#4f46e5" strokeWidth={2} />
            Messages
            {totalUnread > 0 && (
              <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: "linear-gradient(135deg, #4f46e5, #6366f1)", color: "#fff" }}>
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </h2>
          {role === "VENDOR" && (
            <Link
              href="/vendor-dashboard/chat/auto-reply"
              aria-label="Chat settings"
              title="Chat settings: auto replies, quick replies, notifications"
              className="chat-focus-ring"
              style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0" }}
            >
              <Settings size={17} aria-hidden />
            </Link>
          )}
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name or message..."
            aria-label="Search conversations"
            style={{ width: "100%", padding: "11px 40px 11px 42px", border: "1.5px solid #e2e8f0", borderRadius: 12, fontSize: 13, fontFamily: "inherit", background: "#f8fafc", outline: "none", color: "#0f172a" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.08)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
          />
          {searchQuery && (
            <button type="button" aria-label="Clear search" onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", border: "none", background: "#e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 14, padding: "3px", background: "#f1f5f9", borderRadius: 10 }}>
          {(["all", "unread"] as const).map((tab) => (
            <button key={tab} type="button" aria-pressed={filterTab === tab} onClick={() => setFilterTab(tab)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: filterTab === tab ? "#fff" : "transparent", cursor: "pointer", fontSize: 12, fontWeight: filterTab === tab ? 700 : 600, color: filterTab === tab ? "#4f46e5" : "#94a3b8", fontFamily: "inherit", boxShadow: filterTab === tab ? "0 1px 3px rgba(0,0,0,0.06)" : "none" }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {connection !== "online" && (
        <div role="status" style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "0 18px 10px", padding: "8px 12px", borderRadius: 10, fontSize: 12, lineHeight: 1.45, background: connection === "offline" ? "#fef2f2" : "#fffbeb", color: connection === "offline" ? "#b91c1c" : "#92400e" }}>
          <WifiOff size={14} style={{ marginTop: 1, flexShrink: 0 }} aria-hidden />
          <span>{CONNECTION_COPY[connection]}</span>
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", borderTop: "1px solid #f1f5f9" }} className="chat-list-vertical-scroll" aria-busy={isFetching}>
        {isError && allConversations.length === 0 && (
          <div role="alert" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "56px 24px", textAlign: "center", color: "#64748b", gap: 10 }}>
            <AlertTriangle size={28} color="#f87171" strokeWidth={1.75} aria-hidden />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>Couldn&apos;t load conversations</div>
            <div style={{ fontSize: 12 }}>Check your connection and try again.</div>
            <button type="button" onClick={() => refetch()} className="chat-focus-ring" style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#4f46e5" }}>
              <RefreshCw size={13} aria-hidden /> Try again
            </button>
          </div>
        )}
        {isError && allConversations.length > 0 && (
          <div role="alert" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "10px 18px 0", padding: "8px 12px", borderRadius: 10, background: "#fef2f2", color: "#b91c1c", fontSize: 12 }}>
            <span>Couldn&apos;t refresh the list.</span>
            <button type="button" onClick={() => refetch()} style={{ border: "none", background: "transparent", color: "#b91c1c", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
              Retry
            </button>
          </div>
        )}
        {isFetching && allConversations.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: "#94a3b8", gap: 12 }}>
            <Loader2 size={28} className="animate-spin" />
            <span style={{ fontSize: 13 }}>Loading conversations...</span>
          </div>
        )}

        {!isFetching && !isError && groupedConversations.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center", color: "#94a3b8" }}>
            <MessageSquare size={32} strokeWidth={1.5} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
              {searchQuery ? "No results found" : "No conversations yet"}
            </div>
          </div>
        )}

        {groupedConversations.map((conv) => (
          <ChatListItem
            key={conv.id}
            item={conv}
            onClick={() => onSelectConversation(conv)}
            isActive={conv.conversation.id === selectedConversationId}
            chatType={conv.conversation.type}
          />
        ))}

        {data?.hasMore && !isFetching && (
          <div style={{ padding: "16px", textAlign: "center" }}>
            <button type="button" onClick={loadMore} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#4f46e5" }}>
              Load More
            </button>
          </div>
        )}

        {isFetching && allConversations.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", color: "#94a3b8", gap: 8 }}>
            <Loader2 size={16} className="animate-spin" />
            <span style={{ fontSize: 12 }}>Loading more...</span>
          </div>
        )}
      </div>

      <style>{`
        .chat-list-vertical-scroll { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .chat-list-vertical-scroll::-webkit-scrollbar { width: 5px; }
        .chat-list-vertical-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .chat-list-item:focus-visible, .chat-focus-ring:focus-visible { outline: 2px solid #6366f1; outline-offset: -2px; }
      `}</style>
    </div>
  );
};