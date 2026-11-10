// components/chatbox/ChatBox.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSelector, useStore } from "react-redux";
import { RootState } from "@/store/store";
import {
  useLazyGetMessagesQuery,
  useSendMessageMutation,
  useToggleMessageReactionMutation,
  useMarkAsReadMutation,
  useUploadChatImageMutation,
  useUploadChatAudioMutation,
  useDeleteMessageMutation,
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  type ChatConversationParticipant,
  type ChatMessage,
  type ParticipantType,
} from "@/features/chatApi";
import { socketService } from "@/services/socketService";
import { socketTokenRefresher } from "@/services/socketTokenRefresh";
import { toast } from "sonner";
import {
  ArrowLeft, MoreVertical, Send, Image, Mic,
  Bell, BellOff, Volume2, VolumeX, Check, CheckCheck, Sparkles, SmilePlus,
  Square, X, Trash2, Zap, WifiOff, AlertTriangle, RefreshCw,
} from "lucide-react";
import { useChatConnection, CONNECTION_COPY } from "./useChatConnection";
import { QuickReplyPicker } from "./QuickReplyPicker";
import { conversationTypeLabel, senderTypeLabel } from "@/lib/chat/chat-settings";
import { AGENT_CHAT_UI_ENABLED, AgentChatNotice, isAgentConversation } from "@/lib/agent-chat-ui";

interface ChatBoxProps {
  conversation: ChatConversationParticipant;
  role: "VENDOR" | "ADMIN" | "USER" | "EMPLOYEE" | "DELIVERY";
  currentVendorId?: string;
  onClose: () => void;
  /** Admin inbox: the staff member's Employee id from /auth/me, so their own messages are recognised. */
  myEmployeeId?: string | null;
  /** Admin inbox: hide the composer (read-only moderation of agent↔vendor conversations). */
  readOnly?: boolean;
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

/* ============================================================
   HELPERS
   ============================================================ */

function getChatMediaUrl(
  messageId: string,
  relativePath?: string | null
): string | null {
  if (!relativePath) return null;

  if (
    relativePath.startsWith("http://") ||
    relativePath.startsWith("https://") ||
    relativePath.startsWith("blob:") ||
    relativePath.startsWith("data:")
  ) {
    return relativePath;
  }

  const domain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN?.replace(/\/$/, "");
  if (!domain) return relativePath;

  const base = `chat/media/${messageId.slice(0, 2)}/${messageId}`;
  const path = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return `${domain}/${base}${path}`;
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getAvatarColor(name: string): string {
  const colors = [
    "#4f46e5", "#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function roleToParticipantType(role: ChatBoxProps["role"]): ParticipantType {
  if (role === "USER") return "CUSTOMER";
  return role as ParticipantType;
}

function normalizeMessage(msg: ChatMessage): ChatMessage {
  return { ...msg, reactions: msg.reactions ?? [] };
}

const IMAGE_BOX = {
  minWidth: 160,
  maxWidth: 280,
  minHeight: 140,
  maxHeight: 320,
};

function getImageAspectRatio(width?: number | null, height?: number | null): number {
  if (!width || !height || width <= 0 || height <= 0) return 4 / 3;
  const ratio = width / height;
  const MIN_RATIO = 0.6;
  const MAX_RATIO = 1.8;
  return Math.min(Math.max(ratio, MIN_RATIO), MAX_RATIO);
}

/* ============================================================
   NOTIFICATION SOUND (Web Audio API — no external asset needed)
   Produces a short two-tone "pop" similar to Messenger's incoming ping.
   ============================================================ */

function playTone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  volume: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

/* ============================================================
   COMPONENT
   ============================================================ */

const ChatBox: React.FC<ChatBoxProps> = ({
  conversation,
  role,
  currentVendorId,
  onClose,
  myEmployeeId,
  readOnly,
}) => {
  const user = useSelector((s: RootState) => s.auth.user);
  const token = useSelector((s: RootState) => s.auth.accessToken);
  const store = useStore();

  const chatId = conversation.conversation.id;
  const chatTitle =
    conversation.otherParticipant?.displayName ||
    conversation.conversation.title ||
    "Unknown Chat";
  const chatAvatarImage = conversation.otherParticipant?.displayImage || null;
  const initials = getInitials(chatTitle);
  const color = getAvatarColor(chatTitle);
  const myParticipantId = conversation.id;

  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [deleteConfirmFor, setDeleteConfirmFor] = useState<string | null>(null);
  // Redesign: load-failure state (with retry) and the composer's quick-reply picker.
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const connection = useChatConnection();
  const counterpartType = conversation.otherParticipant?.participantType ?? null;
  const conversationLabel = conversationTypeLabel(conversation.conversation.type);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastReadMessageIdRef = useRef<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isCancelledRef = useRef(false);

  // Notification sound engine ref (reused AudioContext)
  const audioCtxRef = useRef<AudioContext | null>(null);
  // Skip playing sound for the very first batch loaded on mount
  const hasLoadedOnceRef = useRef(false);

  const [fetchMessages, { isFetching: msgsFetching }] = useLazyGetMessagesQuery();
  const [sendMessageApi, { isLoading: sending }] = useSendMessageMutation();
  const [toggleReactionApi] = useToggleMessageReactionMutation();
  const [markAsReadApi] = useMarkAsReadMutation();
  const [uploadImage] = useUploadChatImageMutation();
  const [uploadAudio] = useUploadChatAudioMutation();
  const [deleteMessageApi] = useDeleteMessageMutation();

  // ── Notification settings ──
  const { data: notifSettingsRes } = useGetNotificationSettingsQuery();
  const [updateNotifSettings] = useUpdateNotificationSettingsMutation();
  const notificationsEnabled = notifSettingsRes?.data?.isEnabled ?? true;
  const soundEnabled = notifSettingsRes?.data?.soundEnabled ?? true;

  const playNotificationSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtxClass =
          window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtxClass) return;
        audioCtxRef.current = new AudioCtxClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      // Messenger-style two-tone pop: quick rising ping
      playTone(ctx, 740, now, 0.1, 0.14);
      playTone(ctx, 1046, now + 0.08, 0.12, 0.13);
    } catch {
      // Ignore — sound is a nice-to-have, never block the chat on it
    }
  }, []);

  const handleToggleNotifications = useCallback(async () => {
    try {
      await updateNotifSettings({ isEnabled: !notificationsEnabled }).unwrap();
    } catch {
      toast.error("Failed to update notification settings");
    }
  }, [notificationsEnabled, updateNotifSettings]);

  const handleToggleSound = useCallback(async () => {
    try {
      await updateNotifSettings({ soundEnabled: !soundEnabled }).unwrap();
    } catch {
      toast.error("Failed to update sound settings");
    }
  }, [soundEnabled, updateNotifSettings]);

  const isOwnMessage = useCallback(
    (msg: ChatMessage) => {
      if (myEmployeeId) {
        return (msg.senderType === "ADMIN" || msg.senderType === "EMPLOYEE") && msg.senderEmployeeId === myEmployeeId;
      }
      switch (role) {
        case "USER":
          return msg.senderType === "CUSTOMER" && msg.senderId === user?.id;
        case "VENDOR":
          return (
            msg.senderType === "VENDOR" &&
            msg.senderVendorId === currentVendorId
          );
        case "EMPLOYEE":
          return (
            msg.senderType === "EMPLOYEE" &&
            msg.senderEmployeeId === user?.id
          );
        case "ADMIN":
          return (
            msg.senderType === "ADMIN" &&
            (msg.senderEmployeeId === user?.id || msg.senderId === user?.id)
          );
        case "DELIVERY":
          return (
            msg.senderType === "DELIVERY" &&
            msg.senderDeliveryPersonId === user?.id
          );
        default:
          return false;
      }
    },
    [role, user?.id, currentVendorId, myEmployeeId]
  );

  const markConversationRead = useCallback(
    (messageId: string) => {
      if (lastReadMessageIdRef.current === messageId) return;
      lastReadMessageIdRef.current = messageId;
      socketService.markMessageSeen(chatId, messageId);
      markAsReadApi({ conversationId: chatId, messageId }).catch(() => {});
    },
    [chatId, markAsReadApi]
  );

  // Fetch messages
  useEffect(() => {
    if (!chatId) return;
    setMessages([]);
    setLoadError(false);
    lastReadMessageIdRef.current = null;
    hasLoadedOnceRef.current = false;
    fetchMessages({ conversationId: chatId, limit: 50 })
      .unwrap()
      .then((res) => {
        try {
          const sorted = [...res.data].reverse().map(normalizeMessage);
          setMessages(sorted);
          const lastIncoming = [...sorted]
            .reverse()
            .find((m) => !isOwnMessage(m));
          if (lastIncoming) markConversationRead(lastIncoming.id);
        } catch (err) {
          console.error("Failed to process fetched messages:", err);
        } finally {
          // Mark initial load complete so future socket messages can play sound
          hasLoadedOnceRef.current = true;
        }
      })
      .catch((err) => {
        console.error("Failed to fetch messages:", (err as { status?: unknown })?.status ?? "error");
        setLoadError(true);
        hasLoadedOnceRef.current = true;
      });
    // reloadKey: the "Try again" button re-runs this load
  }, [chatId, fetchMessages, reloadKey]);

  // Socket events
  useEffect(() => {
    socketService.bindAuth(store, socketTokenRefresher(store)); // Phase 1: follow token refresh / logout / account switch (Phase 2: + idle refresh)
    if (!chatId || !token || !user?.id) return;
    if (!socketService.isConnected()) {
      const participantId = role === "VENDOR" ? currentVendorId : user?.id;
      if (participantId) {
        socketService.connect({
          token,
          participantId,
          participantType: roleToParticipantType(role),
        });
      }
    }
    socketService.joinConversation(chatId);

    const handleNewMessage = (rawMsg: ChatMessage) => {
      if (rawMsg.conversationId !== chatId) return;
      const msg = normalizeMessage(rawMsg);

      const isIncoming = !isOwnMessage(msg);

      setMessages((prev) => {
        const optIdx = prev.findIndex(
          (m) =>
            m.status === "SENDING" &&
            ((msg.clientId && m.id === msg.clientId) ||
              (!msg.clientId &&
                m.senderId === msg.senderId &&
                m.content === msg.content))
        );
        if (optIdx !== -1) {
          const updated = [...prev];
          updated[optIdx] = msg;
          return updated.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      if (isIncoming) {
        markConversationRead(msg.id);
        // Only chime for genuinely new incoming messages after initial history load
        if (hasLoadedOnceRef.current && notificationsEnabled && soundEnabled) {
          playNotificationSound();
        }
      }
    };

    const handleDelivered = (data: {
      conversationId: string;
      messageId: string;
    }) => {
      if (data.conversationId !== chatId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId && m.status === "SENT"
            ? { ...m, status: "DELIVERED" as const }
            : m
        )
      );
    };

    const handleRead = (data: {
      conversationId: string;
      messageId: string;
    }) => {
      if (data.conversationId !== chatId) return;
      setMessages((prev) => {
        const target = prev.find((m) => m.id === data.messageId);
        if (!target) return prev;
        const targetTime = new Date(target.createdAt).getTime();
        return prev.map((m) =>
          isOwnMessage(m) && new Date(m.createdAt).getTime() <= targetTime
            ? { ...m, status: "SEEN" as const }
            : m
        );
      });
    };

    const handleReactionUpdate = (data: {
      conversationId: string;
      messageId: string;
      reactions: ChatMessage["reactions"];
    }) => {
      if (data.conversationId !== chatId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, reactions: data.reactions } : m
        )
      );
    };

    const handleMessageDeleted = (data: {
      conversationId: string;
      messageId: string;
    }) => {
      if (data.conversationId !== chatId) return;
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    };

    const handleTypingStart = (data: { userId: string }) => {
      if (data.userId !== user.id) setIsTyping(true);
    };
    const handleTypingStop = (data: { userId: string }) => {
      if (data.userId !== user.id) setIsTyping(false);
    };

    socketService.on("newMessage", handleNewMessage);
    socketService.on("messageDelivered", handleDelivered);
    socketService.on("messageRead", handleRead);
    socketService.on("messageReaction", handleReactionUpdate);
    socketService.on("messageDeleted", handleMessageDeleted);
    socketService.on("typing:start", handleTypingStart);
    socketService.on("typing:stop", handleTypingStop);

    return () => {
      socketService.off("newMessage", handleNewMessage);
      socketService.off("messageDelivered", handleDelivered);
      socketService.off("messageRead", handleRead);
      socketService.off("messageReaction", handleReactionUpdate);
      socketService.off("messageDeleted", handleMessageDeleted);
      socketService.off("typing:start", handleTypingStart);
      socketService.off("typing:stop", handleTypingStop);
      socketService.leaveConversation(chatId);
    };
  }, [
    chatId,
    token,
    user?.id,
    role,
    isOwnMessage,
    markConversationRead,
    notificationsEnabled,
    soundEnabled,
    playNotificationSound,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const handleTypingEmit = useCallback(() => {
    if (!chatId) return;
    socketService.startTyping(chatId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(
      () => socketService.stopTyping(chatId),
      2000
    );
  }, [chatId]);

  const handleInsertQuickReply = useCallback((content: string) => {
    setShowQuickReplies(false);
    setMessageText((prev) => (prev.trim() ? `${prev.replace(/\s+$/, "")} ${content}` : content));
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    });
  }, []);

  // ── TEXT SEND ──
  const handleSend = useCallback(async () => {
    if (!messageText.trim() || !chatId || sending) return;
    const content = messageText.trim();
    const clientId = `client-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const senderType = roleToParticipantType(role);

    const optimistic: ChatMessage = {
      id: clientId,
      conversationId: chatId,
      clientId,
      content,
      messageType: "TEXT",
      status: "SENDING",
      createdAt: new Date().toISOString(),
      replyToId: null,
      quickReplyId: null,
      senderType,
      senderId: role === "USER" ? user?.id ?? null : null,
      senderVendorId: role === "VENDOR" ? currentVendorId ?? null : null,
      senderEmployeeId:
        role === "EMPLOYEE" || role === "ADMIN" ? user?.id ?? null : null,
      senderDeliveryPersonId: role === "DELIVERY" ? user?.id ?? null : null,
      media: null,
      reactions: [],
    };

    setMessages((prev) => [...prev, optimistic]);
    setMessageText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    socketService.stopTyping(chatId);

    try {
      const res = await sendMessageApi({
        conversationId: chatId,
        content,
        clientId,
      }).unwrap();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === clientId
            ? normalizeMessage({ ...res.data, clientId })
            : m
        )
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== clientId));
      setMessageText(content);
      toast.error("Failed to send message");
    }
  }, [
    messageText,
    chatId,
    sending,
    sendMessageApi,
    role,
    user?.id,
    currentVendorId,
  ]);

  // ── IMAGE SEND ──
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;
    e.target.value = "";

    const clientId = `client-img-${Date.now()}`;
    const localUrl = URL.createObjectURL(file);

    const dims = await new Promise<{ width: number; height: number } | null>(
      (resolve) => {
        const img = new window.Image();
        img.onload = () =>
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve(null);
        img.src = localUrl;
      }
    );

    const optimistic: ChatMessage = {
      id: clientId,
      conversationId: chatId,
      clientId,
      content: null,
      messageType: "IMAGE",
      status: "SENDING",
      createdAt: new Date().toISOString(),
      replyToId: null,
      quickReplyId: null,
      senderType: roleToParticipantType(role),
      senderId: role === "USER" ? user?.id ?? null : null,
      senderVendorId: role === "VENDOR" ? currentVendorId ?? null : null,
      senderEmployeeId:
        role === "EMPLOYEE" || role === "ADMIN" ? user?.id ?? null : null,
      senderDeliveryPersonId: role === "DELIVERY" ? user?.id ?? null : null,
      media: {
        url: localUrl,
        thumbnailUrl: localUrl,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
        duration: null,
        blurhash: null,
      },
      reactions: [],
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await sendMessageApi({
        conversationId: chatId,
        messageType: "IMAGE",
        clientId,
      }).unwrap();

      const messageId = res.data.id;
      const uploadRes = await uploadImage({ messageId, file }).unwrap();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === clientId
            ? normalizeMessage({
                ...res.data,
                clientId,
                media: {
                  url: uploadRes.data.url,
                  thumbnailUrl: uploadRes.data.thumbnailUrl,
                  width: uploadRes.data.width,
                  height: uploadRes.data.height,
                  duration: null,
                  blurhash: uploadRes.data.blurhash,
                },
              })
            : m
        )
      );
    } catch (err) {
      console.error("Image send failed:", err);
      setMessages((prev) => prev.filter((m) => m.id !== clientId));
      toast.error("Failed to send image");
    } finally {
      URL.revokeObjectURL(localUrl);
    }
  };

  // ── AUDIO SEND (shared helper) ──
  const sendAudioFile = async (file: File, localPreviewUrl?: string) => {
    if (!chatId) return;
    const clientId = `client-audio-${Date.now()}`;

    const optimistic: ChatMessage = {
      id: clientId,
      conversationId: chatId,
      clientId,
      content: null,
      messageType: "AUDIO",
      status: "SENDING",
      createdAt: new Date().toISOString(),
      replyToId: null,
      quickReplyId: null,
      senderType: roleToParticipantType(role),
      senderId: role === "USER" ? user?.id ?? null : null,
      senderVendorId: role === "VENDOR" ? currentVendorId ?? null : null,
      senderEmployeeId:
        role === "EMPLOYEE" || role === "ADMIN" ? user?.id ?? null : null,
      senderDeliveryPersonId: role === "DELIVERY" ? user?.id ?? null : null,
      media: {
        url: localPreviewUrl || "",
        thumbnailUrl: null,
        width: null,
        height: null,
        duration: null,
        blurhash: null,
      },
      reactions: [],
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await sendMessageApi({
        conversationId: chatId,
        messageType: "AUDIO",
        clientId,
      }).unwrap();

      const messageId = res.data.id;
      const uploadRes = await uploadAudio({ messageId, file }).unwrap();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === clientId
            ? normalizeMessage({
                ...res.data,
                clientId,
                media: {
                  url: uploadRes.data.url,
                  thumbnailUrl: null,
                  width: null,
                  height: null,
                  duration: uploadRes.data.duration,
                  blurhash: null,
                },
              })
            : m
        )
      );
    } catch (err) {
      console.error("Audio send failed:", err);
      setMessages((prev) => prev.filter((m) => m.id !== clientId));
      toast.error("Failed to send audio");
    }
  };

  // ── AUDIO RECORDING ──
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      isCancelledRef.current = false;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (isCancelledRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setIsRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioBlob(null);
      setAudioUrl(null);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access denied:", err);
      toast.error("Microphone access denied");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    isCancelledRef.current = true;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setRecordingTime(0);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  const handleSendRecording = useCallback(async () => {
    if (!audioBlob) return;
    const file = new File([audioBlob], "voice-message.webm", {
      type: audioBlob.type || "audio/webm",
    });
    await sendAudioFile(file, audioUrl || undefined);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingTime(0);
  }, [audioBlob, audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleToggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const currentReactions = m.reactions ?? [];
          const existingIdx = currentReactions.findIndex(
            (r) => r.participantId === myParticipantId
          );
          let reactions;
          if (
            existingIdx !== -1 &&
            currentReactions[existingIdx].reaction === emoji
          ) {
            reactions = currentReactions.filter((_, i) => i !== existingIdx);
          } else if (existingIdx !== -1) {
            reactions = [...currentReactions];
            reactions[existingIdx] = {
              reaction: emoji,
              participantId: myParticipantId,
            };
          } else {
            reactions = [
              ...currentReactions,
              { reaction: emoji, participantId: myParticipantId },
            ];
          }
          return { ...m, reactions };
        })
      );
      setReactionPickerFor(null);

      try {
        await toggleReactionApi({
          messageId,
          participantId: myParticipantId,
          reaction: emoji,
        }).unwrap();
      } catch {
        toast.error("Failed to react");
        fetchMessages({ conversationId: chatId, limit: 50 })
          .unwrap()
          .then((res) =>
            setMessages([...res.data].reverse().map(normalizeMessage))
          )
          .catch(() => {});
      }
    },
    [myParticipantId, toggleReactionApi, fetchMessages, chatId]
  );

  // ── DELETE MESSAGE ──
  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      setDeleteConfirmFor(null);
      const snapshot = messages;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      try {
        await deleteMessageApi(messageId).unwrap();
        toast.success("Message deleted");
      } catch {
        // Roll back on failure
        setMessages(snapshot);
        toast.error("Failed to delete message");
      }
    },
    [messages, deleteMessageApi]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      {/* Header */}
      <div
        style={{
          height: 72,
          minHeight: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          background: "#ffffff",
          borderBottom: "1px solid #f1f5f9",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to conversations"
            className="chat-back-btn"
            style={{
              display: "none",
              padding: 8,
              borderRadius: 10,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#4f46e5",
            }}
          >
            <ArrowLeft size={20} />
          </button>
          {chatAvatarImage ? (
            <img
              src={chatAvatarImage}
              alt={chatTitle}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                objectFit: "cover",
                boxShadow: `0 3px 10px ${color}33`,
                position: "relative",
              }}
            />
          ) : (
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                boxShadow: `0 3px 10px ${color}33`,
                position: "relative",
              }}
            >
              {initials}
            </div>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
              {chatTitle}
            </div>
            <div
              style={{
                fontSize: 11,
                color: isTyping ? "#4f46e5" : "#94a3b8",
                fontWeight: isTyping ? 600 : 500,
                height: 16,
              }}
            >
              {isTyping ? "typing..." : conversationLabel}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {!notificationsEnabled && (
            <div
              title="Notifications muted"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#cbd5e1",
              }}
            >
              <BellOff size={15} />
            </div>
          )}
          <div ref={menuRef} style={{ position: "relative" }}>
            <ActionBtn
              icon={<MoreVertical size={17} />}
              active={showMenu}
              label="Chat options"
              expanded={showMenu}
              onClick={() => setShowMenu(!showMenu)}
            />
            {showMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  minWidth: 240,
                  background: "#fff",
                  border: "1px solid #f1f5f9",
                  borderRadius: 12,
                  boxShadow: "0 10px 40px rgba(15,23,42,0.12)",
                  padding: 8,
                  zIndex: 50,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                    padding: "4px 8px 6px",
                  }}
                >
                  Notifications
                </div>

                <SettingRow
                  icon={
                    notificationsEnabled ? (
                      <Bell size={15} />
                    ) : (
                      <BellOff size={15} />
                    )
                  }
                  label="Message notifications"
                  checked={notificationsEnabled}
                  onToggle={handleToggleNotifications}
                />
                <SettingRow
                  icon={
                    soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />
                  }
                  label="Notification sound"
                  checked={soundEnabled}
                  disabled={!notificationsEnabled}
                  onToggle={handleToggleSound}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {connection !== "online" && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 20px",
            fontSize: 12,
            background: connection === "offline" ? "#fef2f2" : "#fffbeb",
            color: connection === "offline" ? "#b91c1c" : "#92400e",
            borderBottom: "1px solid #f1f5f9",
            flexShrink: 0,
          }}
        >
          <WifiOff size={14} aria-hidden style={{ flexShrink: 0 }} />
          <span>{CONNECTION_COPY[connection]}</span>
        </div>
      )}

      {/* P10: agent conversations carry the admin-read notice (nothing for any other conversation). */}
      {AGENT_CHAT_UI_ENABLED && isAgentConversation(conversation.conversation.type) && <AgentChatNotice />}

      {/* Messages Area */}
      <div
        role="log"
        aria-label={`Messages with ${chatTitle}`}
        aria-busy={msgsFetching}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 0",
          background: "#fafafa",
        }}
        className="chat-messages-scroll"
      >
        {msgsFetching && messages.length === 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#94a3b8",
              fontSize: 12,
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                border: "2.5px solid #c7d2fe",
                borderTopColor: "#4f46e5",
                borderRadius: "50%",
                animation: "chatSpin 0.8s linear infinite",
              }}
            />
            Loading messages...
          </div>
        )}

        {!msgsFetching && loadError && messages.length === 0 && (
          <div
            role="alert"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#64748b",
              textAlign: "center",
              padding: 40,
              gap: 8,
            }}
          >
            <AlertTriangle size={28} color="#f87171" strokeWidth={1.75} aria-hidden />
            <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>Couldn&apos;t load messages</div>
            <div style={{ fontSize: 12 }}>Check your connection and try again.</div>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#4f46e5" }}
            >
              <RefreshCw size={13} aria-hidden /> Try again
            </button>
          </div>
        )}

        {!msgsFetching && !loadError && messages.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#94a3b8",
              textAlign: "center",
              padding: 40,
            }}
          >
            <Sparkles
              size={28}
              color="#c7d2fe"
              strokeWidth={1.5}
              style={{ marginBottom: 16 }}
            />
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#64748b",
                marginBottom: 4,
              }}
            >
              No messages yet
            </div>
            <div style={{ fontSize: 12 }}>
              Send the first message to start chatting.
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const own = isOwnMessage(msg);
          const nextMsg = messages[idx + 1];
          const isLastInGroup =
            !nextMsg ||
            isOwnMessage(nextMsg) !== own ||
            nextMsg.senderType !== msg.senderType;
          // e.g. a FinixMart (platform) auto-reply inside a customer ↔ store chat
          const otherSender =
            !own && counterpartType && msg.senderType !== counterpartType
              ? senderTypeLabel(msg.senderType)
              : null;
          return (
            <React.Fragment key={msg.id}>
              {isLastInGroup &&
                idx > 0 &&
                new Date(messages[idx - 1].createdAt).toDateString() !==
                  new Date(msg.createdAt).toDateString() && (
                  <DateSeparator date={msg.createdAt} />
                )}
              {idx === 0 && <DateSeparator date={msg.createdAt} />}
              <MessageBubble
                message={msg}
                isOwn={own}
                isLastInGroup={isLastInGroup}
                displayName={otherSender ?? chatTitle}
                displayColor={otherSender ? "#4f46e5" : color}
                displayInitials={otherSender ? getInitials(otherSender) : initials}
                myParticipantId={myParticipantId}
                isHovered={hoveredMessageId === msg.id}
                onHover={() => setHoveredMessageId(msg.id)}
                onUnhover={() =>
                  setHoveredMessageId((cur) =>
                    cur === msg.id ? null : cur
                  )
                }
                showReactionPicker={reactionPickerFor === msg.id}
                onOpenReactionPicker={() => setReactionPickerFor(msg.id)}
                onCloseReactionPicker={() => setReactionPickerFor(null)}
                onReact={(emoji) => handleToggleReaction(msg.id, emoji)}
                showDeleteConfirm={deleteConfirmFor === msg.id}
                onOpenDeleteConfirm={() => setDeleteConfirmFor(msg.id)}
                onCloseDeleteConfirm={() => setDeleteConfirmFor(null)}
                onConfirmDelete={() => handleDeleteMessage(msg.id)}
              />
            </React.Fragment>
          );
        })}
        {isTyping && <TypingIndicator color={color} initials={initials} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!readOnly && (
      <div
        style={{
          position: "relative",
          padding: "12px 20px 16px",
          background: "#ffffff",
          borderTop: "1px solid #f1f5f9",
          flexShrink: 0,
        }}
      >
        {showQuickReplies && role === "VENDOR" && !isRecording && (
          <QuickReplyPicker onPick={handleInsertQuickReply} onClose={() => setShowQuickReplies(false)} />
        )}
        {isRecording ? (
          /* ── Recording bar ── */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#fef2f2",
              border: "1.5px solid #fecaca",
              borderRadius: 16,
              padding: "10px 16px",
            }}
          >
            <button
              type="button"
              onClick={cancelRecording}
              aria-label="Discard recording"
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                border: "none",
                background: "#fff",
                color: "#dc2626",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Trash2 size={16} />
            </button>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#ef4444",
                animation: "recPulse 1.2s ease-in-out infinite",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#dc2626" }}>
              Recording... {formatDuration(recordingTime)}
            </div>
            <button
              type="button"
              onClick={stopRecording}
              aria-label="Stop recording"
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Square size={14} fill="#fff" />
            </button>
          </div>
        ) : audioBlob && audioUrl ? (
          /* ── Recorded preview bar ── */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#f8fafc",
              border: "1.5px solid #e2e8f0",
              borderRadius: 16,
              padding: "10px 16px",
            }}
          >
            <button
              type="button"
              onClick={cancelRecording}
              aria-label="Discard recording"
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                border: "none",
                background: "#fff",
                color: "#94a3b8",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
            <audio
              controls
              src={audioUrl}
              style={{ flex: 1, height: 32 }}
            />
            <button
              type="button"
              onClick={handleSendRecording}
              aria-label="Send voice message"
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Send size={15} style={{ marginLeft: 1 }} />
            </button>
          </div>
        ) : (
          /* ── Normal text/attachment bar ── */
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              background: "#f8fafc",
              border: "1.5px solid #e2e8f0",
              borderRadius: 16,
              padding: "6px 6px 6px 16px",
            }}
            onFocus={(e: any) => {
              e.currentTarget.style.borderColor = "#c7d2fe";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(79,70,229,0.08)";
            }}
            onBlur={(e: any) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Image Upload Button */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, paddingBottom: 4 }}>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageSelect}
              />
              <SmallBtn
                icon={<Image size={17} />}
                label="Attach an image"
                onClick={() => imageInputRef.current?.click()}
              />
              {role === "VENDOR" && (
                <SmallBtn
                  icon={<Zap size={17} />}
                  label="Insert a quick reply"
                  expanded={showQuickReplies}
                  onClick={() => setShowQuickReplies((v) => !v)}
                />
              )}
            </div>

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                handleTypingEmit();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              onInput={() => {
                const el = textareaRef.current;
                if (el) {
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }
              }}
              placeholder="Type a message..."
              aria-label="Message"
              rows={1}
              disabled={sending}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 13.5,
                fontFamily: "inherit",
                color: "#0f172a",
                resize: "none",
                lineHeight: 1.5,
                maxHeight: 120,
                padding: "6px 0",
              }}
            />

            {/* Audio Record / Send */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, paddingBottom: 4 }}>
              {messageText.trim() ? (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending}
                  aria-label="Send message"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    border: "none",
                    background: sending
                      ? "#94a3b8"
                      : "linear-gradient(135deg, #4f46e5, #6366f1)",
                    cursor: sending ? "not-allowed" : "pointer",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Send size={16} style={{ marginLeft: 1 }} />
                </button>
              ) : (
                <SmallBtn
                  icon={<Mic size={17} />}
                  label="Record a voice message"
                  onClick={startRecording}
                />
              )}
            </div>
          </div>
        )}
      </div>
      )}

      <style>{`
        @keyframes chatSpin { to { transform: rotate(360deg); } }
        @keyframes dotBounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1.0); } }
        @keyframes recPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }
        @media (max-width: 768px) { .chat-back-btn { display: flex !important; } }
        .chat-messages-scroll::-webkit-scrollbar { width: 5px; }
        .chat-messages-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </>
  );
};

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

function SettingRow({
  icon,
  label,
  checked,
  disabled,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 8px",
        borderRadius: 8,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <div
        style={{
          color: checked ? "#4f46e5" : "#94a3b8",
          display: "flex",
          alignItems: "center",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          flex: 1,
          fontSize: 12.5,
          fontWeight: 600,
          color: "#334155",
        }}
      >
        {label}
      </div>
      <button
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        style={{
          width: 34,
          height: 20,
          borderRadius: 999,
          border: "none",
          background: checked ? "#4f46e5" : "#e2e8f0",
          cursor: disabled ? "not-allowed" : "pointer",
          position: "relative",
          flexShrink: 0,
          transition: "background 0.15s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 16 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            transition: "left 0.15s ease",
          }}
        />
      </button>
    </div>
  );
}

function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const label =
    d.toDateString() === new Date().toDateString()
      ? "Today"
      : d.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 24px",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#94a3b8",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
    </div>
  );
}

function TypingIndicator({
  color,
  initials,
}: {
  color: string;
  initials: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        marginBottom: 16,
        padding: "0 24px 0 72px",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initials}
      </div>
      <div
        style={{
          padding: "12px 18px",
          borderRadius: "18px 18px 18px 4px",
          background: "#f1f0fb",
          display: "flex",
          gap: 4,
          alignItems: "center",
        }}
      >
        {[0, 0.16, 0.32].map((delay, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#94a3b8",
              animation: "dotBounce 1.4s infinite ease-in-out both",
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  isLastInGroup: boolean;
  displayName: string;
  displayColor: string;
  displayInitials: string;
  myParticipantId: string;
  isHovered: boolean;
  onHover: () => void;
  onUnhover: () => void;
  showReactionPicker: boolean;
  onOpenReactionPicker: () => void;
  onCloseReactionPicker: () => void;
  onReact: (emoji: string) => void;
  showDeleteConfirm: boolean;
  onOpenDeleteConfirm: () => void;
  onCloseDeleteConfirm: () => void;
  onConfirmDelete: () => void;
}

function MessageBubble({
  message,
  isOwn,
  isLastInGroup,
  displayName,
  displayColor,
  displayInitials,
  myParticipantId,
  isHovered,
  onHover,
  onUnhover,
  showReactionPicker,
  onOpenReactionPicker,
  onCloseReactionPicker,
  onReact,
  showDeleteConfirm,
  onOpenDeleteConfirm,
  onCloseDeleteConfirm,
  onConfirmDelete,
}: MessageBubbleProps) {
  const isSent = message.status === "SENT";
  const isDelivered = message.status === "DELIVERED";
  const isSeen = message.status === "SEEN";
  const isSending = message.status === "SENDING";

  const imageSrc = useMemo(() => {
    if (message.messageType !== "IMAGE" || !message.media) return null;
    return (
      getChatMediaUrl(message.id, message.media.thumbnailUrl) ??
      getChatMediaUrl(message.id, message.media.url)
    );
  }, [message.id, message.messageType, message.media]);

  const audioSrc = useMemo(() => {
    if (message.messageType !== "AUDIO" || !message.media) return null;
    return getChatMediaUrl(message.id, message.media.url);
  }, [message.id, message.messageType, message.media]);

  const imageAspectRatio = useMemo(
    () => getImageAspectRatio(message.media?.width, message.media?.height),
    [message.media?.width, message.media?.height]
  );

  const reactionGroups = useMemo(() => {
    const map = new Map<string, { count: number; mine: boolean }>();
    (message.reactions ?? []).forEach((r) => {
      const entry = map.get(r.reaction) || { count: 0, mine: false };
      entry.count += 1;
      if (r.participantId === myParticipantId) entry.mine = true;
      map.set(r.reaction, entry);
    });
    return Array.from(map.entries());
  }, [message.reactions, myParticipantId]);

  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onUnhover}
      style={{
        display: "flex",
        flexDirection: isOwn ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 8,
        marginBottom: isLastInGroup ? (reactionGroups.length ? 24 : 16) : 4,
        padding: isLastInGroup ? "0 24px" : "0 24px 0 72px",
        position: "relative",
      }}
    >
      {!isOwn && (
        <div style={{ width: 32, flexShrink: 0 }}>
          {isLastInGroup ? (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${displayColor}, ${displayColor}dd)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {displayInitials}
            </div>
          ) : (
            <div style={{ width: 32 }} />
          )}
        </div>
      )}
      <div
        style={{
          maxWidth: "min(520px, calc(100% - 80px))",
          display: "flex",
          flexDirection: "column",
          alignItems: isOwn ? "flex-end" : "flex-start",
          position: "relative",
        }}
      >
        {isLastInGroup && !isOwn && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#4f46e5",
              marginBottom: 4,
              marginLeft: 4,
            }}
          >
            {displayName}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexDirection: isOwn ? "row-reverse" : "row",
          }}
        >
          <div
            style={{
              padding: message.messageType === "IMAGE" ? 4 : "10px 14px",
              borderRadius: isOwn
                ? "18px 18px 4px 18px"
                : "18px 18px 18px 4px",
              background: isOwn
                ? isSending
                  ? "#a5b4fc"
                  : "linear-gradient(135deg, #4f46e5, #6366f1)"
                : "#f1f0fb",
              color: isOwn ? "#fff" : "#0f172a",
              fontSize: 13.5,
              lineHeight: 1.55,
              fontWeight: isOwn ? 500 : 450,
              wordBreak: "break-word",
              opacity: isSending ? 0.85 : 1,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {message.messageType === "IMAGE" ? (
              imageSrc ? (
                <div
                  style={{
                    position: "relative",
                    width: IMAGE_BOX.maxWidth,
                    maxWidth: IMAGE_BOX.maxWidth,
                    minWidth: IMAGE_BOX.minWidth,
                    aspectRatio: `${imageAspectRatio}`,
                    maxHeight: IMAGE_BOX.maxHeight,
                    minHeight: IMAGE_BOX.minHeight,
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "#e2e8f0",
                  }}
                >
                  <img
                    src={imageSrc}
                    alt="Shared"
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                      display: "block",
                    }}
                  />
                  {isSending && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(15,23,42,0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          border: "2.5px solid rgba(255,255,255,0.4)",
                          borderTopColor: "#fff",
                          borderRadius: "50%",
                          animation: "chatSpin 0.8s linear infinite",
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    width: IMAGE_BOX.minWidth,
                    height: IMAGE_BOX.minHeight,
                    borderRadius: 14,
                    background: "#e2e8f0",
                  }}
                />
              )
            ) : message.messageType === "AUDIO" ? (
              audioSrc ? (
                <div style={{ minWidth: 220, padding: "2px 4px" }}>
                  <audio
                    controls
                    src={audioSrc}
                    style={{
                      width: 220,
                      height: 32,
                      filter: isOwn ? "invert(1) grayscale(0.2)" : "none",
                    }}
                  />
                  {message.media?.duration ? (
                    <div
                      style={{
                        fontSize: 10,
                        opacity: 0.75,
                        marginTop: 2,
                        textAlign: isOwn ? "right" : "left",
                      }}
                    >
                      {formatDuration(message.media.duration)}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 200,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: isOwn
                        ? "rgba(255,255,255,0.2)"
                        : "#e0e7ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: isOwn ? "#fff" : "#4f46e5",
                        marginLeft: 3,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>
                    {message.media?.duration
                      ? formatDuration(message.media.duration)
                      : "Uploading..."}
                  </span>
                </div>
              )
            ) : (
              message.content
            )}
          </div>

          {/* Hover-triggered action buttons: react + delete (own messages only) */}
          {!isSending && (isHovered || showReactionPicker || showDeleteConfirm) && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ position: "relative" }}>
                <button
                  onClick={onOpenReactionPicker}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                    boxShadow: "0 1px 4px rgba(15,23,42,0.08)",
                  }}
                >
                  <SmilePlus size={14} />
                </button>
                {showReactionPicker && (
                  <div
                    style={
                      {
                        position: "absolute",
                        bottom: "calc(100% + 6px)",
                        [isOwn ? "right" : "left"]: 0,
                        display: "flex",
                        gap: 2,
                        background: "#fff",
                        border: "1px solid #f1f5f9",
                        borderRadius: 999,
                        boxShadow: "0 8px 24px rgba(15,23,42,0.14)",
                        padding: "4px 6px",
                        zIndex: 30,
                      } as React.CSSProperties
                    }
                    onMouseLeave={onCloseReactionPicker}
                  >
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => onReact(emoji)}
                        style={{
                          border: "none",
                          background: "transparent",
                          fontSize: 17,
                          cursor: "pointer",
                          padding: 4,
                          borderRadius: "50%",
                          lineHeight: 1,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f1f5f9")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isOwn && (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={onOpenDeleteConfirm}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#94a3b8",
                      boxShadow: "0 1px 4px rgba(15,23,42,0.08)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#dc2626";
                      e.currentTarget.style.borderColor = "#fecaca";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#94a3b8";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                  {showDeleteConfirm && (
                    <div
                      style={
                        {
                          position: "absolute",
                          bottom: "calc(100% + 6px)",
                          [isOwn ? "right" : "left"]: 0,
                          background: "#fff",
                          border: "1px solid #f1f5f9",
                          borderRadius: 12,
                          boxShadow: "0 8px 24px rgba(15,23,42,0.14)",
                          padding: 10,
                          zIndex: 30,
                          width: 180,
                        } as React.CSSProperties
                      }
                      onMouseLeave={onCloseDeleteConfirm}
                    >
                      <div
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: "#334155",
                          marginBottom: 8,
                        }}
                      >
                        Delete this message?
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={onCloseDeleteConfirm}
                          style={{
                            flex: 1,
                            padding: "6px 0",
                            fontSize: 11.5,
                            fontWeight: 600,
                            borderRadius: 8,
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            color: "#64748b",
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={onConfirmDelete}
                          style={{
                            flex: 1,
                            padding: "6px 0",
                            fontSize: 11.5,
                            fontWeight: 600,
                            borderRadius: 8,
                            border: "none",
                            background: "#dc2626",
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reaction pills */}
        {reactionGroups.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 4,
              marginTop: 4,
              flexWrap: "wrap",
              justifyContent: isOwn ? "flex-end" : "flex-start",
            }}
          >
            {reactionGroups.map(([emoji, { count, mine }]) => (
              <button
                key={emoji}
                onClick={() => onReact(emoji)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 999,
                  border: mine
                    ? "1.5px solid #4f46e5"
                    : "1px solid #e2e8f0",
                  background: mine ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                <span>{emoji}</span>
                {count > 1 && (
                  <span
                    style={{
                      fontWeight: 700,
                      color: mine ? "#4f46e5" : "#64748b",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {isLastInGroup && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginTop: 4,
              padding: "0 4px",
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "#94a3b8",
                fontWeight: 500,
              }}
            >
              {formatTime(message.createdAt)}
            </span>
            {isOwn && (
              <span style={{ display: "flex", alignItems: "center" }}>
                {isSending && (
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      border: "1.5px solid #fff",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "chatSpin 0.8s linear infinite",
                    }}
                  />
                )}
                {isSent && (
                  <Check size={14} color="#94a3b8" strokeWidth={2.5} />
                )}
                {isDelivered && (
                  <CheckCheck size={14} color="#94a3b8" strokeWidth={2.5} />
                )}
                {isSeen && (
                  <CheckCheck size={14} color="#4f46e5" strokeWidth={2.5} />
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  active,
  onClick,
  label,
  expanded,
}: {
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  label?: string;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={expanded}
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        border: "none",
        background: active ? "#f5f3ff" : "transparent",
        cursor: "pointer",
        color: active ? "#4f46e5" : "#64748b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f5f3ff";
        e.currentTarget.style.color = "#4f46e5";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active ? "#f5f3ff" : "transparent";
        e.currentTarget.style.color = active ? "#4f46e5" : "#64748b";
      }}
    >
      {icon}
    </button>
  );
}

function SmallBtn({
  icon,
  onClick,
  label,
  expanded,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  label?: string;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={expanded}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: "#94a3b8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#4f46e5";
        e.currentTarget.style.background = "#eef2ff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "#94a3b8";
        e.currentTarget.style.background = "transparent";
      }}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

export default ChatBox;