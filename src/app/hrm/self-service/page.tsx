// src/app/hrm/self-service/page.tsx — My Self-Service (PHASE B).
//
// Only for accounts with a LINKED EMPLOYEE PROFILE (the backend self-service
// routes resolve identity from the session and return "No employee record"
// otherwise). Reuses the EXISTING EmployeeSelfServicePage — check-in/out,
// leave application and balances all ride the secured self-service APIs.

"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import EmployeeSelfServicePage from "@/othersfeatures/hrm/pages/EmployeeSelfServicePage";

export default function HrmSelfServicePage() {
  const { me, isLoading } = usePermissions();

  if (isLoading) return <div className="hrm-loading-block" style={{ height: 200 }} />;

  if (!me?.employeeId) {
    return (
      <div className="hrm-card" style={{ padding: 48, textAlign: "center" }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: 16,
            background: "#F1F5F9",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <UserRound size={24} style={{ color: "#94A3B8" }} />
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#0D1B2E", margin: 0 }}>
          No employee profile linked to this account
        </p>
        <p style={{ fontSize: 12.5, color: "#7A90AB", marginTop: 6 }}>
          Self-service is available to staff accounts with an HR profile.
        </p>
        <Link href="/hrm" className="hrm-pill" style={{ display: "inline-flex", marginTop: 14 }}>
          Back to HR Dashboard
        </Link>
      </div>
    );
  }

  return <EmployeeSelfServicePage />;
}
