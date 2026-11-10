import type { StoreFormValues, PathaoLocation, RedxLocation } from "@/types/courier-store";

export interface ValidationErrors {
  storeName?: string;
  contactName?: string;
  contactPhone?: string;
  secondaryPhone?: string;
  address?: string;
  location?: string;
}

// Bangladeshi mobile number: 11 digits, starts 01[3-9]
const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

const len = (v: string | undefined | null) => (v ?? "").trim().length;

/**
 * Matches Pathao's "Create a New Store" constraints exactly:
 * name 3–50 chars, contact_name 3–50 chars, contact_number 11 digits,
 * secondary_contact optional/11 digits, address 15–120 chars,
 * city_id/zone_id/area_id required.
 */
export function validatePathaoStoreForm(
  form: StoreFormValues,
  location: PathaoLocation
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (len(form.storeName) < 3 || len(form.storeName) > 50) {
    errors.storeName = "Store name must be 3–50 characters.";
  }
  if (len(form.contactName) < 3 || len(form.contactName) > 50) {
    errors.contactName = "Contact person name must be 3–50 characters.";
  }
  if (!BD_PHONE_REGEX.test(form.contactPhone.trim())) {
    errors.contactPhone = "Enter a valid 11-digit BD number, e.g. 017XXXXXXXX.";
  }
  if (form.secondaryPhone && !BD_PHONE_REGEX.test(form.secondaryPhone.trim())) {
    errors.secondaryPhone = "Secondary phone must be a valid 11-digit BD number.";
  }
  if (len(form.address) < 15 || len(form.address) > 120) {
    errors.address = "Address must be 15–120 characters.";
  }
  if (!location.cityId || !location.zoneId || !location.areaId) {
    errors.location = "City, zone and area are all required for Pathao.";
  }

  return errors;
}

/**
 * Matches RedX's "Create Pickup Store" constraints:
 * name, phone, address, area_id all required.
 */
export function validateRedxStoreForm(
  form: StoreFormValues,
  location: RedxLocation
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (len(form.storeName) < 3 || len(form.storeName) > 50) {
    errors.storeName = "Store name must be 3–50 characters.";
  }
  if (!BD_PHONE_REGEX.test(form.contactPhone.trim())) {
    errors.contactPhone = "Enter a valid 11-digit BD number, e.g. 017XXXXXXXX.";
  }
  if (len(form.address) < 10) {
    errors.address = "Address is required (min 10 characters).";
  }
  if (!location.areaId) {
    errors.location = "Delivery area is required for RedX.";
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}