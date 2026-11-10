"use client";

// src/app/admin-dashboard/@main/payment-reconciliation/page.tsx
//
// Read-only queue of verified payments the backend couldn't apply. Access is
// enforced by the backend (requirePermission("orderManagement") on
// /api/admin-orders); the sidebar entry only hides the link.

import { PaymentReconciliationQueue } from "@/components/orders/PaymentReconciliationQueue";

export default function AdminPaymentReconciliationPage() {
  return <PaymentReconciliationQueue />;
}
