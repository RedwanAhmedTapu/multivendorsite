// app/vendor-dashboard/@main/reviews/page.tsx
//
// Route: /vendor-dashboard/reviews
// Thin slot page — all behaviour lives in the client screen so the dashboard
// layout chrome is untouched.

import { VendorReviewsScreen } from "@/components/reviews/vendor-reviews-screen";

export default function VendorReviewsPage() {
  return <VendorReviewsScreen />;
}
