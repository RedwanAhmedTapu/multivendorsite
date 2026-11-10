"use client";

// src/app/admin-dashboard/@main/order-review/page.tsx
//
// Admin order review queue. Access is enforced by the backend
// (requirePermission("orderManagement") on /api/admin-orders); the sidebar
// entry only hides the link.

import { OrderReviewQueue } from "@/components/orders/OrderReviewQueue";

export default function AdminOrderReviewPage() {
  return <OrderReviewQueue />;
}
