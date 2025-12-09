// types/type.ts

// -------- Base Types --------
export interface Vendor {
  id: string;
  storeName: string;
  avatar: string;
  verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED";
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  parentId?: string;
  keywords: string[];
  tags: string[];
  parent?: Category;
  children?: Category[];
  attributes?: CategoryAttribute[];
  categoryTemplate?: CategoryTemplate;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTemplate {
  id: string;
  categoryId: string;
  filePath: string;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

// -------- Attribute System --------
export type AttributeType =
  | "TEXT"
  | "NUMBER"
  | "SELECT"
  | "MULTISELECT"
  | "BOOLEAN";

export interface Attribute {
  isRequired?: unknown;
  id: string;
  name: string;
  slug: string;
  type: AttributeType;
  unit?: string;
  values?: AttributeValue[];
  categories?: CategoryAttribute[];
  createdAt: string;
  updatedAt: string;
}

export interface AttributeValue {
  id: string;
  value: string;
  attributeId: string;
  attribute?: Attribute;
  createdAt: string;
  updatedAt: string;
}

// Category-Attribute Junction
export interface CategoryAttribute {
  id: string;
  categoryId: string;
  attributeId: string;
  isRequired: boolean;
  filterable: boolean;
  sortOrder: number;

  // Relations
  attribute?: Attribute;
  category?: Category;

  // For frontend convenience (if needed)
  name?: string;
  type?: AttributeType;
  unit?: string;
  values?: AttributeValue[];

  createdAt: string;
  updatedAt: string;
}

// -------- Variant Name Parts for Frontend --------
export interface VariantNamePart {
  name: string;
  value: any;
  displayValue?: string;
  include: boolean;
}

// -------- Create Specification Data (legacy - can be updated or removed) --------
export interface CreateSpecificationData {
  name: string;
  type: AttributeType;
  unit?: string;
  filterable?: boolean;
  isRequired?: boolean;
  categoryId: string;
  options?: string[];
}

// -------- API Response --------
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
