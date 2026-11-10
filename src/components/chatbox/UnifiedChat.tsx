"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useStore } from "react-redux";
import { RootState } from "@/store/store";
import { socketService } from "@/services/socketService";
import { socketTokenRefresher } from "@/services/socketTokenRefresh";
import { ChatList } from "./ChatList";
import ChatBox from "./ChatBox";
import {
  useFindOrCreateConversationMutation,
  type ChatConversationParticipant,
  type ParticipantType,
  type ConversationType,
} from "@/features/chatApi";
import { X, Loader2 } from "lucide-react";

interface UnifiedChatProps {
  layout: "popup" | "fullscreen";
  role: "VENDOR" | "ADMIN" | "USER" | "EMPLOYEE" | "DELIVERY";
  currentVendorId?: string;
  accessToken: string;
  conversationType?: ConversationType;   // ✅ যোগ করো, default "PRODUCT_INQUIRY"
  productId?: string;
  orderId?: string;                       // DELIVERY_CHAT-এর জন্যও লাগবে ভবিষ্যতে
  otherParticipant?: { id: string; type: ParticipantType; displayName: string; displayImage?: string | null };
  initialConversation?: ChatConversationParticipant;
  onClose?: () => void;
}

// Build the exact ChatConversationParticipant shape the rest of the UI expects.
// CRITICAL: extracts the participant-row id (not conversation id) so reactions
// and read receipts work correctly.
function buildParticipantShape(
  conv: any,
  otherParticipant: UnifiedChatProps["otherParticipant"],
  currentUserId: string,
  role: string,
  currentVendorId?: string
): ChatConversationParticipant {
  const myParticipant = conv.participants?.find((p: any) => {
    if (role === "USER") return p.userId === currentUserId;
    if (role === "VENDOR") return p.vendorId === currentVendorId;
    if (role === "EMPLOYEE" || role === "ADMIN")
      return p.employeeId === currentUserId;
    if (role === "DELIVERY") return p.deliveryPersonId === currentUserId;
    return false;
  });

  return {
    id: myParticipant?.id ?? conv.id,
    unreadCount: myParticipant?.unreadCount ?? 0,
    isPinned: myParticipant?.isPinned ?? false,
    lastReadMessageId: myParticipant?.lastReadMessageId ?? null,
    userId: myParticipant?.userId ?? null,
    vendorId: myParticipant?.vendorId ?? null,
    employeeId: myParticipant?.employeeId ?? null,
    deliveryPersonId: myParticipant?.deliveryPersonId ?? null,
    otherParticipant: otherParticipant
      ? {
          id: otherParticipant.id,
          participantType: otherParticipant.type,
          displayName: otherParticipant.displayName,
          displayImage: otherParticipant.displayImage ?? null,
        }
      : null,
    conversation: {
      id: conv.id,
      type: conv.type,
      status: conv.status,
      title: conv.title,
      lastMessageAt: conv.lastMessageAt,
      lastMessageText: conv.lastMessageText,
      lastMessageType: conv.lastMessageType,
      lastSenderId: conv.lastSenderId,
      lastSenderType: conv.lastSenderType,
      priority: conv.priority,
    },
  };
}

export default function UnifiedChat({
  layout,
  role,
  currentVendorId,
  accessToken,
  conversationType,
  productId,
  orderId,
  otherParticipant,
  initialConversation,
  onClose,
}: UnifiedChatProps) {
  const user = useSelector((s: RootState) => s.auth.user);
  const store = useStore();

  // ── Socket connect (singleton-safe) ──
  useEffect(() => {
    // Phase 1: the socket follows the auth state — refreshed tokens are used
    // on reconnect; logout / account switch tear it down (idempotent).
    socketService.bindAuth(store, socketTokenRefresher(store)); // Phase 2: idle sessions refresh on a refused handshake
    if (!accessToken || !user?.id) return;
    const participantId = role === "VENDOR" ? currentVendorId : user.id;
    if (!participantId) return;

    if (!socketService.isConnected()) {
      socketService.connect({
        token: accessToken,
        participantId,
        participantType: role === "USER" ? "CUSTOMER" : role,
      });
    }
  }, [store, accessToken, user?.id, role, currentVendorId]);

  // ── Auto-resolve conversation for product page popup ──
  const [findOrCreate, { isLoading: resolving }] =
    useFindOrCreateConversationMutation();
  const [autoConv, setAutoConv] =
    useState<ChatConversationParticipant | null>(null);

  // components/chatbox/UnifiedChat.tsx
// useEffect এর মধ্যে findOrCreate call — productId বাদ দিন
useEffect(() => {
  if (initialConversation) { setAutoConv(initialConversation); return; }
  if (!otherParticipant || !user?.id) return;

  let cancelled = false;
  setAutoConv(null);

  findOrCreate({
    type: conversationType ?? "PRODUCT_INQUIRY",   
    otherParticipant,
    productId,
    orderId,
  })
    .unwrap()
    .then((res) => { if (!cancelled) setAutoConv(buildParticipantShape(res.data, otherParticipant, user.id, role, currentVendorId)); })
    .catch((err) => { if (!cancelled) console.error("Failed to resolve conversation:", err); });

  return () => { cancelled = true; };
}, [initialConversation, otherParticipant?.id, conversationType, productId, orderId, user?.id, role, currentVendorId, findOrCreate]);

  // ── Selection state ──
  const [selectedConv, setSelectedConv] =
    useState<ChatConversationParticipant | null>(null);
  const [view, setView] = useState<"list" | "thread">(
    productId ? "thread" : "list"
  );
  const [showMobileChat, setShowMobileChat] = useState(false);

  const activeConv = autoConv || selectedConv;

  const handleSelect = useCallback((conv: ChatConversationParticipant) => {
    setSelectedConv(conv);
    setView("thread");
    setShowMobileChat(true);
    socketService.joinConversation(conv.conversation.id);
  }, []);

  const handleBackFromThread = useCallback(() => {
    setView("list");
    setSelectedConv(null);
    setShowMobileChat(false);
  }, []);

  // ── Popup Layout ──
  if (layout === "popup") {
    return (
      <div className="w-96 h-[500px] bg-white shadow-lg rounded-2xl flex flex-col overflow-hidden border border-gray-100 relative">
        {/* Close button */}
        {onClose && (
          <button
            type="button"
            aria-label="Close chat"
            onClick={onClose}
            className="absolute top-3 right-3 z-30 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Loading overlay */}
        {resolving && (
          <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            <p className="text-xs text-gray-400">Starting conversation…</p>
          </div>
        )}

        {/* List View */}
        <div
          className={`absolute inset-0 z-10 transition-transform duration-300 ease-in-out flex flex-col ${
            view === "list" ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <ChatList
            role={role}
            currentVendorId={currentVendorId}
            selectedConversationId={activeConv?.conversation.id}
            onSelectConversation={handleSelect}
          />
        </div>

        {/* Thread View */}
        <div
          className={`absolute inset-0 z-10 transition-transform duration-300 ease-in-out flex flex-col ${
            view === "thread" ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {activeConv ? (
            <ChatBox
              conversation={activeConv}
              role={role}
              currentVendorId={currentVendorId}
              onClose={handleBackFromThread}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
              <p className="text-sm">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Fullscreen Layout ──
  return (
    <div
      className="flex rounded-2xl overflow-hidden border border-gray-100"
      style={{
        height: "calc(100vh - 48px)",
        margin: "-12px -16px",
        background: "#f5f5ff",
        boxShadow: "0 8px 30px rgba(79,70,229,0.12)",
      }}
    >
      {/* Sidebar */}
      <div
        className="chat-list-sidebar"
        style={{
          width: 380,
          minWidth: 380,
          maxWidth: 380,
          background: "#ffffff",
          borderRight: "1px solid #f1f5f9",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transform: showMobileChat ? "translateX(-100%)" : "none",
          transition: "transform 0.25s ease",
        }}
      >
        <ChatList
          role={role}
          currentVendorId={currentVendorId}
          selectedConversationId={activeConv?.conversation.id}
          onSelectConversation={handleSelect}
        />
      </div>

      {/* Main Area */}
      <div
        className="chat-main-area"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          minWidth: 0,
          transform: showMobileChat ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
          position: "relative",
        }}
      >
        {activeConv ? (
          <ChatBox
            conversation={activeConv}
            role={role}
            currentVendorId={currentVendorId}
            onClose={handleBackFromThread}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .chat-list-sidebar {
            position: absolute;
            inset: 0;
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            z-index: 10;
          }
          .chat-main-area {
            position: absolute;
            inset: 0;
            z-index: 15;
          }
        }
        @media (min-width: 769px) {
          .chat-list-sidebar,
          .chat-main-area {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        color: "#94a3b8",
      }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#c7d2fe"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: 20 }}
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: "#0f172a",
          marginBottom: 6,
        }}
      >
        Your Messages
      </div>
      <div
        style={{
          fontSize: 13,
          textAlign: "center",
          maxWidth: 300,
          lineHeight: 1.6,
        }}
      >
        Select a conversation from the left to start chatting.
      </div>
    </div>
  );
}