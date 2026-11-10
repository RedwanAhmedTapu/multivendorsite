// Admin Live Chat "New chat": search vendors / customers and open or reuse a
// support conversation (backend: /api/chat/conversations/staff-*, supportStaff
// guard). Injected into the existing chat API, so its cache tags apply.

import { chatApi, type SupportQueueItem } from "./chatApi";

export type StaffLookupKind = "VENDOR" | "CUSTOMER";
export type StaffLookupRow = { id: string; name: string; image: string | null; detail: string | null };

export const adminInboxApi = chatApi.injectEndpoints({
  endpoints: (b) => ({
    staffLookup: b.query<{ success: boolean; data: StaffLookupRow[] }, { kind: StaffLookupKind; q: string }>({
      query: (params) => ({ url: "/chat/conversations/staff-lookup", params }),
      keepUnusedDataFor: 30,
    }),
    staffStart: b.mutation<{ success: boolean; data: SupportQueueItem }, { kind: StaffLookupKind; id: string }>({
      query: (body) => ({ url: "/chat/conversations/staff-start", method: "POST", body }),
      invalidatesTags: ["ChatConversation"],
    }),
  }),
  overrideExisting: false,
});

export const { useStaffLookupQuery, useStaffStartMutation } = adminInboxApi;
