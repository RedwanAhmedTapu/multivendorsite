// ============================================================
// Purchase Form Types
// ============================================================

export interface Supplier {
  id: string;
  name: string;
  supplierType: string;
  status: string;
  contactName?: string;
  phone: string;
  phone2?: string;
  email: string;
  city?: string;
  country?: string;
  fullAddress?: string;
  paymentTerms?: string;
  creditLimit?: number;
  bankAccountName?: string;
  bankAcct?: string;
  bankName?: string;
  bankBranch?: string;
  routingNo?: string;
  notes?: string;
}

export interface Warehouse {
  id: string;
  name: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  warehouseStock?: Record<string, number>;
  damagedQty?: number;
  reservedQty?: number;
  avgCost?: number;
  reorderLevel?: number;
  supplierId?: string;
  warehouseId?: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  category: string;
  image?: string;
  variants: ProductVariant[];
}

export interface Category {
  id: string;
  name: string;
}

export interface PurchaseItem {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  qty: number;
  unitCost: number;
  sellPrice: number;
  newAvgCost: number;
  total: number;
  expiry: string;
  prevStock: number;
  prevAvg: number;
  image?: string;
}

export interface COAAccount {
  id: string;
  name: string;
  type: string;
  subtype: string;
}

export interface SelectOption {
  value: string;
  label: string;
  sub?: string;
  group?: string;
}

export const WAREHOUSES: Warehouse[] = [
  { id: "wh1", name: "Main Distribution Center" },
  { id: "wh2", name: "Secondary Warehouse" },
  { id: "wh3", name: "Express Hub" },
];

export const WAREHOUSE_MAP: Record<string, string> = {
  wh1: "Main Distribution Center",
  wh2: "Secondary Warehouse",
  wh3: "Express Hub",
};

export const PAYMENT_METHODS: SelectOption[] = [
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Cash", label: "Cash" },
  { value: "Cheque", label: "Cheque" },
  { value: "Mobile Banking", label: "Mobile Banking" },
];

export const COA_PAY_OPTIONS: SelectOption[] = [
  { value: "1010", label: "1010 – Operating Cash" },
  { value: "1020", label: "1020 – Bank Account 1" },
  { value: "1030", label: "1030 – Bank Account 2" },
];

export const VAT_OPTIONS: SelectOption[] = [
  { value: "0", label: "No VAT" },
  { value: "0.05", label: "VAT 5% – 1410 Input Tax" },
  { value: "0.10", label: "VAT 10% – 1410 Input Tax" },
  { value: "0.15", label: "VAT 15% – 1410 Input Tax" },
];