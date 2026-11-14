// components/vendor-performance/types.ts
//
// Contracts for the admin vendor-performance surface (Phase 4). Field names
// mirror the Express responses in multivendorbackend
// src/modules/vendor-performance/*; optional/nullable fields are typed as they
// arrive over JSON (Dates become ISO strings).

export type Grade = "A" | "B" | "C" | "D" | "NOT_ENOUGH_DATA" | "AT_RISK";

export interface LocalizedText {
  en: string;
  bn: string;
}

export interface ScoreFlag {
  code: string;
  severity: "warning" | "critical";
  message: string;
  value?: number | null;
}

/** Phase 3.5 rows carry { en, bn }; older rows still carry a plain string. */
export interface ChecklistAction {
  code: string;
  message: LocalizedText | string;
  impact: number;
}

export interface VendorRef {
  id: string;
  storeName: string;
  avatar?: string | null;
  status: string;
  vatRegistered?: boolean;
}

export interface PerformanceMetrics {
  orderCount: number;
  acceptRate: number | null;
  medianAcceptMinutes: number | null;
  onTimeDispatchRate: number | null;
  avgDispatchDelayHours: number | null;
  /** Always null: no vendor-initiated cancel flow exists yet. */
  vendorCancelRate: number | null;
  /** Admin cancel reasons that fault the vendor (stock / vendor unable). */
  vendorFaultCancelRate: number | null;
  qualifiedProductCount: number | null;
  avgCompletenessPct: number | null;
  /** Gross, pre-commission and pre-refund. */
  grossRevenue: number | null;
  revenueGrowthPct: number | null;
  repeatBuyerRate: number | null;
  avgRating: number | null;
  returnRate: number | null;
  refundRate: number | null;
  kycValidWeightPct: number | null;
  kycStatus: string | null;
  lastLoginAt: string | null;
  activeDays30: number | null;
}

export interface ScoreView {
  overallScore: number | null;
  grade: Grade;
  coveragePct: number | null;
  groupScores: Record<string, number | null> | null;
  flags: ScoreFlag[] | null;
}

export interface PerformanceSnapshotView {
  vendorId: string;
  day: string;
  periodDays: number;
  configVersion: string | null;
  metrics: PerformanceMetrics;
  score: ScoreView;
  sampleSizes: Record<string, number> | null;
  checklist: ChecklistAction[] | null;
}

export interface PreviousSnapshot {
  day: string | null;
  overallScore: number | null;
  grade: string | null;
}

export interface PerformanceListItem extends PerformanceSnapshotView {
  vendor: VendorRef;
  previous: PreviousSnapshot | null;
}

export interface PerformanceListQuery {
  page: number;
  limit: number;
  search?: string;
  grade?: string;
  kycStatus?: string;
  sort?: string;
}

export interface PerformanceListResponse {
  success: boolean;
  day: string | null;
  previousDay: string | null;
  items: PerformanceListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GradeCount {
  grade: string;
  count: number;
}

export interface CoverageBucket {
  min: number;
  max: number;
  count: number;
}

export interface GroupScoreAverage {
  average: number;
  sampleSize: number;
}

export interface DistributionResponse {
  success: boolean;
  day: string | null;
  total: number;
  averageScore: number | null;
  scoredVendors: number;
  needsAttention: number;
  grades: GradeCount[];
  coverage: { buckets: CoverageBucket[]; unknown: number };
  groupAverages: Record<string, GroupScoreAverage>;
}

export interface HistoryDay {
  day: string;
  overallScore: number | null;
  grade: string | null;
  coveragePct: number | null;
  configVersion: string | null;
  orderCount: number | null;
  acceptRate: number | null;
  onTimeDispatchRate: number | null;
  vendorFaultCancelRate: number | null;
  grossRevenue: number | null;
}

export interface HistoryResponse {
  success: boolean;
  vendorId: string;
  days: HistoryDay[];
}

export type CatalogIssueCode =
  | "IMAGES"
  | "DESCRIPTION"
  | "PRICE"
  | "STOCK"
  | "CATEGORY"
  | "INACTIVE";

export interface CatalogIssue {
  code: CatalogIssueCode;
  actual: number;
  target: number;
}

export interface CatalogItem {
  id: string;
  name: string;
  completenessScore: number;
  qualified: boolean;
  issues: CatalogIssue[];
}

export interface CatalogResponse {
  success: boolean;
  vendorId: string;
  summary: {
    total: number;
    qualified: number;
    averageCompletenessPct: number | null;
    minImages: number;
    minDescriptionChars: number;
  };
  items: CatalogItem[];
}

export type KycState =
  | "VALID"
  | "EXPIRING_SOON"
  | "EXPIRY_UNKNOWN"
  | "EXPIRED"
  | "MISSING"
  | "REJECTED";

export interface KycNotice {
  window: number;
  notifiedAt: string;
}

export interface KycDocument {
  id: string;
  type: string;
  label: string;
  status: string;
  state: KycState;
  requiresExpiry: boolean;
  expiresAt: string | null;
  createdAt: string;
  daysLeft: number | null;
  graceDaysLeft: number | null;
  notices: KycNotice[];
}

export interface KycResponse {
  success: boolean;
  vendorId: string;
  evaluatedAt: string;
  graceDays: number;
  restrictedAt: string | null;
  /** VALID | EXPIRING_SOON | EXPIRY_UNKNOWN | MISSING | EXPIRED | null */
  headline: string | null;
  validWeightPct: number | null;
  restricted: boolean;
  documents: KycDocument[];
}

export interface ExpiryMissingItem {
  vendor: { id: string; storeName: string; status: string };
  document: {
    id: string;
    type: string;
    typeLabel: string;
    status: string;
    filePath: string;
    createdAt: string;
    /** updatedAt proxy — VendorDocument has no verifiedAt column. */
    verifiedAt: string;
  };
}

export interface ExpiryMissingResponse {
  success: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: ExpiryMissingItem[];
}

export interface SetExpiryResponse {
  success: boolean;
  changed: boolean;
  revived: boolean;
  document: {
    id: string;
    type: string;
    expiresAt: string | null;
    status: string;
  };
}

export interface RunSnapshotFields {
  overallScore: number | null;
  grade: Grade;
  coveragePct: number | null;
  groupScores: Record<string, number | null> | null;
  flags: ScoreFlag[] | null;
  orderCount: number;
  qualifiedProductCount: number | null;
  avgCompletenessPct: number | null;
  configVersion?: string;
}

export interface RunResponse {
  success: boolean;
  dryRun: boolean;
  vendorId: string;
  day: string;
  snapshot: RunSnapshotFields;
  productCompleteness: {
    productId: string;
    completenessScore: number;
    current: number | null;
    written: boolean;
  }[];
}

export interface MetricRule {
  key: string;
  weight: number;
  scale: "linear" | "cap" | "identity";
  at100?: number;
  at0?: number;
  target?: number;
}

export interface ScoreGroup {
  key: string;
  label: string;
  weight: number;
  metrics: MetricRule[];
}

export interface GradeBand {
  grade: string;
  min: number;
}

export interface ScoreConfig {
  version: string;
  notEnoughDataCoveragePct: number;
  atRiskScoreCap: number;
  catalogFlagMinProducts: number;
  gradeBands: GradeBand[];
  groups: ScoreGroup[];
}

export interface ConfigResponse {
  success: boolean;
  source: "database" | "default";
  version: string;
  config: ScoreConfig;
  note: string | null;
  createdAt: string | null;
  shadowMode: { visibleToVendors: boolean };
}

export interface PublishConfigResponse {
  success: boolean;
  id: string;
  version: string;
  isActive: boolean;
  config: ScoreConfig;
  note: string | null;
  createdAt: string | null;
}
