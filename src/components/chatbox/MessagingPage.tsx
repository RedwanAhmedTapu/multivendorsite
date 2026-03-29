"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkAsReadMutation,
  chatApi,
  type Conversation,
  type Message,
} from "@/features/chatApi";
import { useDispatch, useSelector } from "react-redux";
import {
  setActiveConversation,
  addTypingUser,
  removeTypingUser,
  setOnlineUsers,
} from "@/features/chatSlice";
import { socketService } from "@/services/socketService";
import type { RootState } from "@/store/store";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type DashboardRole = "USER" | "VENDOR" | "ADMIN";

interface MessagingPageProps {
  role?: DashboardRole;
  initialConversationId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(dateStr: string) {
  const d   = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-BD", { day: "2-digit", month: "short" });
}

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-BD", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getParticipantInfo(
  conv: Conversation,
  role: DashboardRole,
  currentUserId?: string,
  currentVendorId?: string,
  currentEmployeeId?: string
): { name: string; avatarLetter: string; subtitle?: string; participantId?: string } {
  const others = conv.participants.filter((p) => {
    if (role === "USER")
      return p.participantType !== "CUSTOMER" || p.userId !== currentUserId;
    if (role === "VENDOR")
      return p.participantType !== "VENDOR" || p.vendorId !== currentVendorId;
    return p.employeeId !== currentEmployeeId;
  });

  const other = others[0];
  if (!other) return { name: conv.title ?? "Unknown", avatarLetter: "?" };

  if (other.vendor)
    return {
      name: other.vendor.storeName,
      avatarLetter: other.vendor.storeName.charAt(0).toUpperCase(),
      subtitle: "Vendor",
      participantId: other.vendorId,
    };
  if (other.user)
    return {
      name: other.user.name,
      avatarLetter: other.user.name.charAt(0).toUpperCase(),
      subtitle: "Customer",
      participantId: other.userId,
    };
  if (other.employee)
    return {
      name: `Support (${other.employee.designation})`,
      avatarLetter: "S",
      subtitle: "Admin",
      participantId: other.employeeId,
    };
  if (other.deliveryPerson)
    return {
      name: other.deliveryPerson.name,
      avatarLetter: other.deliveryPerson.name.charAt(0).toUpperCase(),
      subtitle: "Delivery",
      participantId: other.deliveryPersonId,
    };
  return { name: conv.title ?? "Conversation", avatarLetter: "#" };
}

function isMyMessage(
  msg: Message,
  role: DashboardRole,
  currentUserId?: string,
  currentVendorId?: string,
  currentEmployeeId?: string
) {
  if (role === "USER")
    return msg.senderType === "CUSTOMER" && msg.senderId === currentUserId;
  if (role === "VENDOR")
    return msg.senderType === "VENDOR" && msg.senderVendorId === currentVendorId;
  if (role === "ADMIN")
    return msg.senderType === "EMPLOYEE" && msg.senderEmployeeId === currentEmployeeId;
  return false;
}

function getSenderName(msg: Message): string {
  if (msg.senderUser)     return msg.senderUser.name;
  if (msg.senderVendor)   return msg.senderVendor.storeName;
  if (msg.senderEmployee) return "Support";
  if (msg.senderDelivery) return msg.senderDelivery.name;
  return "Unknown";
}

function getSenderLetter(msg: Message) {
  return getSenderName(msg).charAt(0).toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({
  letter, size = "md", color = "blue", online, className,
}: {
  letter: string;
  size?: "sm" | "md" | "lg";
  color?: "blue" | "slate" | "emerald" | "amber";
  online?: boolean;
  className?: string;
}) {
  const sizes  = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  const colors = {
    blue:    "bg-[#0052cc] text-white",
    slate:   "bg-slate-600 text-white",
    emerald: "bg-emerald-600 text-white",
    amber:   "bg-amber-500 text-white",
  };
  return (
    <div className={cn("relative shrink-0", className)}>
      <div className={cn("rounded-full flex items-center justify-center font-bold", sizes[size], colors[color])}>
        {letter}
      </div>
      {online !== undefined && (
        <span className={cn(
          "absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-slate-900",
          size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5",
          online ? "bg-emerald-400" : "bg-slate-400"
        )}/>
      )}
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-2.5">
      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0"/>
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]"/>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]"/>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]"/>
      </div>
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
      <div className="w-20 h-20 rounded-2xl bg-[#e8f0fe] dark:bg-[#0052cc]/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-[#0052cc]">forum</span>
      </div>
      <div>
        <p className="font-semibold text-slate-700 dark:text-slate-200 text-lg">Select a conversation</p>
        <p className="text-sm text-slate-400 mt-1">Choose from the list to start messaging</p>
      </div>
    </div>
  );
}

function ConvItem({
  conv, active, role, currentUserId, currentVendorId, currentEmployeeId, onlineUsers, onClick,
}: {
  conv: Conversation; active: boolean; role: DashboardRole;
  currentUserId?: string; currentVendorId?: string; currentEmployeeId?: string;
  onlineUsers: string[]; onClick: () => void;
}) {
  const info     = getParticipantInfo(conv, role, currentUserId, currentVendorId, currentEmployeeId);
  const isOnline = info.participantId ? onlineUsers.includes(info.participantId) : false;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all border-b border-slate-100 dark:border-slate-800/60 border-l-2",
        active
          ? "bg-[#e8f0fe] dark:bg-[#0052cc]/15 border-l-[#0052cc]"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-transparent"
      )}
    >
      <Avatar
        letter={info.avatarLetter}
        size="md"
        color={info.subtitle === "Vendor" ? "emerald" : info.subtitle === "Admin" ? "slate" : "blue"}
        online={isOnline}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className={cn("text-sm truncate", active ? "font-bold text-[#0052cc]" : "font-semibold text-slate-900 dark:text-white")}>
            {info.name}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {conv.lastMessageAt && (
              <span className="text-[10px] text-slate-400">{formatTime(conv.lastMessageAt)}</span>
            )}
            {conv.unreadCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 bg-[#0052cc] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className="text-xs text-slate-400 truncate">{conv.lastMessageText ?? "No messages yet"}</p>
          {info.subtitle && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0 font-medium">
              {info.subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, mine }: { msg: Message; mine: boolean }) {
  return (
    <div className={cn("flex gap-2.5 group", mine ? "flex-row-reverse" : "flex-row")}>
      {!mine && (
        <Avatar
          letter={getSenderLetter(msg)}
          size="sm"
          color={msg.senderType === "VENDOR" ? "emerald" : msg.senderType === "EMPLOYEE" ? "slate" : "blue"}
          className="mt-auto mb-1"
        />
      )}
      <div className={cn("max-w-[72%] flex flex-col gap-1", mine ? "items-end" : "items-start")}>
        {!mine && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-1">
            {getSenderName(msg)}
          </span>
        )}
        <div className={cn(
          "px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          mine
            ? "bg-[#0052cc] text-white rounded-2xl rounded-tr-sm"
            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-700"
        )}>
          {msg.content}
        </div>
        <span className="text-[10px] text-slate-400 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatMessageTime(msg.createdAt)}
          {mine && (
            <span className="ml-1">
              {msg.status === "SEEN" ? "✓✓" : msg.status === "DELIVERED" ? "✓✓" : "✓"}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"/>
      <span className="text-[11px] font-medium text-slate-400 px-2">
        {new Date(date).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
      </span>
      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"/>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MessagingPage({
  role: roleProp,
  initialConversationId,
}: MessagingPageProps) {
  const dispatch = useDispatch();

  // ── Read everything we need directly from Redux ───────────────────────────
  // This is the key fix: previously the parent had to pass accessToken,
  // currentUserId, currentVendorId, etc. as props. If any were missing or
  // mismatched the socket would authenticate but identify/filter incorrectly.
  const authUser    = useSelector((s: RootState) => s.auth.user);
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);

  // Derive role from Redux if not explicitly passed as prop
  const role: DashboardRole = (roleProp ?? authUser?.role ?? "USER") as DashboardRole;

  // Derive participant IDs from the auth user object
  const currentUserId      = authUser?.role === "USER"     || authUser?.role === "CUSTOMER"
    ? String(authUser.id)   : undefined;
  const currentVendorId    = (authUser?.role === "VENDOR" || authUser?.role === "VENDOR_ADMIN")
    ? authUser.vendorId     : undefined;
  const currentEmployeeId  = (authUser?.role === "ADMIN"  || authUser?.role === "EMPLOYEE")
    ? String(authUser.id)   : undefined;

  const activeConversationId = useSelector((s: RootState) => s.chat.activeConversation);
  const typingUsers          = useSelector((s: RootState) => s.chat.typingUsers);
  const onlineUsers          = useSelector((s: RootState) => s.chat.onlineUsers);

  const [searchQuery, setSearchQuery] = useState("");
  const [input,       setInput]       = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [socketReady, setSocketReady] = useState(false);

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const inputRef        = useRef<HTMLInputElement>(null);
  const typingTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevConvRef     = useRef<string | null>(null);

  // Stable ref so socket handlers always see the current active conversation
  const activeConvIdRef = useRef<string | null>(activeConversationId);
  useEffect(() => { activeConvIdRef.current = activeConversationId; }, [activeConversationId]);

  // ── API ───────────────────────────────────────────────────────────────────

  const { data: convsData, isLoading: convsLoading } = useGetConversationsQuery({ page: 1, limit: 30 });

  const { data: messagesData, isLoading: msgsLoading } = useGetMessagesQuery(
    { conversationId: activeConversationId!, page: 1, limit: 50 },
    { skip: !activeConversationId }
  );

  const [sendMessageMutation, { isLoading: sending }] = useSendMessageMutation();
  const [markAsRead]                                   = useMarkAsReadMutation();

  // ── Auto-select first conversation ────────────────────────────────────────
  useEffect(() => {
    if (!convsData?.data?.length) return;
    if (initialConversationId) {
      dispatch(setActiveConversation(initialConversationId));
      return;
    }
    if ((role === "VENDOR" || role === "ADMIN") && !activeConversationId) {
      dispatch(setActiveConversation(convsData.data[0].id));
    }
  }, [convsData?.data?.length, initialConversationId]);

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;

    socketService.initialize(dispatch);
    socketService.connect(accessToken);
    setSocketReady(true);

    const onNewMessage = (message: Message) => {
      dispatch(
        chatApi.util.updateQueryData(
          "getMessages",
          { conversationId: message.conversationId, page: 1, limit: 50 },
          (draft) => {
            const exists = draft.data.some((m) => m.id === message.id);
            if (!exists) draft.data.unshift(message);
          }
        ) as any
      );

      dispatch(
        chatApi.util.updateQueryData(
          "getConversations",
          { page: 1, limit: 30 },
          (draft) => {
            const conv = draft.data.find((c) => c.id === message.conversationId);
            if (conv) {
              conv.lastMessageText = message.content;
              conv.lastMessageAt   = message.createdAt;
              if (message.conversationId !== activeConvIdRef.current) {
                conv.unreadCount = (conv.unreadCount ?? 0) + 1;
              }
            }
          }
        ) as any
      );
    };

    const onNewConversationMessage = ({
      conversationId, lastMessageText, lastMessageAt,
    }: { conversationId: string; lastMessageText: string; lastMessageAt: string; senderId: string }) => {
      dispatch(
        chatApi.util.updateQueryData(
          "getConversations",
          { page: 1, limit: 30 },
          (draft) => {
            const conv = draft.data.find((c) => c.id === conversationId);
            if (conv) {
              conv.lastMessageText = lastMessageText;
              conv.lastMessageAt   = lastMessageAt;
              if (conversationId !== activeConvIdRef.current) {
                conv.unreadCount = (conv.unreadCount ?? 0) + 1;
              }
            } else {
              dispatch(chatApi.util.invalidateTags([{ type: "Conversation" as const }]));
            }
          }
        ) as any
      );
    };

    const onUserOnline  = ({ userId }: { userId: string }) =>
      dispatch(setOnlineUsers([...onlineUsers, userId]));
    const onUserOffline = ({ userId }: { userId: string }) =>
      dispatch(setOnlineUsers(onlineUsers.filter((id) => id !== userId)));
    const onOnlineUsers = ({ userIds }: { userIds: string[] }) =>
      dispatch(setOnlineUsers(userIds));

    const onTyping = ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      dispatch(addTypingUser({ conversationId, userId }));
    const onStopTyping = ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      dispatch(removeTypingUser({ conversationId, userId }));

    const onMessageDelivered = ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      dispatch(
        chatApi.util.updateQueryData(
          "getMessages",
          { conversationId, page: 1, limit: 50 },
          (draft) => {
            const msg = draft.data.find((m) => m.id === messageId);
            if (msg) (msg as any).status = "DELIVERED";
          }
        )
      );
    };

    const onMessageSeen = ({ conversationId }: { conversationId: string; seenBy: any; seenAt: string }) => {
      dispatch(
        chatApi.util.updateQueryData(
          "getMessages",
          { conversationId, page: 1, limit: 50 },
          (draft) => { draft.data.forEach((msg) => { (msg as any).status = "SEEN"; }); }
        )
      );
    };

    socketService.on("new_message",              onNewMessage);
    socketService.on("new_conversation_message", onNewConversationMessage);
    socketService.on("user_online",              onUserOnline);
    socketService.on("user_offline",             onUserOffline);
    socketService.on("online_users",             onOnlineUsers);
    socketService.on("user_typing",              onTyping);
    socketService.on("user_stop_typing",         onStopTyping);
    socketService.on("message_delivered",        onMessageDelivered);
    socketService.on("message_seen",             onMessageSeen);

    return () => {
      socketService.off("new_message",              onNewMessage);
      socketService.off("new_conversation_message", onNewConversationMessage);
      socketService.off("user_online",              onUserOnline);
      socketService.off("user_offline",             onUserOffline);
      socketService.off("online_users",             onOnlineUsers);
      socketService.off("user_typing",              onTyping);
      socketService.off("user_stop_typing",         onStopTyping);
      socketService.off("message_delivered",        onMessageDelivered);
      socketService.off("message_seen",             onMessageSeen);
    };
  }, [accessToken, dispatch]);

  // ── Auto-join all known rooms ──────────────────────────────────────────────
  const allConvs = convsData?.data ?? [];
  useEffect(() => {
    if (!socketReady || !allConvs.length) return;
    allConvs.forEach((conv) => socketService.joinConversation(conv.id));
  }, [socketReady, allConvs.length]);

  // ── Join / leave active room ───────────────────────────────────────────────
  useEffect(() => {
    if (!socketReady) return;
    if (prevConvRef.current && prevConvRef.current !== activeConversationId) {
      socketService.leaveConversation(prevConvRef.current);
    }
    if (activeConversationId) {
      socketService.joinConversation(activeConversationId);
      socketService.markRead(activeConversationId);
      markAsRead({ conversationId: activeConversationId });

      dispatch(
        chatApi.util.updateQueryData(
          "getConversations",
          { page: 1, limit: 30 },
          (draft) => {
            const conv = draft.data.find((c) => c.id === activeConversationId);
            if (conv) conv.unreadCount = 0;
          }
        ) as any
      );

      prevConvRef.current = activeConversationId;
    }
  }, [activeConversationId, socketReady]);

  // ── Scroll to bottom on new messages ──────────────────────────────────────
  const messages: Message[] = [...(messagesData?.data ?? [])].reverse();
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const filteredConvs = allConvs.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const info = getParticipantInfo(conv, role, currentUserId, currentVendorId, currentEmployeeId);
    return info.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activeConv             = allConvs.find((c) => c.id === activeConversationId) ?? null;
  const activeParticipantInfo  = activeConv
    ? getParticipantInfo(activeConv, role, currentUserId, currentVendorId, currentEmployeeId)
    : null;

  const isOtherTyping = activeConversationId
    ? (typingUsers[activeConversationId] ?? []).length > 0
    : false;

  const isOtherOnline = activeParticipantInfo?.participantId
    ? onlineUsers.includes(activeParticipantInfo.participantId)
    : false;

  const messageGroups: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const key  = new Date(msg.createdAt).toDateString();
    const last = messageGroups[messageGroups.length - 1];
    if (!last || last.date !== key) messageGroups.push({ date: msg.createdAt, messages: [msg] });
    else last.messages.push(msg);
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectConv = useCallback((conv: Conversation) => {
    dispatch(setActiveConversation(conv.id));
    inputRef.current?.focus();
  }, [dispatch]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !activeConversationId || sending) return;
    const content = input.trim();
    setInput("");
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    socketService.stopTyping(activeConversationId);
    try {
      await sendMessageMutation({ conversationId: activeConversationId, content }).unwrap();
    } catch {
      setInput(content);
    }
  }, [input, activeConversationId, sending, sendMessageMutation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!activeConversationId) return;
    socketService.startTyping(activeConversationId);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => socketService.stopTyping(activeConversationId), 2000);
  };

  const totalUnread = allConvs.reduce((sum, c) => sum + c.unreadCount, 0);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Messages</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {role === "USER"   && "Chat with vendors about your orders"}
            {role === "VENDOR" && "Respond to customer inquiries"}
            {role === "ADMIN"  && "Monitor & participate in conversations"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            socketReady && socketService.isConnected()
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
              : "bg-slate-100 dark:bg-slate-800 text-slate-400"
          )}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              socketReady && socketService.isConnected() ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
            )}/>
            {socketReady && socketService.isConnected() ? "Live" : "Connecting…"}
          </span>
          {totalUnread > 0 && (
            <span className="px-3 py-1 bg-[#0052cc] text-white text-sm font-semibold rounded-full shadow-sm">
              {totalUnread} unread
            </span>
          )}
        </div>
      </div>

      {/* Main container */}
      <div className="flex-1 flex rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm min-h-0">
        {/* Sidebar */}
        <aside className={cn(
          "flex flex-col border-r border-slate-100 dark:border-slate-800 transition-all duration-300 shrink-0",
          sidebarOpen ? "w-[300px]" : "w-0 overflow-hidden"
        )}>
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations…"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc]/25 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-[#0052cc] border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-center px-4">
                <span className="material-symbols-outlined text-3xl text-slate-300">chat_bubble_outline</span>
                <p className="text-sm text-slate-400">No conversations yet</p>
              </div>
            ) : (
              filteredConvs.map((conv) => (
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  active={conv.id === activeConversationId}
                  role={role}
                  currentUserId={currentUserId}
                  currentVendorId={currentVendorId}
                  currentEmployeeId={currentEmployeeId}
                  onlineUsers={onlineUsers}
                  onClick={() => handleSelectConv(conv)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeConv ? (
            <EmptyChat />
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <button
                  onClick={() => setSidebarOpen((v) => !v)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
                >
                  <span className="material-symbols-outlined text-xl">menu</span>
                </button>

                <Avatar
                  letter={activeParticipantInfo!.avatarLetter}
                  size="md"
                  color={activeParticipantInfo!.subtitle === "Vendor" ? "emerald" : activeParticipantInfo!.subtitle === "Admin" ? "slate" : "blue"}
                  online={isOtherOnline}
                />

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{activeParticipantInfo!.name}</p>
                  <p className={cn(
                    "text-xs font-medium transition-all",
                    isOtherTyping ? "text-[#0052cc]" : isOtherOnline ? "text-emerald-500" : "text-slate-400"
                  )}>
                    {isOtherTyping
                      ? "typing…"
                      : isOtherOnline
                      ? `${activeParticipantInfo!.subtitle ?? ""} · Online`
                      : `${activeParticipantInfo!.subtitle ?? ""} · Offline`}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {activeConv.orderId && (
                    <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">
                      <span className="material-symbols-outlined text-[14px]">receipt</span>
                      Order #{activeConv.orderId}
                    </span>
                  )}
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-xl">more_vert</span>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-1 bg-slate-50/50 dark:bg-slate-950/30">
                {msgsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-6 h-6 border-2 border-[#0052cc] border-t-transparent rounded-full animate-spin"/>
                  </div>
                ) : messageGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <span className="material-symbols-outlined text-4xl text-slate-300">chat</span>
                    <p className="text-sm text-slate-400">No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  messageGroups.map((group, gi) => (
                    <div key={gi}>
                      <DateDivider date={group.date} />
                      <div className="space-y-3">
                        {group.messages.map((msg) => (
                          <MessageBubble
                            key={msg.id}
                            msg={msg}
                            mine={isMyMessage(msg, role, currentUserId, currentVendorId, currentEmployeeId)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
                {isOtherTyping && <div className="pt-1"><TypingBubble /></div>}
                <div ref={messagesEndRef}/>
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-400 hover:text-[#0052cc] transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    <span className="material-symbols-outlined text-xl">attach_file</span>
                  </button>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message…"
                    disabled={sending}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc]/25 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-60 transition-all"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                      input.trim() && !sending
                        ? "bg-[#0052cc] hover:bg-[#003d99] text-white hover:scale-105"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed"
                    )}
                  >
                    {sending
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                      : <span className="material-symbols-outlined text-[18px]">send</span>}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 text-center select-none">
                  Press Enter to send · Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}