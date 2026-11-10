"use client";

// Route: /admin-dashboard/business-advisor — platform-wide Business Advisor.
// Access is enforced by the API (ADMIN, or admin-side staff with the Analytics
// permission); this page only renders the shared dashboard in admin mode.

import BusinessAdvisorDashboard from "@/components/product/vendor/buisnessadivisordashboard/BusinessAdvisorDashboard";

export default function AdminBusinessAdvisorPage() {
  return <BusinessAdvisorDashboard mode="admin" />;
}
