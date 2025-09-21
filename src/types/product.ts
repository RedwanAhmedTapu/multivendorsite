import { Vendor, Category, OrderItem, Attribute, AttributeValue, Specification } from "./type";

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
  attributeSettings: ProductAttributeSetting[];
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

// -------- ProductVariant --------
export interface ProductVariant {
  id: string;
  productId: string;
  product?: Product;
  name: string;
  sku: string;
  price: number;
  stock: number;
  weight: number;
  images: ProductImage[];
  attributes: ProductVariantAttribute[];
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// -------- ProductImage --------
export interface ProductImage {
  id: string;
  productId?: string;
  product?: Product;
  variantId?: string;
  variant?: ProductVariant;
  url: string;
  altText?: string;
  sortOrder: number;
  createdAt: string;
}

// -------- ProductAttributeSetting --------
export interface ProductAttributeSetting {
  id: string;
  productId: string;
  product: Product;
  attributeId: string;
  attribute: Attribute;
  isVariant: boolean;
}

// -------- ProductVariantAttribute --------
export interface ProductVariantAttribute {
  id: string;
  variantId: string;
  variant: ProductVariant;
  attributeValueId: string;
  attributeValue: AttributeValue;
  createdAt: string;
  updatedAt: string;
}

// -------- ProductSpecificationValue --------
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

// -------- Input types for Frontend Forms --------
export interface ProductImageInput {
  url: string;
  altText?: string;
  sortOrder?: number;
}

export interface ProductVariantInput {
  id?: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  weight: number;
  attributes?: { attributeValueId: string }[];
  images: string[]; // Array of image URLs for frontend
}

export interface ProductSpecificationInput {
  specificationId: string;
  valueString?: string;
  valueNumber?: number;
}

export interface ProductAttributeSettingInput {
  attributeId: string;
  isVariant?: boolean;
}
export interface ProductShippingWarrantyInput {
  packageWeightValue: number;
  packageWeightUnit: "kg" | "g";
  packageLength: number;
  packageWidth: number;
  packageHeight: number;
  dangerousGoods: "none" | "contains";
  warrantyType: string;
  warrantyPeriodValue: number;
  warrantyPeriodUnit: "days" | "months" | "years";
  warrantyDetails: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  categoryId: string;
  vendorId: string;
  images: (string | { url: string; altText?: string })[];
  specifications: ProductSpecificationInput[];
  variants: ProductVariantInput[];
  attributeSettings: ProductAttributeSettingInput[];
  shippingWarranty?: ProductShippingWarrantyInput;  // NEW
}


// -------- Update Product Data --------
export interface UpdateProductData {
  name?: string;
  description?: string;
  vendorId?: number;
  categoryId?: string;
  images?: ProductImageInput[];
  specifications?: ProductSpecificationInput[];
  attributeSettings?: ProductAttributeSettingInput[];
  variants?: ProductVariantInput[];
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
  searchQuery?: string;
}

// -------- Product List Item for Efficient Queries --------
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  vendor: {
    id: number;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
  images: ProductImage[];
  variants: {
    id: string;
    name: string;
    price: number;
    stock: number;
    images: ProductImage[];
  }[];
  createdAt: string;
}

// -------- Product Detail for Single Product View --------
export interface ProductDetail extends Product {
  variants: (ProductVariant & {
    attributes: (ProductVariantAttribute & {
      attributeValue: AttributeValue & {
        attribute: Attribute;
      };
    })[];
  })[];
  specifications: (ProductSpecificationValue & {
    specification: Specification & {
      values?: AttributeValue[];
    };
  })[];
  attributeSettings: (ProductAttributeSetting & {
    attribute: Attribute & {
      values: AttributeValue[];
    };
  })[];
}

// -------- Generic API Response --------
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// -------- Pagination --------
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// -------- Product Search --------
export interface ProductSearchParams {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'stock';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// -------- Product Analytics --------
export interface ProductAnalytics {
  totalProducts: number;
  totalVariants: number;
  averagePrice: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  topCategories: {
    categoryId: string;
    categoryName: string;
    productCount: number;
  }[];
  topVendors: {
    vendorId: number;
    vendorName: string;
    productCount: number;
  }[];
}