//types/category.types.ts 
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
  createdAt: string;
  updatedAt: string;
}
export interface VariantNamePart {
  name: string;
  value: any;
  displayValue?: string;
  include: boolean;
}
export interface Attribute {
  isRequired?: unknown;
  id: string;
  name: string;
  slug: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT' | 'MULTISELECT';

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
export interface CategoryAttribute {
  id: string;
  categoryId: string;
  category?: Category;
  attributeId: string;
  attribute?: Attribute;
  isRequired: boolean;
  filterable: boolean;
  sortOrder: number; 
  createdAt: string;
  updatedAt: string;
}

