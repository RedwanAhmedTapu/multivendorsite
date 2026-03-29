import type { CourierProvider, Environment } from "@/features/courierApi";
import type { Warehouse } from "@/features/warehouseApi";

export type CourierSlug = "PATHAO" | "REDX" | string;

export interface StoreFormValues {
  storeName: string;
  contactName: string;
  contactPhone: string;
  secondaryPhone: string;
  address: string;
}

export interface PathaoLocation {
  cityId: number | null;
  cityName: string;
  zoneId: number | null;
  zoneName: string;
  areaId: number | null;
  areaName: string;
}

export interface RedxLocation {
  areaId: number | null;
  areaName: string;
  districtFilter: string;
}

export interface CreateStoreDrawerState {
  open: boolean;
  vendor: VendorRow | null;
  provider: CourierProvider | null;
}

export interface VendorRow {
  id: string;
  storeName: string;
  email?: string;
  phone?: string;
  status: string;
}

export interface ExistingStore {
  id: number | string;
  name: string;
  address: string;
  courier: string;
  vendorId?: string;
}

export type AutoFilledField = "storeName" | "contactName" | "contactPhone" | "address";