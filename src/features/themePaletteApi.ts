// features/themePaletteApi.ts
//
// ADMIN theme-palette management endpoints (Part 3 — backend:
// routes/theme.routes.ts → /api/themes/palettes…, service:
// services/theme-palette.service.ts). Every endpoint here sits behind the
// backend admin chain [authenticateUser, authorizeRoles('ADMIN','EMPLOYEE'),
// blockVendorEmployees, requirePermission('themeManagement')] — this slice
// only talks to the API; the backend is the real security boundary.
//
// Kept separate from features/themeApi.ts (layout themes) so cache tags can
// never collide with the layout/theme cache.
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";
import type { PaletteTokens } from "@/lib/palette/tokens";

// ── enums (mirror the Prisma enums from Part 2) ──────────────────────────────
export type PaletteKind = "PRESET" | "CUSTOM";
export type PaletteStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ThemeScopeValue =
  | "PLATFORM_WEBSITE"
  | "ADMIN_DASHBOARD"
  | "VENDOR_DASHBOARD"
  | "VENDOR_STOREFRONT"
  | "CUSTOMER_DEFAULT";

// ── row shapes (mirror the service return values exactly) ────────────────────

/** service.listPalettes() row. */
export interface PaletteSummary {
  id: string;
  name: string;
  description: string | null;
  kind: PaletteKind;
  status: PaletteStatus;
  version: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignmentCount: number;
  versionCount: number;
}

export interface ThemeAssignmentRow {
  id: string;
  paletteId: string;
  scope: ThemeScopeValue;
  scopeId: string;
  overrides: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
}

/** service.getPalette() — the full ThemePalette row with assignments. */
export interface PaletteDetail {
  id: string;
  name: string;
  description: string | null;
  kind: PaletteKind;
  status: PaletteStatus;
  tokens: PaletteTokens;
  darkTokens: PaletteTokens | null;
  version: number;
  publishedAt: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  assignments: ThemeAssignmentRow[];
  _count: { versions: number };
}

/** Mutations (update/publish/rollback/…) return the bare ThemePalette row. */
export type PaletteRow = Omit<PaletteDetail, "assignments" | "_count">;

/** service.listAssignments() row (ThemeAssignment with the palette joined). */
export interface AssignmentRow {
  id: string;
  paletteId: string;
  scope: ThemeScopeValue;
  scopeId: string;
  overrides: Record<string, string> | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  palette: { id: string; name: string; status: PaletteStatus; version: number };
}

export interface UpsertAssignmentBody {
  scope: ThemeScopeValue;
  /** Only meaningful for VENDOR_STOREFRONT; forced to "" for global scopes. */
  scopeId?: string;
  paletteId: string;
}

/** service.listVersions() row — append-only publish history. */
export interface PaletteVersionRow {
  id: string;
  paletteId: string;
  version: number;
  tokens: PaletteTokens;
  darkTokens: PaletteTokens | null;
  note: string | null;
  publishedById: string | null;
  createdAt: string;
}

// ── request bodies ───────────────────────────────────────────────────────────

export interface CreatePaletteBody {
  name: string;
  description?: string;
  tokens: PaletteTokens;
  darkTokens?: PaletteTokens;
}

export interface UpdatePaletteBody {
  id: string;
  name?: string;
  description?: string | null;
  tokens?: PaletteTokens;
  /** Explicit null clears the dark overrides. */
  darkTokens?: PaletteTokens | null;
  /** Optimistic concurrency stamp (updatedAt the editor loaded). */
  expectedUpdatedAt?: string;
}

export interface PublishPaletteBody {
  id: string;
  note?: string;
}

export interface RollbackPaletteBody {
  id: string;
  version: number;
  note?: string;
}

interface Envelope<T> {
  success: true;
  data: T;
  message?: string;
}

const BASE = "/themes/palettes";

export const themePaletteApi = createApi({
  reducerPath: "themePaletteApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ThemePalette"],
  // Palette drafts carry an optimistic-concurrency stamp — never act on a
  // stale copy (same convention as productCardConfigApi).
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getPalettes: builder.query<Envelope<PaletteSummary[]>, void>({
      query: () => ({ url: BASE, method: "GET" }),
      providesTags: ["ThemePalette"],
    }),

    getPalette: builder.query<Envelope<PaletteDetail>, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "ThemePalette", id }],
    }),

    getPaletteVersions: builder.query<Envelope<PaletteVersionRow[]>, string>({
      query: (id) => ({ url: `${BASE}/${id}/versions`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "ThemePalette", id }],
    }),

    createPalette: builder.mutation<Envelope<PaletteRow>, CreatePaletteBody>({
      query: (body) => ({ url: BASE, method: "POST", body }),
      invalidatesTags: ["ThemePalette"],
    }),

    updatePalette: builder.mutation<Envelope<PaletteRow>, UpdatePaletteBody>({
      query: ({ id, ...body }) => ({ url: `${BASE}/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => ["ThemePalette", { type: "ThemePalette", id }],
    }),

    duplicatePalette: builder.mutation<Envelope<PaletteRow>, string>({
      query: (id) => ({ url: `${BASE}/${id}/duplicate`, method: "POST" }),
      invalidatesTags: ["ThemePalette"],
    }),

    publishPalette: builder.mutation<Envelope<PaletteRow>, PublishPaletteBody>({
      query: ({ id, ...body }) => ({ url: `${BASE}/${id}/publish`, method: "POST", body }),
      invalidatesTags: (_result, _error, { id }) => ["ThemePalette", { type: "ThemePalette", id }],
    }),

    archivePalette: builder.mutation<Envelope<PaletteRow>, string>({
      query: (id) => ({ url: `${BASE}/${id}/archive`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => ["ThemePalette", { type: "ThemePalette", id }],
    }),

    deletePalette: builder.mutation<Envelope<{ deleted: true }>, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: "DELETE" }),
      invalidatesTags: ["ThemePalette"],
    }),

    rollbackPalette: builder.mutation<Envelope<PaletteRow>, RollbackPaletteBody>({
      query: ({ id, ...body }) => ({ url: `${BASE}/${id}/rollback`, method: "POST", body }),
      invalidatesTags: (_result, _error, { id }) => ["ThemePalette", { type: "ThemePalette", id }],
    }),

    restorePresetDefault: builder.mutation<Envelope<PaletteRow>, string>({
      query: (id) => ({ url: `${BASE}/${id}/restore-default`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => ["ThemePalette", { type: "ThemePalette", id }],
    }),

    getAssignments: builder.query<Envelope<AssignmentRow[]>, void>({
      query: () => ({ url: "/themes/assignments", method: "GET" }),
      providesTags: ["ThemePalette"],
    }),

    upsertAssignment: builder.mutation<Envelope<AssignmentRow>, UpsertAssignmentBody>({
      query: (body) => ({ url: "/themes/assignments", method: "PUT", body }),
      invalidatesTags: ["ThemePalette"],
    }),
  }),
});

export const {
  useGetPalettesQuery,
  useGetPaletteQuery,
  useGetPaletteVersionsQuery,
  useCreatePaletteMutation,
  useUpdatePaletteMutation,
  useDuplicatePaletteMutation,
  usePublishPaletteMutation,
  useArchivePaletteMutation,
  useDeletePaletteMutation,
  useRollbackPaletteMutation,
  useRestorePresetDefaultMutation,
  useGetAssignmentsQuery,
  useUpsertAssignmentMutation,
} = themePaletteApi;
