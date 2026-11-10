// Phase 4 (D5): this page rendered generated mock orders (generateOrders()).
// The real admin order screen is /admin-dashboard/order.
import { redirect } from "next/navigation";

export default function AdminOrdersPage() {
  redirect("/admin-dashboard/order");
}
