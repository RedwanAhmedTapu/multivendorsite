// types.ts

// -------- Enums --------
export enum AttributeType {
  TEXT = "TEXT",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  SELECT = "SELECT",
}

export enum SpecificationType {
  TEXT = "TEXT",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  SELECT = "SELECT",
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

// -------- Vendor --------
export interface Vendor {
  id: number;
  name: string;
  email: string;
  password: string;
  storeName: string;
  avatar?: string;
  products: Product[];
  orders: Order[];
  createdAt: string;
  updatedAt: string;
}

// -------- Category --------
export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  parentId?: string;
  parent?: Category;
  children: Category[];
  products: Product[];
  attributes: CategoryAttribute[];
  specifications: CategorySpecification[];
  createdAt: string;
  updatedAt: string;
}

// -------- Attribute --------
export interface Attribute {
  id: string;
  name: string;
  slug: string;
  type: AttributeType;
  values: AttributeValue[];
  categories: CategoryAttribute[];
  createdAt: string;
  updatedAt: string;
}

export interface AttributeValue {
  id: string;
  value: string;
  attributeId: string;
  attribute: Attribute;
  variants: ProductVariantAttribute[];
  createdAt: string;
  updatedAt: string;
}

// -------- CategoryAttribute (Join table) --------
export interface CategoryAttribute {
  id: string;
  categoryId: string;
  category: Category;
  attributeId: string;
  attribute: Attribute;
  isRequired: boolean;
  isForVariant: boolean;
  filterable: boolean;
  createdAt: string;
  updatedAt: string;
}

// -------- Specification --------
export interface Specification {
  id: string;
  name: string;
  slug: string;
  type: SpecificationType;
  unit?: string;
  categories: CategorySpecification[];
  values: ProductSpecificationValue[];
  options: SpecificationOption[]; // ✅ has options
  createdAt: string;
  updatedAt: string;
}
export interface SpecificationOption {
  id: string;
  specificationId: string;
  value: string;
  createdAt: string;  // ISO date string from backend
  updatedAt: string;  // ISO date string from backend
}


// -------- SpecificationOption --------
export interface CategorySpecification {
  id: string;
  categoryId: string;
  category: Category;
  specificationId: string;
  specification: Specification;  // ✅ contains the Specification
  isRequired: boolean;
  filterable: boolean;
  createdAt: string;
  updatedAt: string;
}


// -------- CategorySpecification (Join table) --------
export interface CategorySpecification {
  id: string;
  categoryId: string;
  category: Category;
  specificationId: string;
  specification: Specification;
  isRequired: boolean;
  filterable: boolean;
  createdAt: string;
  updatedAt: string;
}

// -------- Product --------
export interface Product {
  id: string;
  name: string;
  description?: string;
  slug: string;
  vendorId: number;
  vendor: Vendor;
  categoryId: string;
  category: Category;
  variants: ProductVariant[];
  specifications: ProductSpecificationValue[];
  createdAt: string;
  updatedAt: string;
}

// -------- ProductVariant --------
export interface ProductVariant {
  id: string;
  productId: string;
  product: Product;
  name?: string;
  sku: string;
  price: number;
  stock: number;
  weight?: number;
  images: string[];
  attributes: ProductVariantAttribute[];
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// -------- ProductVariantAttribute (Join table) --------
export interface ProductVariantAttribute {
  id: string;
  variantId: string;
  variant: ProductVariant;
  attributeValueId: string;
  attributeValue: AttributeValue;
  createdAt: string;
  updatedAt: string;
}

// -------- ProductSpecificationValue (Join table) --------
export interface ProductSpecificationValue {
  id: string;
  productId: string;
  product: Product;
  specificationId: string;
  specification: Specification;
  valueString?: string;
  valueNumber?: number;
  createdAt: string;
  updatedAt: string;
}

// -------- Order --------
export interface Order {
  id: number;
  totalAmount: number;
  status: OrderStatus;
  vendorId: number;
  vendor: Vendor;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// -------- OrderItem --------
export interface OrderItem {
  id: string;
  orderId: number;
  order: Order;
  variantId: string;
  variant: ProductVariant;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

// -------- API Response Types --------
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// -------- Form/Create Types --------
export interface CreateCategoryData {
  name: string;
  slug: string;
  image?: string;
  parentId?: string;
}

export interface CreateAttributeData {
  categoryId: string;
  name: string;
  type: AttributeType;
  filterable: boolean;
  required: boolean;
}

export interface CreateSpecificationData {
  categoryId: string;
  name: string;
  type: SpecificationType;
  unit?: string;
  filterable: boolean;
  required: boolean;
}

export interface CreateProductData {
  name: string;
  description?: string;
  vendorId: number;
  categoryId: string;
}

// -------- Filter Types --------
export interface ProductFilter {
  categoryId?: string;
  attributes?: { [key: string]: string | string[] };
  specifications?: { [key: string]: string | number | boolean };
  minPrice?: number;
  maxPrice?: number;
  vendorId?: number;
  inStock?: boolean;
}
