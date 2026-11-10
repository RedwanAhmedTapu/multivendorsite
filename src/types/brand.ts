// types/brand.ts

// ======================
// Enums (mirror Prisma schema)
// ======================

export type BrandStatus = "PENDING" | "APPROVED" | "REJECTED";

export type BrandRelationship =
  | "BRAND_OWNER"
  | "EXCLUSIVE_DISTRIBUTOR"
  | "NON_EXCLUSIVE_DISTRIBUTOR"
  | "RESELLER";

export type LinkType =
  | "OFFICIAL_WEBSITE"
  | "FACEBOOK"
  | "INSTAGRAM"
  | "X"
  | "YOUTUBE"
  | "LINKEDIN"
  | "TIKTOK"
  | "OTHER";

// ======================
// Core entities
// ======================

export interface BrandLink {
  id: string;
  brandId: string;
  type: LinkType;
  title: string | null;
  url: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  storeName: string;
  avatar?: string | null;
  verificationStatus?: string;
}

export interface Brand {
  id: string;
  vendorId: string;
  vendor?: Vendor;

  name: string;
  relationship: BrandRelationship;

  authorizationStart: string;
  authorizationEnd: string | null;
  hasEndDate: boolean;

  authenticationDoc: string | null;

  status: BrandStatus;

  createdAt: string;
  updatedAt: string;

  links: BrandLink[];
}

// ======================
// Link input (used when creating/updating a brand)
// ======================

export interface BrandLinkInput {
  type: LinkType;
  title?: string;
  url: string;
}

// ======================
// Create / Update payloads
// ======================

export interface CreateBrandData {
  name: string;
  relationship: BrandRelationship;
  authorizationStart: string;
  authorizationEnd?: string;
  hasEndDate?: boolean;
  authenticationDoc?: string;
  links?: BrandLinkInput[];
}

export interface UpdateBrandData {
  name?: string;
  relationship?: BrandRelationship;
  authorizationStart?: string;
  authorizationEnd?: string;
  hasEndDate?: boolean;
  authenticationDoc?: string;
  links?: BrandLinkInput[];
}

// ======================
// Query option shapes (used by the API slice / vendor service)
// ======================

export interface GetMyBrandsOptions {
  status?: BrandStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}