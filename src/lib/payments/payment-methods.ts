// lib/payments/payment-methods.ts
//
// The vendor payment methods offered by the Purchase Entry form, and which kind
// of VendorPaymentAccount (GET /vendormanagement/:vendorId/payment-accounts)
// each one settles through. Shared so the POS terminal offers the same methods
// with the same labels instead of keeping its own list.

import type { PaymentInstrumentType } from "@/features/vendorManageApi";

export const PAYMENT_METHOD_OPTIONS = [
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Cash", label: "Cash" },
  { value: "Cheque", label: "Cheque" },
  { value: "Mobile Banking", label: "Mobile Banking" },
  { value: "Card", label: "Card" },
];

// Maps the human-facing payment method dropdown to the PaymentInstrumentType
// used to filter VendorPaymentAccount rows. Cash maps to `null` — no account
// selection is needed, it always resolves to the vendor's "Cash in Hand"
// fallback ledger account on the backend.
export const PAYMENT_METHOD_TO_TYPE: Record<string, PaymentInstrumentType | null> = {
  "Bank Transfer": "BANK",
  Cheque: "BANK",
  "Mobile Banking": "MOBILE_BANKING",
  Card: "CARD",
  Cash: null,
};
