// types/type.ts

import { ProductSpecificationValue } from "./product";

// -------- Base Types --------
export interface Vendor {
  id: string;
  storeName: string;
  avatar:string,
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  image?:string;
  slug: string; 
  parentId?: string;
  parent?: Category;
  children?: Category[];
  attributes?: Attribute[];
  specifications?: Specification[];
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
export type AttributeType = "TEXT" | "NUMBER" | "SELECT" | "BOOLEAN";

export interface Attribute {
  id: string;
  name: string;
  type: AttributeType;
  categoryId: string;
  category?: Category;
  values?: AttributeValue[];
  createdAt: string;
  updatedAt: string;
}

export interface AttributeValue {
  id: string;
  attributeId: string;
  attribute?: Attribute;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryAttribute {
  id: string;
  name?: string;
  type?: string;
  values?: AttributeValue[]; // <-- fix here
  categoryId: string;
  category?: Category;
  attributeId: string;
  attribute?: Attribute;
  isRequired: boolean;
  isForVariant: boolean;
  filterable: boolean;
  createdAt: string;
  updatedAt: string;
}

// -------- Specification System --------
export type SpecificationType = "TEXT" | "NUMBER" | "SELECT" | "BOOLEAN";

export interface Specification {
  id: string;
  name: string;
  slug: string;
  type: SpecificationType;
  unit?: string;
  categories?: CategorySpecification[];
  values?: ProductSpecificationValue[];
  options?: SpecificationOption[];
  createdAt: string;
  updatedAt: string;
}

export interface SpecificationOption {
  id: string;
  specificationId: string;
  value: string;
  
  createdAt: string;
  updatedAt: string;
}
export interface CreateSpecificationData {
  name: string;
  type: SpecificationType;
  unit?: string;
  filterable?: boolean;
  isRequired?: boolean;
  categoryId: string;
  options?: string[];
}
export interface CategorySpecification {
  id: string;
  name?:string;
  type?:string;
  unit?:string;
  categoryId: string;
  category?: Category;
  specificationId: string;
  specification?: Specification;
  options?:SpecificationOption[];
  isRequired: boolean;
  filterable: boolean;
  createdAt: string;
  updatedAt: string;
}

// -------- Variant Name Parts for Frontend --------
export interface VariantNamePart {
  name: string;
  value: any;
  include: boolean;
}

// -------- API Response --------
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
