// src/app/admin/dashboard/page.tsx

import AdminProtectedLayout from "./layout";

export default function AdminDashboardPage() {
  return <AdminProtectedLayout main={<div>Admin Dashboard Content</div>} />;
}
