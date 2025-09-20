// features/chatApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

// --------- Request Types ---------
export interface CreateConversationRequest {
  participantIds: string[];
  participantTypes: ("USER" | "VENDOR" | "ADMIN" | "EMPLOYEE" | "DELIVERY")[];
  productId?: string;
  orderId?: number;
  title?: string;
  type:
    | "PRODUCT_INQUIRY"
    | "VENDOR_SUPPORT"
    | "USER_SUPPORT"
    | "DELIVERY_CHAT"
    | "GENERAL_CHAT";
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
}

export interface MarkAsReadRequest {
  conversationId: string;
}

// --------- Response Types ---------
export interface Conversation {
  id: string;
  type: string;
  productId?: string;
  orderId?: number;
  title?: string;
  status: string;
  lastMessageAt?: string;
  lastMessageText?: string;
  messageCount: number;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  product?: {
    id: string;
    name: string;
    slug: string;
  };
  order?: {
    id: number;
    totalAmount: number;
  };
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId?: string;
  vendorId?: string;
  employeeId?: string;
  deliveryPersonId?: string;
  participantType: string;
  lastReadAt?: string;
  joinedAt: string;
  leftAt?: string;
  isMuted: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  vendor?: {
    id: string;
    storeName: string;
  };
  employee?: {
    id: string;
    designation: string;
  };
  deliveryPerson?: {
    id: string;
    name: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId?: string;
  senderVendorId?: string;
  senderEmployeeId?: string;
  senderDeliveryPersonId?: string;
  senderType: string;
  content: string;
  createdAt: string;
  senderUser?: {
    id: string;
    name: string;
    email: string;
  };
  senderVendor?: {
    id: string;
    storeName: string;
  };
  senderEmployee?: {
    id: string;
    designation: string;
  };
  senderDelivery?: {
    id: string;
    name: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// --------- Chat API ---------
export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Conversation", "Message"],
  endpoints: (builder) => ({
    // Create a new conversation
    createConversation: builder.mutation<
      Conversation,
      CreateConversationRequest
    >({
      query: (body) => ({
        url: "/chat/conversations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Conversation"],
    }),
    // features/chatApi.ts (inside endpoints)
    findOrCreateConversation: builder.mutation<
      Conversation,
      CreateConversationRequest
    >({
      query: (body) => ({
        url: "/chat/conversations/find-or-create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Conversation"],
    }),

    // Get user conversations
    getConversations: builder.query<
      PaginatedResponse<Conversation>,
      {
        page?: number;
        limit?: number;
        type?: string;
      }
    >({
      query: ({ page = 1, limit = 20, type } = {}) => ({
        url: `/chat/conversations?page=${page}&limit=${limit}${
          type ? `&type=${type}` : ""
        }`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Conversation" as const,
                id,
              })),
              "Conversation",
            ]
          : ["Conversation"],
    }),

    // Get specific conversation
    getConversation: builder.query<Conversation, string>({
      query: (conversationId) => ({
        url: `/chat/conversations/${conversationId}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Conversation", id }],
    }),

    // Send a message
    sendMessage: builder.mutation<Message, SendMessageRequest>({
      query: (body) => ({
        url: "/chat/messages",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: "Conversation", id: conversationId },
        { type: "Message", id: conversationId },
      ],
    }),

    // Get conversation messages
    getMessages: builder.query<
      PaginatedResponse<Message>,
      {
        conversationId: string;
        page?: number;
        limit?: number;
      }
    >({
      query: ({ conversationId, page = 1, limit = 50 }) => ({
        url: `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: (result, error, { conversationId }) => [
        { type: "Message", id: conversationId },
      ],
    }),

    // Mark messages as read
    markAsRead: builder.mutation<{ message: string }, MarkAsReadRequest>({
      query: ({ conversationId }) => ({
        url: `/chat/conversations/${conversationId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: "Conversation", id: conversationId },
      ],
    }),

    // Search conversations
    searchConversations: builder.query<
      PaginatedResponse<Conversation>,
      {
        query: string;
        page?: number;
        limit?: number;
      }
    >({
      query: ({ query, page = 1, limit = 20 }) => ({
        url: `/chat/conversations/search?q=${encodeURIComponent(
          query
        )}&page=${page}&limit=${limit}`,
        method: "GET",
      }),
    }),

    // Get unread count
    getUnreadCount: builder.query<{ count: number }, void>({
      query: () => ({
        url: "/chat/conversations/unread/count",
        method: "GET",
      }),
      providesTags: ["Conversation"],
    }),

    // Mute conversation
    muteConversation: builder.mutation<Conversation, string>({
      query: (conversationId) => ({
        url: `/chat/conversations/${conversationId}/mute`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Conversation", id }],
    }),

    // Unmute conversation - FIXED: Removed extra colon
    unmuteConversation: builder.mutation<Conversation, string>({
      query: (conversationId) => ({
        url: `/chat/conversations/${conversationId}/unmute`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Conversation", id }],
    }),

    // Leave conversation
    leaveConversation: builder.mutation<{ message: string }, string>({
      query: (conversationId) => ({
        url: `/chat/conversations/${conversationId}/leave`,
        method: "POST",
      }),
      invalidatesTags: ["Conversation"],
    }),
  }),
});

// --------- Export Hooks ---------
export const {
  useCreateConversationMutation,
  useFindOrCreateConversationMutation,
  useGetConversationsQuery,
  useLazyGetConversationsQuery,
  useGetConversationQuery,
  useSendMessageMutation,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useMarkAsReadMutation,
  useSearchConversationsQuery,
  useLazySearchConversationsQuery,
  useGetUnreadCountQuery,
  useMuteConversationMutation,
  useUnmuteConversationMutation,
  useLeaveConversationMutation,
} = chatApi;
