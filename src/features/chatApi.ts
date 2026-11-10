import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

/* ==================== SHARED TYPES ==================== */
export interface FindOrCreateConversationRequest {
  type: ConversationType;
  productId?: string;
  orderId?: string;
  otherParticipant: {
    id: string;
    type: ParticipantType;
    displayName: string;
    displayImage?: string | null;
  };
}
export type ConversationType =
  | "PRODUCT_INQUIRY"
  | "VENDOR_SUPPORT"
  | "USER_SUPPORT"
  | "DELIVERY_CHAT"
  | "GENERAL_CHAT";
export type ConversationStatus =
  | "OPEN"
  | "PENDING"
  | "ASSIGNED"
  | "RESOLVED"
  | "CLOSED"
  | "ARCHIVED";
export type ParticipantType =
  | "CUSTOMER"
  | "VENDOR"
  | "ADMIN"
  | "EMPLOYEE"
  | "DELIVERY";
export type MessageStatus =
  | "SENDING"
  | "SENT"
  | "DELIVERED"
  | "SEEN"
  | "FAILED";
export type MessageType = "TEXT" | "IMAGE" | "AUDIO" | "QUICK_REPLY" | "SYSTEM";
export type QuickReplyScope = "GLOBAL" | "VENDOR" | "EMPLOYEE";
export type AutoReplyTriggerType =
  | "KEYWORD"
  | "FIRST_MESSAGE"
  | "INACTIVITY"
  | "AWAY_MODE";
export type MatchType = "EXACT" | "CONTAINS" | "STARTS_WITH" | "REGEX";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Custom Cursor Pagination Response (Matches Backend)
export interface CursorResponse<T> {
  success: boolean;
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/* ==================== CONVERSATION TYPES ==================== */

// chatApi.ts
export interface ChatConversationParticipant {
  id: string;
  unreadCount: number;
  isPinned: boolean;
  lastReadMessageId: string | null;
  userId: string | null;
  vendorId: string | null;
  employeeId: string | null;
  deliveryPersonId: string | null;
  // ADD THIS — the actual counterpart, resolved server-side
  otherParticipant: {
    id: string; // vendorId/userId/employeeId/deliveryPersonId of the OTHER side
    participantType: ParticipantType;
    displayName: string;
    displayImage: string | null;
  } | null;
  conversation: {
    id: string;
    type: ConversationType;
    status: ConversationStatus;
    title: string | null;
    lastMessageAt: string | null;
    lastMessageText: string | null;
    lastMessageType: MessageType | null;
    lastSenderId: string | null;
    lastSenderType: ParticipantType | null;
    priority: number;
  };
}

export interface CreateConversationRequest {
  type: ConversationType;
  productId?: string;
  orderId?: string;
  title?: string;
  participantIds: Array<{
    id: string;
    type: ParticipantType;
    displayName?: string;
    displayImage?: string;
  }>;
}

export interface UpdateConversationStatusRequest {
  status: ConversationStatus;
}

export interface AssignConversationRequest {
  assigneeId: string;
  assigneeType: ParticipantType;
  note?: string;
}

export interface AddLabelRequest {
  label: string;
  color: string;
}

export interface AddNoteRequest {
  content: string;
}

export interface ConversationListParams {
  cursor?: string;
  limit?: number;
  status?: ConversationStatus;
}

/* ==================== MESSAGE TYPES ==================== */

export interface MessageMedia {
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  blurhash: string | null;
}

export interface MessageReaction {
  reaction: string;
  participantId: string;
}

export interface ChatMessage {
  id: string;
  // ✅ Needed by ChatBox to filter socket events per-conversation
  conversationId: string;
  // ✅ Lets the client reliably match an optimistic message to the server echo
  clientId?: string | null;
  content: string | null;
  messageType: MessageType;
  status: MessageStatus;
  createdAt: string;
  replyToId: string | null;
  quickReplyId: string | null;
  senderType: ParticipantType;
  senderId: string | null;
  senderVendorId: string | null;
  senderEmployeeId: string | null;
  senderDeliveryPersonId: string | null;
  media: MessageMedia | null;
  reactions: MessageReaction[];
}

export interface SendMessageRequest {
  conversationId: string;
  messageType?: MessageType;
  content?: string;
  replyToId?: string;
  quickReplyId?: string;
  clientId: string; // Required for deduplication
}

export interface MessageListParams {
  cursor?: string;
  limit?: number;
}

/* ==================== READ RECEIPT TYPES ==================== */

export interface MarkAsReadRequest {
  conversationId: string;
  messageId: string;
}

/* ==================== QUICK REPLY TYPES ==================== */

export interface ChatQuickReply {
  id: string;
  name: string;
  content: string;
  category: string | null;
  shortcut: string | null;
  matchType: MatchType;
  keywords: string[];
  scope: QuickReplyScope;
  /** Owning vendor as stored by the server (null for platform quick replies). */
  vendorId?: string | null;
  isActive: boolean;
  sortOrder: number;
  usageCount: number;
}

export interface CreateQuickReplyRequest {
  name: string;
  content: string;
  category?: string;
  shortcut?: string;
  keywords?: string[];
  scope?: QuickReplyScope;
}

export type UpdateQuickReplyRequest = Partial<CreateQuickReplyRequest> & { isActive?: boolean; sortOrder?: number };

/* ==================== AUTO REPLY TYPES ==================== */

export interface ChatAutoReply {
  id: string;
  name: string;
  triggerType: AutoReplyTriggerType;
  isActive: boolean;
  keywords: string[];
  matchType: MatchType;
  inactivitySeconds: number | null;
  message: string;
  messageType: MessageType;
  mediaUrl: string | null;
  scope: QuickReplyScope;
  vendorId?: string | null;
  maxTriggersPerConv: number;
  cooldownSeconds: number;
  triggerCount: number;
}

export interface CreateAutoReplyRequest {
  name: string;
  triggerType: AutoReplyTriggerType;
  keywords?: string[];
  matchType?: MatchType;
  inactivitySeconds?: number;
  message: string;
  messageType?: MessageType;
  mediaUrl?: string;
  scope?: QuickReplyScope;
  maxTriggersPerConv?: number;
  cooldownSeconds?: number;
  isActive?: boolean;
}

export type UpdateAutoReplyRequest = Partial<CreateAutoReplyRequest>;

/* ==================== NOTIFICATION SETTINGS TYPES ==================== */

export interface ChatNotificationSettings {
  id: string;
  ownerType: ParticipantType;
  isEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showPreview: boolean;
  showSender: boolean;
  eventSettings: Record<string, Record<string, boolean>>;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  quietHoursTz: string | null;
}

export interface UpdateNotificationSettingsRequest {
  isEnabled?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  showPreview?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  quietHoursTz?: string;
  eventSettings?: Record<string, Record<string, boolean>>;
}

/* ==================== MEDIA TYPES (NEW) ==================== */

export interface UploadImageResponse {
  url: string;
  thumbnailUrl: string;
  originalUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
  blurhash: string;
  fileSize: number;
}

export interface UploadAudioResponse {
  url: string;
  duration: number;
  waveformData: string;
  fileSize: number;
}
export interface SupportQueueItem {
  id: string;
  type: ConversationType;
  status: ConversationStatus;
  priority: number;
  lastMessageAt: string | null;
  lastMessageText: string | null;
  requester: {
    id: string;
    participantType: ParticipantType;
    displayName: string;
    displayImage: string | null;
  } | null;
  assignedTo: { assigneeId: string; assigneeType: ParticipantType } | null;
  supportParticipant: {
    id: string;
    unreadCount: number;
    isPinned: boolean;
    lastReadMessageId: string | null;
    userId: string | null;
    vendorId: string | null;
    employeeId: string | null;
    deliveryPersonId: string | null;
  } | null;
}

export interface SupportQueueParams {
  category: "USER_SUPPORT" | "VENDOR_SUPPORT" | "ALL";
  view: "UNASSIGNED" | "MINE" | "ALL";
  status?: ConversationStatus;
  cursor?: string;
  limit?: number;
}

/* ==================== API ==================== */

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "ChatConversation",
    "ChatMessage",
    "ChatQuickReply",
    "ChatAutoReply",
    "ChatNotification",
    "ChatMedia",
  ],

  endpoints: (builder) => ({
    /* ─── CONVERSATIONS ─────────────────────────────────────────────────── */
    findOrCreateConversation: builder.mutation<
      ApiResponse<ChatConversationParticipant["conversation"]>,
      FindOrCreateConversationRequest
    >({
      query: (body) => ({
        url: "/chat/conversations/find-or-create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ChatConversation"],
    }),
    createConversation: builder.mutation<
      ApiResponse<any>,
      CreateConversationRequest
    >({
      query: (body) => ({ url: "/chat/conversations", method: "POST", body }),
      invalidatesTags: ["ChatConversation"],
    }),

    getMyConversations: builder.query<
      CursorResponse<ChatConversationParticipant>,
      ConversationListParams | void
    >({
      query: (params) => ({ url: "/chat/conversations", params: params ?? {} }),
      providesTags: ["ChatConversation"],
    }),

    updateConversationStatus: builder.mutation<
      ApiResponse<any>,
      { id: string } & UpdateConversationStatusRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/chat/conversations/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "ChatConversation", id },
        "ChatConversation",
      ],
    }),

    // Admin Support Actions
    assignConversation: builder.mutation<
      ApiResponse<any>,
      { id: string } & AssignConversationRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/chat/conversations/${id}/assign`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "ChatConversation", id },
        "ChatConversation",
      ],
    }),

    addConversationLabel: builder.mutation<
      ApiResponse<any>,
      { id: string } & AddLabelRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/chat/conversations/${id}/labels`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "ChatConversation", id }],
    }),

    addConversationNote: builder.mutation<
      ApiResponse<any>,
      { id: string } & AddNoteRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/chat/conversations/${id}/notes`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "ChatConversation", id }],
    }),
    getSupportQueue: builder.query<
      ApiResponse<SupportQueueItem[]>,
      SupportQueueParams
    >({
      query: (params) => ({ url: "/chat/conversations/support-queue", params }),
      providesTags: ["ChatConversation"],
    }),
    /* ─── MESSAGES ──────────────────────────────────────────────────────── */

    sendMessage: builder.mutation<ApiResponse<ChatMessage>, SendMessageRequest>(
      {
        query: (body) => ({ url: "/chat/messages", method: "POST", body }),
        invalidatesTags: (_r, _e, arg) => [
          { type: "ChatConversation", id: arg.conversationId },
          "ChatConversation",
        ],
      },
    ),

    getMessages: builder.query<
      CursorResponse<ChatMessage>,
      { conversationId: string } & MessageListParams
    >({
      query: ({ conversationId, ...params }) => ({
        url: `/chat/messages/conversation/${conversationId}`,
        params,
      }),
      providesTags: (_r, _e, { conversationId }) => [
        { type: "ChatMessage", id: conversationId },
      ],
    }),

    toggleMessageReaction: builder.mutation<
      ApiResponse<{ reactions: MessageReaction[] }>,
      { messageId: string; participantId: string; reaction: string }
    >({
      query: ({ messageId, ...body }) => ({
        url: `/chat/messages/${messageId}/react`,
        method: "POST",
        body,
      }),
    }),

    deleteMessage: builder.mutation<ApiResponse<null>, string>({
      query: (messageId) => ({
        url: `/chat/messages/${messageId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, messageId) => [
        { type: "ChatMessage", id: "UNKNOWN" },
      ],
    }),

    /* ─── READ RECEIPTS ─────────────────────────────────────────────────── */

    markAsRead: builder.mutation<ApiResponse<null>, MarkAsReadRequest>({
      query: (body) => ({ url: "/chat/read-receipts", method: "POST", body }),
      invalidatesTags: (_r, _e, { conversationId }) => [
        { type: "ChatConversation", id: conversationId },
        "ChatConversation",
      ],
    }),

    /* ─── QUICK REPLIES ─────────────────────────────────────────────────── */
    getMyQuickReplies: builder.query<ApiResponse<ChatQuickReply[]>, void>({
      query: () => "/chat/quick-replies", // নতুন route + controller handler লাগবে backend-এ
      providesTags: ["ChatQuickReply"],
    }),
    getQuickReplySuggestions: builder.query<
      ApiResponse<ChatQuickReply[]>,
      string | void
    >({
      query: (q) => ({
        url: "/chat/quick-replies/suggestions",
        params: q ? { q } : {},
      }),
      providesTags: ["ChatQuickReply"],
    }),

    createQuickReply: builder.mutation<
      ApiResponse<ChatQuickReply>,
      CreateQuickReplyRequest
    >({
      query: (body) => ({ url: "/chat/quick-replies", method: "POST", body }),
      invalidatesTags: ["ChatQuickReply"],
    }),

    updateQuickReply: builder.mutation<
      ApiResponse<ChatQuickReply>,
      { id: string } & UpdateQuickReplyRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/chat/quick-replies/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ChatQuickReply"],
    }),

    deleteQuickReply: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/chat/quick-replies/${id}`, method: "DELETE" }),
      invalidatesTags: ["ChatQuickReply"],
    }),

    /* ─── AUTO REPLIES ──────────────────────────────────────────────────── */

    getAutoReplies: builder.query<ApiResponse<ChatAutoReply[]>, void>({
      query: () => "/chat/auto-replies",
      providesTags: ["ChatAutoReply"],
    }),

    // Chat settings: the vendor's OWN rules, active and inactive (server-scoped).
    getMyAutoReplies: builder.query<ApiResponse<ChatAutoReply[]>, void>({
      query: () => "/chat/auto-replies/mine",
      providesTags: ["ChatAutoReply"],
    }),

    createAutoReply: builder.mutation<
      ApiResponse<ChatAutoReply>,
      CreateAutoReplyRequest
    >({
      query: (body) => ({ url: "/chat/auto-replies", method: "POST", body }),
      invalidatesTags: ["ChatAutoReply"],
    }),

    updateAutoReply: builder.mutation<
      ApiResponse<ChatAutoReply>,
      { id: string } & UpdateAutoReplyRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/chat/auto-replies/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ChatAutoReply"],
    }),

    deleteAutoReply: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/chat/auto-replies/${id}`, method: "DELETE" }),
      invalidatesTags: ["ChatAutoReply"],
    }),

    /* ─── NOTIFICATION SETTINGS ─────────────────────────────────────────── */

    getNotificationSettings: builder.query<
      ApiResponse<ChatNotificationSettings>,
      void
    >({
      query: () => "/chat/notifications",
      providesTags: ["ChatNotification"],
    }),

    updateNotificationSettings: builder.mutation<
      ApiResponse<ChatNotificationSettings>,
      UpdateNotificationSettingsRequest
    >({
      query: (body) => ({ url: "/chat/notifications", method: "PATCH", body }),
      invalidatesTags: ["ChatNotification"],
    }),

    /* ─── MEDIA (NEW) ───────────────────────────────────────────────────── */

    uploadChatImage: builder.mutation<
      ApiResponse<UploadImageResponse>,
      { messageId: string; file: File }
    >({
      query: ({ messageId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("messageId", messageId);
        return { url: "/chat/media/image", method: "POST", body: formData };
      },
      invalidatesTags: ["ChatMedia"],
    }),

    uploadChatAudio: builder.mutation<
      ApiResponse<UploadAudioResponse>,
      { messageId: string; file: File; duration?: number }
    >({
      query: ({ messageId, file, duration }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("messageId", messageId);
        if (duration !== undefined) {
          formData.append("duration", String(duration));
        }
        return { url: "/chat/media/audio", method: "POST", body: formData };
      },
      invalidatesTags: ["ChatMedia"],
    }),

    getChatMedia: builder.query<ApiResponse<any>, string>({
      query: (messageId) => `/chat/media/${messageId}`,
      providesTags: (_r, _e, messageId) => [
        { type: "ChatMedia", id: messageId },
      ],
    }),

    deleteChatMedia: builder.mutation<ApiResponse<null>, string>({
      query: (messageId) => ({
        url: `/chat/media/${messageId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, messageId) => [
        { type: "ChatMedia", id: messageId },
      ],
    }),
  }),
});

/* ==================== EXPORT HOOKS ==================== */

export const {
  // Conversations
  useFindOrCreateConversationMutation,
  useCreateConversationMutation,
  useGetMyConversationsQuery,
  useLazyGetMyConversationsQuery,
  useUpdateConversationStatusMutation,
  useAssignConversationMutation,
  useAddConversationLabelMutation,
  useAddConversationNoteMutation,
  useGetSupportQueueQuery,
  useLazyGetSupportQueueQuery,

  // Messages
  useSendMessageMutation,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useToggleMessageReactionMutation,
  useDeleteMessageMutation,

  // Read Receipts
  useMarkAsReadMutation,

  // Quick Replies
  useGetMyQuickRepliesQuery,
  useGetMyAutoRepliesQuery,
  useLazyGetMyQuickRepliesQuery,
  useGetQuickReplySuggestionsQuery,
  useLazyGetQuickReplySuggestionsQuery,
  useCreateQuickReplyMutation,
  useUpdateQuickReplyMutation,
  useDeleteQuickReplyMutation,

  // Auto Replies
  useGetAutoRepliesQuery,
  useCreateAutoReplyMutation,
  useUpdateAutoReplyMutation,
  useDeleteAutoReplyMutation,

  // Notification Settings
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,

  // Media
  useUploadChatImageMutation,
  useUploadChatAudioMutation,
  useGetChatMediaQuery,
  useDeleteChatMediaMutation,
} = chatApi;
