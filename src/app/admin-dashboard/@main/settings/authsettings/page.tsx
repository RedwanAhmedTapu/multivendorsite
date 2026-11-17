// app/admin-dashboard/@main/settings/authsettings/page.tsx
//
// Account Security for ADMIN and platform employees: MFA enrollment,
// recovery codes and active sessions. Self-scoped — the backend derives the
// account from the session, so this page is safe for every staff role.
// Linked from the admin sidebar as a standalone item (NOT under the
// OWNER_ONLY Settings group) because MFA policy can require platform
// employees to enroll.
"use client";

import MfaSettingsSection from "@/components/auth/MfaSettingsSection";

export default function AdminAuthSettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Account Security</h1>
        <p className="mt-1 text-sm text-slate-500">
          Two-factor authentication and active sessions for your staff account.
        </p>
      </div>
      <div className="max-w-[720px]">
        <MfaSettingsSection />
      </div>
    </div>
  );
}
