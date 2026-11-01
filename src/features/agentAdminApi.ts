// Admin management of the Agent Commission System (backend: /api/admin/agents).
// Injected into the existing apiSlice, so no store change is needed.

import { apiSlice } from "./apiSlice";

type Envelope<T> = { success: true; data: T };
const unwrap = <T,>(r: Envelope<T>) => r.data;

export type AgentStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
export type RateSource = "VENDOR" | "AGENT" | "CATEGORY" | "LEVEL" | "GLOBAL";
export type PayoutMethod = "BKASH" | "NAGAD" | "BANK";
export type WithdrawalFee = { type: "NONE" } | { type: "FLAT"; amount: string } | { type: "PERCENT"; percent: string };

export type AgentSettingsValues = {
  defaultCommissionPercent: string | null;
  ratePrecedence: RateSource[] | null;
  holdDays: number | null;
  commissionDurationMonths: number | null;
  minWithdrawalAmount: string | null;
  maxWithdrawalAmount: string | null;
  withdrawalFee: WithdrawalFee | null;
  enabledPayoutMethods: PayoutMethod[] | null;
  autoApproveWithdrawalLimit: string | null;
  registrationRequiresApproval: boolean | null;
  performanceWeights: PerformanceWeights | null;
  vendorAlertRules: VendorAlertRules | null;
};
export type PerformanceWeights = { vendorActivity: number; sales: number; growth: number; satisfaction: number };
export type VendorAlertRules = { inactivityDays: number; lowRatingMax: number; lowStockUnits: number; growthPercent: number; lookbackDays: number };
export type SettingKey = keyof AgentSettingsValues;

export type AgentSettingsResponse = {
  values: AgentSettingsValues;
  missing: SettingKey[];
  meta: Partial<Record<SettingKey, { updatedAt: string; updatedById: string | null }>>;
  definitions: Array<{ key: SettingKey; group: "commission" | "withdrawal" | "registration" | "performance" | "alerts"; label: string; description: string; kind: string }>;
  changed?: SettingKey[];
};

export type AuditEntry = {
  id: string;
  entity: "SETTING" | "LEVEL" | "OVERRIDE" | "BONUS_RULE" | "AGENT" | "VENDOR_LINK" | "WITHDRAWAL" | "COMMISSION" | "TRAINING" | "WALLET" | "BONUS_AWARD";
  entityId: string;
  action: string;
  oldValue: unknown;
  newValue: unknown;
  actorUserId: string;
  actorName: string | null;
  ip: string | null;
  createdAt: string;
};

export type AgentLevel = {
  id: string;
  name: string;
  rank: number;
  minActiveVendors: number;
  minDeliveredSales: string;
  minPerformanceScore: number | null;
  commissionPercent: string | null;
  bonusAmount: string | null;
  perks: string[];
  isActive: boolean;
  agentCount?: number;
};

export type LevelInput = {
  name: string;
  rank: number;
  minActiveVendors: number;
  minDeliveredSales: string;
  minPerformanceScore: number | null;
  commissionPercent: string | null;
  bonusAmount: string | null;
  perks: string[];
  isActive: boolean;
};

export type RateOverride = {
  id: string;
  scope: "VENDOR" | "AGENT" | "CATEGORY";
  vendorId: string | null;
  agentId: string | null;
  categoryId: string | null;
  targetName: string | null;
  ratePercent: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  note: string | null;
  endedAt: string | null;
  createdAt: string;
};

export type BonusRule = {
  id: string;
  name: string;
  description: string | null;
  scope: "PER_VENDOR" | "PER_AGENT";
  metric: "DELIVERED_ORDERS" | "DELIVERED_SALES" | "ACTIVE_VENDORS" | "NEW_VENDORS";
  threshold: string;
  amount: string;
  recurrence: "ONE_TIME" | "MONTHLY";
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
  awardCount?: number;
};

export type AdminAgent = {
  id: string;
  agentCode: string;
  name: string;
  email: string;
  phone: string | null;
  status: AgentStatus;
  avatar: string | null;
  referralCode: string;
  statusReason?: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  level: { id: string; name: string; rank: number } | null;
  activeVendorCount?: number;
};

export type AgentDetail = {
  agent: AdminAgent & { approvedAt: string | null };
  vendorLinks: Array<{
    id: string;
    source: string;
    startedAt: string;
    endedAt: string | null;
    note: string | null;
    vendor: { id: string; storeName: string; status: string; avatar: string | null };
  }>;
};

export type RateResolution =
  | { status: "RESOLVED"; source: RateSource; refId: string | null; ratePercent: string; trace: Array<{ source: RateSource; outcome: string; detail: string }> }
  | { status: "NOT_CONFIGURED"; reason: string; trace: Array<{ source: RateSource; outcome: string; detail: string }> };

type Paged<T> = { items: T[]; total: number; page: number; limit: number };

const qs = (p: Record<string, string | number | undefined | null>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== null && v !== "") s.set(k, String(v));
  const out = s.toString();
  return out ? `?${out}` : "";
};

const api = apiSlice.enhanceEndpoints({
  addTagTypes: ["AgentSettings", "AgentAudit", "AgentLevels", "AgentOverrides", "AgentBonusRules", "AgentAdmin", "AgentCommissions", "AgentWithdrawals", "AgentTraining", "AgentWallet", "AgentChat"],
});

export const agentAdminApi = api.injectEndpoints({
  endpoints: (b) => ({
    // settings
    getAgentSettings: b.query<AgentSettingsResponse, void>({
      query: () => "/admin/agents/settings",
      transformResponse: unwrap<AgentSettingsResponse>,
      providesTags: ["AgentSettings"],
    }),
    updateAgentSettings: b.mutation<AgentSettingsResponse, Partial<Record<SettingKey, unknown>>>({
      query: (body) => ({ url: "/admin/agents/settings", method: "PATCH", body }),
      transformResponse: unwrap<AgentSettingsResponse>,
      invalidatesTags: ["AgentSettings", "AgentAudit"],
    }),
    getAgentAudit: b.query<Paged<AuditEntry>, { entity?: string; entityId?: string; page?: number; limit?: number }>({
      query: (p) => `/admin/agents/audit${qs(p)}`,
      transformResponse: unwrap<Paged<AuditEntry>>,
      providesTags: ["AgentAudit"],
    }),
    // levels
    listAgentLevels: b.query<AgentLevel[], void>({
      query: () => "/admin/agents/levels",
      transformResponse: unwrap<AgentLevel[]>,
      providesTags: ["AgentLevels"],
    }),
    createAgentLevel: b.mutation<AgentLevel, LevelInput>({
      query: (body) => ({ url: "/admin/agents/levels", method: "POST", body }),
      transformResponse: unwrap<AgentLevel>,
      invalidatesTags: ["AgentLevels", "AgentAudit"],
    }),
    updateAgentLevel: b.mutation<AgentLevel, { id: string; body: Partial<LevelInput> }>({
      query: ({ id, body }) => ({ url: `/admin/agents/levels/${id}`, method: "PATCH", body }),
      transformResponse: unwrap<AgentLevel>,
      invalidatesTags: ["AgentLevels", "AgentAudit"],
    }),
    deleteAgentLevel: b.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/admin/agents/levels/${id}`, method: "DELETE" }),
      transformResponse: unwrap<{ deleted: boolean }>,
      invalidatesTags: ["AgentLevels", "AgentAudit"],
    }),
    // overrides
    listAgentOverrides: b.query<Paged<RateOverride>, { scope?: string; active?: string; page?: number; limit?: number }>({
      query: (p) => `/admin/agents/overrides${qs(p)}`,
      transformResponse: unwrap<Paged<RateOverride>>,
      providesTags: ["AgentOverrides"],
    }),
    createAgentOverride: b.mutation<RateOverride, { scope: string; targetId: string; ratePercent: string; effectiveTo?: string | null; note?: string; replaceExisting?: boolean }>({
      query: (body) => ({ url: "/admin/agents/overrides", method: "POST", body }),
      transformResponse: unwrap<RateOverride>,
      invalidatesTags: ["AgentOverrides", "AgentAudit"],
    }),
    endAgentOverride: b.mutation<RateOverride, { id: string; note?: string }>({
      query: ({ id, note }) => ({ url: `/admin/agents/overrides/${id}/end`, method: "POST", body: note ? { note } : {} }),
      transformResponse: unwrap<RateOverride>,
      invalidatesTags: ["AgentOverrides", "AgentAudit"],
    }),
    agentRatePreview: b.query<{ agentId: string | null; resolution: RateResolution }, { agentId?: string; vendorId?: string; categoryId?: string }>({
      query: (p) => `/admin/agents/rate-preview${qs(p)}`,
      transformResponse: unwrap<{ agentId: string | null; resolution: RateResolution }>,
    }),
    // bonus rules
    listAgentBonusRules: b.query<BonusRule[], void>({
      query: () => "/admin/agents/bonus-rules",
      transformResponse: unwrap<BonusRule[]>,
      providesTags: ["AgentBonusRules"],
    }),
    createAgentBonusRule: b.mutation<BonusRule, Record<string, unknown>>({
      query: (body) => ({ url: "/admin/agents/bonus-rules", method: "POST", body }),
      transformResponse: unwrap<BonusRule>,
      invalidatesTags: ["AgentBonusRules", "AgentAudit"],
    }),
    updateAgentBonusRule: b.mutation<BonusRule, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/admin/agents/bonus-rules/${id}`, method: "PATCH", body }),
      transformResponse: unwrap<BonusRule>,
      invalidatesTags: ["AgentBonusRules", "AgentAudit"],
    }),
    deleteAgentBonusRule: b.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/admin/agents/bonus-rules/${id}`, method: "DELETE" }),
      transformResponse: unwrap<{ deleted: boolean }>,
      invalidatesTags: ["AgentBonusRules", "AgentAudit"],
    }),
    // agents
    listAdminAgents: b.query<Paged<AdminAgent> & { statusCounts: Record<AgentStatus, number> }, { status?: string; levelId?: string; q?: string; page?: number; limit?: number }>({
      query: (p) => `/admin/agents${qs(p)}`,
      transformResponse: unwrap<Paged<AdminAgent> & { statusCounts: Record<AgentStatus, number> }>,
      providesTags: ["AgentAdmin"],
    }),
    getAdminAgent: b.query<AgentDetail, string>({
      query: (id) => `/admin/agents/${id}`,
      transformResponse: unwrap<AgentDetail>,
      providesTags: ["AgentAdmin"],
    }),
    createAdminAgent: b.mutation<{ agent: AdminAgent; inviteEmailSent: boolean }, { name: string; email: string; phone?: string; levelId?: string | null }>({
      query: (body) => ({ url: "/admin/agents", method: "POST", body }),
      transformResponse: unwrap<{ agent: AdminAgent; inviteEmailSent: boolean }>,
      invalidatesTags: ["AgentAdmin", "AgentAudit"],
    }),
    updateAdminAgent: b.mutation<unknown, { id: string; body: { name?: string; phone?: string | null; levelId?: string | null } }>({
      query: ({ id, body }) => ({ url: `/admin/agents/${id}`, method: "PATCH", body }),
      invalidatesTags: ["AgentAdmin", "AgentAudit"],
    }),
    agentStatusAction: b.mutation<AgentDetail, { id: string; action: "approve" | "suspend" | "reactivate" | "deactivate"; reason?: string }>({
      query: ({ id, action, reason }) => ({ url: `/admin/agents/${id}/${action}`, method: "POST", body: reason ? { reason } : {} }),
      transformResponse: unwrap<AgentDetail>,
      invalidatesTags: ["AgentAdmin", "AgentAudit"],
    }),
    assignAgentVendor: b.mutation<unknown, { id: string; vendorId: string; note?: string; transfer?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/admin/agents/${id}/vendors`, method: "POST", body }),
      invalidatesTags: ["AgentAdmin", "AgentAudit"],
    }),
    endAgentVendorLink: b.mutation<unknown, { linkId: string; reason?: string }>({
      query: ({ linkId, reason }) => ({ url: `/admin/agents/vendor-links/${linkId}/end`, method: "POST", body: reason ? { reason } : {} }),
      invalidatesTags: ["AgentAdmin", "AgentAudit"],
    }),
    // look-ups
    lookupAgentVendors: b.query<Array<{ id: string; storeName: string; status: string; currentAgent: { id: string; name: string; agentCode: string } | null }>, string>({
      query: (q) => `/admin/agents/lookup/vendors${qs({ q })}`,
      transformResponse: unwrap<Array<{ id: string; storeName: string; status: string; currentAgent: { id: string; name: string; agentCode: string } | null }>>,
    }),
    lookupAgentCategories: b.query<Array<{ id: string; name: string; parent: { name: string } | null }>, string>({
      query: (q) => `/admin/agents/lookup/categories${qs({ q })}`,
      transformResponse: unwrap<Array<{ id: string; name: string; parent: { name: string } | null }>>,
    }),
    lookupAgents: b.query<Array<{ id: string; name: string; agentCode: string; status: AgentStatus }>, string>({
      query: (q) => `/admin/agents/lookup/agents${qs({ q })}`,
      transformResponse: unwrap<Array<{ id: string; name: string; agentCode: string; status: AgentStatus }>>,
    }),
    // commissions (Phase 6)
    listAgentCommissions: b.query<AdminCommissionList, AdminCommissionQuery & { page?: number; limit?: number }>({
      query: (p) => `/admin/agents/commissions${qs(p)}`,
      transformResponse: unwrap<AdminCommissionList>,
      providesTags: ["AgentCommissions"],
    }),
    /** CSV text of the filtered list (server cap: 5,000 rows). */
    exportAgentCommissions: b.query<string, AdminCommissionQuery>({
      query: (p) => ({ url: `/admin/agents/commissions/export${qs(p)}`, responseHandler: (r: Response) => r.text() }),
      keepUnusedDataFor: 0,
    }),
    // withdrawals and accrual re-run (Phase 7)
    listAgentWithdrawals: b.query<AdminWithdrawalList, { status?: AdminWithdrawalStatus; agentId?: string; page?: number; limit?: number }>({
      query: (p) => `/admin/agents/withdrawals${qs(p)}`,
      transformResponse: unwrap<AdminWithdrawalList>,
      providesTags: ["AgentWithdrawals"],
    }),
    getAgentWithdrawal: b.query<AdminWithdrawalDetail, string>({
      query: (id) => `/admin/agents/withdrawals/${id}`,
      transformResponse: unwrap<AdminWithdrawalDetail>,
      providesTags: ["AgentWithdrawals"],
    }),
    agentWithdrawalAction: b.mutation<
      AdminWithdrawalRow,
      { id: string; action: "approve" } | { id: string; action: "reject"; reason: string } | { id: string; action: "mark-paid"; transactionRef: string; note?: string }
    >({
      query: ({ id, action, ...body }) => ({ url: `/admin/agents/withdrawals/${id}/${action}`, method: "POST", body }),
      transformResponse: unwrap<AdminWithdrawalRow>,
      invalidatesTags: ["AgentWithdrawals", "AgentAudit"],
    }),
    rerunAgentAccrual: b.mutation<AccrualRerunResult, string>({
      query: (deliveryId) => ({ url: `/admin/agents/deliveries/${encodeURIComponent(deliveryId)}/accrue`, method: "POST" }),
      transformResponse: unwrap<AccrualRerunResult>,
      invalidatesTags: ["AgentCommissions", "AgentAudit"],
    }),
    // growth (Phase 9), wallet adjustment, payable report
    evaluateAgentLevels: b.mutation<LevelEvaluationResult, { agentId?: string }>({
      query: (body) => ({ url: "/admin/agents/levels/evaluate", method: "POST", body }),
      transformResponse: unwrap<LevelEvaluationResult>,
      invalidatesTags: ["AgentAdmin", "AgentLevels", "AgentAudit", "AgentWallet"],
    }),
    listAgentTraining: b.query<TrainingList, { category?: string; q?: string; page?: number; limit?: number }>({
      query: (p) => `/admin/agents/training${qs(p)}`,
      transformResponse: unwrap<TrainingList>,
      providesTags: ["AgentTraining"],
    }),
    saveAgentTraining: b.mutation<TrainingResource, { id?: string; body: TrainingInput }>({
      query: ({ id, body }) => ({ url: id ? `/admin/agents/training/${id}` : "/admin/agents/training", method: id ? "PATCH" : "POST", body }),
      transformResponse: unwrap<TrainingResource>,
      invalidatesTags: ["AgentTraining", "AgentAudit"],
    }),
    deleteAgentTraining: b.mutation<unknown, string>({
      query: (id) => ({ url: `/admin/agents/training/${id}`, method: "DELETE" }),
      invalidatesTags: ["AgentTraining", "AgentAudit"],
    }),
    getAdminAgentWallet: b.query<AdminAgentWallet, string>({
      query: (id) => `/admin/agents/${id}/wallet`,
      transformResponse: unwrap<AdminAgentWallet>,
      providesTags: ["AgentWallet"],
    }),
    adjustAgentWallet: b.mutation<{ replayed: boolean }, { id: string; clientRequestId: string; amount: string; reason: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/agents/${id}/wallet/adjustments`, method: "POST", body }),
      transformResponse: unwrap<{ replayed: boolean }>,
      invalidatesTags: ["AgentWallet", "AgentAudit"],
    }),
    // agent chat (P10): staff list; reading / replying uses the existing chat API
    listAgentChats: b.query<AgentChatList, { type?: "AGENT_SUPPORT" | "AGENT_VENDOR"; agentId?: string; page?: number; limit?: number }>({
      query: (p) => `/admin/agents/chat/conversations${qs(p)}`,
      transformResponse: unwrap<AgentChatList>,
      providesTags: ["AgentChat"],
    }),
    openAgentChat: b.mutation<{ id: string }, string>({
      query: (agentId) => ({ url: `/admin/agents/${agentId}/chat`, method: "POST" }),
      transformResponse: unwrap<{ id: string }>,
      invalidatesTags: ["AgentChat"],
    }),
    agentPayableReport: b.query<PayableReport, { page?: number; limit?: number }>({
      query: (p) => `/admin/agents/reports/payable${qs(p)}`,
      transformResponse: unwrap<PayableReport>,
      providesTags: ["AgentWallet"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAgentSettingsQuery,
  useUpdateAgentSettingsMutation,
  useGetAgentAuditQuery,
  useListAgentLevelsQuery,
  useCreateAgentLevelMutation,
  useUpdateAgentLevelMutation,
  useDeleteAgentLevelMutation,
  useListAgentOverridesQuery,
  useCreateAgentOverrideMutation,
  useEndAgentOverrideMutation,
  useAgentRatePreviewQuery,
  useListAgentBonusRulesQuery,
  useCreateAgentBonusRuleMutation,
  useUpdateAgentBonusRuleMutation,
  useDeleteAgentBonusRuleMutation,
  useListAdminAgentsQuery,
  useGetAdminAgentQuery,
  useCreateAdminAgentMutation,
  useUpdateAdminAgentMutation,
  useAgentStatusActionMutation,
  useAssignAgentVendorMutation,
  useEndAgentVendorLinkMutation,
  useLookupAgentVendorsQuery,
  useLookupAgentCategoriesQuery,
  useLookupAgentsQuery,
  useListAgentCommissionsQuery,
  useLazyExportAgentCommissionsQuery,
  useListAgentWithdrawalsQuery,
  useGetAgentWithdrawalQuery,
  useAgentWithdrawalActionMutation,
  useRerunAgentAccrualMutation,
  useEvaluateAgentLevelsMutation,
  useListAgentTrainingQuery,
  useSaveAgentTrainingMutation,
  useDeleteAgentTrainingMutation,
  useGetAdminAgentWalletQuery,
  useAdjustAgentWalletMutation,
  useAgentPayableReportQuery,
  useListAgentChatsQuery,
  useOpenAgentChatMutation,
} = agentAdminApi;

// ── commissions (Phase 6) — money as ৳ decimal strings ─────────────────────
export type AdminCommissionStatus = "PENDING" | "AVAILABLE" | "PARTIALLY_REVERSED" | "REVERSED";
export type AdminCommissionQuery = {
  status?: "ALL" | AdminCommissionStatus;
  agentId?: string;
  vendorId?: string;
  from?: string;
  to?: string;
};
export type AdminCommissionRow = {
  id: string;
  ref: string;
  agentId: string;
  agentName: string;
  agentCode: string | null;
  levelName: string | null;
  orderId: string;
  orderNumber: string | null;
  vendorId: string;
  storeName: string;
  quantity: number;
  reversedQty: number;
  baseAmount: string;
  ratePercent: string;
  rateSource: string;
  amount: string;
  reversedAmount: string;
  netAmount: string;
  status: AdminCommissionStatus;
  earnedAt: string;
  availableAt: string;
};
export type AdminCommissionList = {
  items: AdminCommissionRow[];
  total: number;
  page: number;
  limit: number;
  totals: { earned: string; reversed: string; net: string };
};

// ── withdrawals (Phase 7) ─────────────────────────────────────────────────
export type AdminWithdrawalStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "PAID" | "CANCELLED";
export type AdminWithdrawalRow = {
  id: string;
  ref: string;
  amount: string;
  fee: string;
  netAmount: string;
  status: AdminWithdrawalStatus;
  autoApproved: boolean;
  method: { type: PayoutMethod | null; label: string; accountName: string | null; accountNumberMasked: string; bankName: string | null };
  rejectReason: string | null;
  transactionRef: string | null;
  reviewedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  agent?: { id: string; name: string; agentCode: string | null; status: AgentStatus | null };
};
export type AdminWithdrawalList = {
  items: AdminWithdrawalRow[];
  total: number;
  page: number;
  limit: number;
  summary: Partial<Record<AdminWithdrawalStatus, { count: number; amount: string }>>;
};
export type AdminWithdrawalDetail = Omit<AdminWithdrawalRow, "method" | "agent"> & {
  method: AdminWithdrawalRow["method"] & { accountNumber: string | null; branch: string | null; routingNumber: string | null };
  agent: { id: string; name: string; agentCode: string; status: AgentStatus; email: string; phone: string | null } | null;
  wallet: { available: string; onHold: string; pendingClearance: string } | null;
  ledger: Array<{ id: string; type: string; amount: string; balanceAfter: string; createdAt: string }>;
  settingsSnapshot: Record<string, unknown>;
};
export type AccrualRerunResult =
  | { deliveryId: string; status: "DONE"; created: number; existing: number }
  | { deliveryId: string; status: "SKIPPED"; reason: string; detail?: string };

// ── growth (Phase 9) and wallet tools ─────────────────────────────────────
export type LevelEvaluationResult =
  | { evaluated: number; upgraded: number; failed: number; upgrades: Array<{ agentId: string; to: string }> }
  | { status: "UPGRADED" | "UNCHANGED"; agentId: string; reason?: string; to?: { id: string; name: string } };
export type TrainingResource = {
  id: string;
  category: string;
  title: string;
  summary: string | null;
  body: string | null;
  url: string | null;
  coverImage: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};
export type TrainingInput = Partial<Omit<TrainingResource, "id" | "createdAt" | "updatedAt">>;
export type TrainingList = { items: TrainingResource[]; total: number; page: number; limit: number; categories: Array<{ category: string; count: number }> };
export type AdminAgentWallet = {
  available: string;
  pendingClearance: string;
  onHold: string;
  totalEarned: string;
  totalWithdrawn: string;
  negative: boolean;
  agentStatus: AgentStatus;
  ledger: Array<{ id: string; type: string; amount: string; balanceAfter: string; refType: string; note: string | null; createdById: string | null; createdAt: string }>;
};
export type PayableReport = {
  totals: { availableToWithdraw: string; onHold: string; pendingClearance: string; totalOwed: string; negativeBalances: string };
  items: Array<{ agentId: string; name: string; agentCode: string | null; status: AgentStatus | null; available: string; onHold: string; pendingClearance: string; totalWithdrawn: string; updatedAt: string }>;
  total: number;
  page: number;
  limit: number;
  asOf: string;
};

// ── agent chat (P10) ──────────────────────────────────────────────────────
export type AgentChatRow = {
  id: string;
  type: "AGENT_SUPPORT" | "AGENT_VENDOR";
  status: string;
  lastMessageAt: string | null;
  lastMessageText: string | null;
  awaitingStaff: boolean;
  agent: { id: string; displayName: string | null; displayImage: string | null } | null;
  vendor: { id: string; displayName: string | null; displayImage: string | null } | null;
  staffMayWrite: boolean;
  readOnlyReason: string | null;
  notice: string;
};
export type AgentChatList = { items: AgentChatRow[]; total: number; page: number; limit: number };

/** Message from an RTK Query error (the backend sends { message, code, details }). */
export function apiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  const data = (error as { data?: { message?: string } } | undefined)?.data;
  return typeof data?.message === "string" ? data.message : fallback;
}

/** Field errors from a 400 VALIDATION_ERROR (zod errors or details.errors). */
export function apiFieldErrors(error: unknown): Record<string, string> {
  const data = (error as { data?: { errors?: Record<string, string>; details?: { errors?: Record<string, string> } } } | undefined)?.data;
  return data?.errors ?? data?.details?.errors ?? {};
}
