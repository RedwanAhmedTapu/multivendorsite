// lib/pos/customer.ts
//
// The POS customer add/edit form as a pure model: initial values, validation,
// the payload the server accepts, and the loan summary the modal shows.
// The server (pos.service customerData) is the authority: balances — due,
// loanBalance, walletBalance, orders, spent, lastOrderAt — are never writable
// and never sent from here.

import type { CreateCustomerRequest, PosCustomer } from "@/features/posApi";

export const CREDIT_SCORES = ["Excellent", "Good", "Fair", "Poor", "No History"] as const;

export interface CustomerFormState {
  name: string;
  phone: string;
  email: string;
  nid: string;
  address: string;
  note: string;
  referrerName: string;
  referrerEmail: string;
  /** Money kept as the input's text so typing is never rounded mid-keystroke. */
  loanLimit: string;
  loanInterestRate: string;
  loanTenureDays: string;
  creditScore: string;
}

export function initialCustomerForm(c?: PosCustomer | null): CustomerFormState {
  const limit = Number(c?.loanLimit) || 0;
  return {
    name: c?.name ?? "",
    phone: c?.phone ?? "",
    email: c?.email ?? "",
    nid: c?.nid ?? "",
    address: c?.address ?? "",
    note: c?.note ?? "",
    referrerName: c?.referrerName ?? "",
    referrerEmail: c?.referrerEmail ?? "",
    loanLimit: limit > 0 ? String(limit) : "",
    loanInterestRate: String(c?.loanInterestRate ?? 12),
    loanTenureDays: String(c?.loanTenureDays ?? 30),
    creditScore: c?.creditScore ?? "Good",
  };
}

/** The editable whitelist, nothing else. Credit terms only for posCredit users. */
export function customerPayload(form: CustomerFormState, canSetCredit: boolean): CreateCustomerRequest {
  const profile: CreateCustomerRequest = {
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    nid: form.nid.trim(),
    address: form.address.trim(),
    note: form.note.trim(),
    referrerName: form.referrerName.trim(),
    referrerEmail: form.referrerEmail.trim(),
  };
  if (!canSetCredit) return profile;
  return {
    ...profile,
    loanLimit: Math.round((Number(form.loanLimit) || 0) * 100) / 100,
    loanInterestRate: Number(form.loanInterestRate) || 0,
    loanTenureDays: Math.floor(Number(form.loanTenureDays) || 0),
    creditScore: form.creditScore,
  };
}

/** First message that blocks saving, or null. Mirrors the server's validation. */
export function customerFormError(form: CustomerFormState, canSetCredit: boolean): string | null {
  if (!form.name.trim() || !form.phone.trim()) return "Name and phone are required";
  if (!canSetCredit) return null;
  const limit = Number(form.loanLimit || 0);
  if (!Number.isFinite(limit) || limit < 0) return "Credit limit must be 0 or more";
  const rate = Number(form.loanInterestRate || 0);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) return "Interest rate must be between 0 and 100";
  const tenure = Number(form.loanTenureDays || 0);
  if (!Number.isInteger(tenure) || tenure < 0 || tenure > 3650) return "Tenure must be a whole number of days";
  if (!(CREDIT_SCORES as readonly string[]).includes(form.creditScore)) return "Choose a valid credit score";
  return null;
}

/** Derived display values for the Loan Summary box. */
export function loanSummaryFor(limitInput: string, balance: number, rateInput: string) {
  const limit = Math.max(Number(limitInput) || 0, 0);
  const outstanding = Math.max(Number(balance) || 0, 0);
  const rate = Math.max(Number(rateInput) || 0, 0);
  return {
    limit,
    outstanding,
    available: Math.max(Math.round((limit - outstanding) * 100) / 100, 0),
    monthlyInterest: Math.round((outstanding * rate) / 1200),
    utilization: limit > 0 ? Math.round((outstanding / limit) * 100) : 0,
  };
}
