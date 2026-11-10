// src/features/hrm/components/PermissionCheckboxGroup.tsx
//
// Permission checkboxes, reused in both the "create employee" form and the
// "edit permissions" modal. SECURITY NOTE: this component itself enforces
// nothing — it's rendered only inside owner-only surfaces
// (EmployeeFormModal / PermissionEditorModal), and every write is re-checked
// server-side. Never render this for a logged-in EMPLOYEE.
//
// P0: the granular HR keys sit under the hrManagement umbrella — an
// employee holding the umbrella passes every HR gate; the granular keys
// grant narrower capabilities (see requireHr() in the backend).

import type { EmployeePermissions } from "../../../features/employeeApi";
import { usePermissions } from "../../../hooks/usePermissions";
import { MarketingPermissionOption } from "@/components/marketing/admin/MarketingPermissionOption";

const BASE_LABELS: Partial<Record<keyof EmployeePermissions, string>> = {
  productManagement: "Product Management",
  orderManagement: "Order Management",
  customerSupport: "Customer Support",
  analytics: "Analytics",
  offerManagement: "Offer Management",
  inventoryManagement: "Inventory Management",
  hrManagement: "HR Management (full access)",
};

const BASE_DESCRIPTIONS: Partial<Record<keyof EmployeePermissions, string>> = {
  productManagement: "Create, edit, delete products and variants",
  orderManagement: "View and update order status",
  customerSupport: "View customers, respond to reviews and chat",
  analytics: "View sales/business analytics dashboards",
  offerManagement: "Create and manage offers/coupons",
  inventoryManagement: "Manage stock, suppliers, purchases",
  hrManagement: "Manage HR: employee profiles, attendance, leave, payroll — does NOT include granting/editing permissions",
};

const HR_GRANULAR: Array<{ key: keyof EmployeePermissions; label: string; description: string }> = [
  { key: "hrEmployeeView", label: "Employees — View", description: "Browse the employee directory and 360° profiles" },
  { key: "hrEmployeeCreate", label: "Employees — Create", description: "Add new employees" },
  { key: "hrEmployeeEdit", label: "Employees — Edit", description: "Edit profiles, sections, promotions and transfers" },
  { key: "hrEmployeeDelete", label: "Employees — Archive / Delete", description: "Archive employees or permanently delete test data" },
  { key: "hrSalaryView", label: "Salary — View", description: "See employee salary structures (sensitive)" },
  { key: "hrSalaryEdit", label: "Salary — Edit", description: "Set and revise salary structures (sensitive)" },
  { key: "hrDocsUpload", label: "Documents — Upload / Edit", description: "Upload and update employee documents" },
  { key: "hrDocsVerify", label: "Documents — Verify", description: "Mark employee documents as verified" },
  { key: "hrDocsDownload", label: "Documents — Download", description: "Download employee documents (audit-logged)" },
  { key: "hrDocsDelete", label: "Documents — Delete", description: "Delete employee documents" },
  { key: "hrBankView", label: "Bank — View unmasked", description: "See full bank/MFS account numbers (sensitive)" },
  { key: "hrOrgEdit", label: "Organization — Manage", description: "Create, edit and archive branches, departments and designations" },
  { key: "hrLeaveTypesEdit", label: "Leave Types — Manage", description: "Create and edit the leave-type catalog" },
];

/** Combined key → label map (base + granular HR) — single label source for
 *  this group AND the editor modal's "Currently granted" chip list. */
export const PERMISSION_LABELS: Record<string, string> = {
  ...BASE_LABELS,
  // Admin-only grant (the backend refuses it from vendor owners). Listed here so
  // the editor's change list and "granted" chips include it; its checkbox is
  // rendered below only for an ADMIN.
  marketingManagement: "Marketing Management",
  posSubscriptionManagement: "POS Subscription Management",
  agentManagement: "Agent Management",
  themeManagement: "Theme Management",
  posAccess: "POS Terminal Access",
  posDiscount: "POS Discounts",
  posCredit: "POS Credit Sales",
  posRefund: "POS Refunds & Voids",
  posReports: "POS Reports",
  ...Object.fromEntries(HR_GRANULAR.map(({ key, label }) => [key, label])),
} as Record<string, string>;

const POS_OPTIONS: Array<{ key: "posAccess" | "posDiscount" | "posCredit" | "posRefund" | "posReports"; label: string; description: string }> = [
  { key: "posAccess", label: "POS Terminal Access", description: "Use the store's POS with this account: sell, look up products, customers and invoices, collect dues. Checked on every request." },
  { key: "posDiscount", label: "POS Discounts", description: "Give discounts or write off part of a sale at the POS." },
  { key: "posCredit", label: "POS Credit Sales", description: "Sell on credit and set customers' credit terms." },
  { key: "posRefund", label: "POS Refunds & Voids", description: "Refund or void POS sales." },
  { key: "posReports", label: "POS Reports", description: "See the POS dashboard figures." },
];

function ExtraOption({ label, description, checked, disabled, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </label>
  );
}

export function PermissionCheckboxGroup({
  value,
  onChange,
  disabled,
  disabledKeys,
}: {
  value: EmployeePermissions;
  onChange: (next: EmployeePermissions) => void;
  disabled?: boolean;
  /** Keys the current actor may NOT toggle (cannot grant what they don't hold). */
  disabledKeys?: ReadonlyArray<string>;
}) {
  const baseKeys = Object.keys(BASE_LABELS) as (keyof EmployeePermissions)[];
  const { role } = usePermissions();

  return (
    <div className="space-y-3">
      {baseKeys.map((key) => (
        <label
          key={key}
          className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer"
        >
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            checked={!!value[key]}
            disabled={disabled || !!disabledKeys?.includes(key)}
            onChange={(e) => onChange({ ...value, [key]: e.target.checked })}
          />
          <div>
            <p className="text-sm font-medium text-gray-900">{BASE_LABELS[key]}</p>
            <p className="text-xs text-gray-500">{BASE_DESCRIPTIONS[key]}</p>
          </div>
        </label>
      ))}

      {role === "ADMIN" && (
        <MarketingPermissionOption
          checked={!!value.marketingManagement}
          disabled={disabled || !!disabledKeys?.includes("marketingManagement")}
          onChange={(checked) => onChange({ ...value, marketingManagement: checked })}
        />
      )}

      {/* Admin-only grant (backend refuses it from vendor owners). */}
      {role === "ADMIN" && (
        <ExtraOption
          label="POS Subscription Management"
          description="View vendor POS subscriptions and grant, extend, revoke, suspend or restore access. Does not give access to any vendor's POS."
          checked={!!value.posSubscriptionManagement}
          disabled={disabled || !!disabledKeys?.includes("posSubscriptionManagement")}
          onChange={(checked) => onChange({ ...value, posSubscriptionManagement: checked })}
        />
      )}

      {/* Admin-only grant (backend refuses it from vendor owners). */}
      {role === "ADMIN" && (
        <ExtraOption
          label="Agent Management"
          description="Manage commission agents: agents, vendor links, commission settings, levels, overrides, bonus rules and the audit log."
          checked={!!value.agentManagement}
          disabled={disabled || !!disabledKeys?.includes("agentManagement")}
          onChange={(checked) => onChange({ ...value, agentManagement: checked })}
        />
      )}

      {/* Admin-only grant (backend refuses it from vendor owners). */}
      {role === "ADMIN" && (
        <ExtraOption
          label="Theme Management"
          description="Create, edit, publish, roll back, archive and delete theme color palettes. Does not include activating palettes on live surfaces."
          checked={!!value.themeManagement}
          disabled={disabled || !!disabledKeys?.includes("themeManagement")}
          onChange={(checked) => onChange({ ...value, themeManagement: checked })}
        />
      )}

      {/* Vendor-only grants (backend refuses them from the admin side). The
          employee uses the POS with this account — no separate POS login. */}
      {role === "VENDOR" &&
        POS_OPTIONS.map((o) => (
          <ExtraOption
            key={o.key}
            label={o.label}
            description={o.description}
            checked={!!value[o.key]}
            disabled={disabled || !!disabledKeys?.includes(o.key) || (o.key !== "posAccess" && !value.posAccess)}
            onChange={(checked) =>
              onChange(
                o.key === "posAccess" && !checked
                  ? { ...value, posAccess: false, posDiscount: false, posCredit: false, posRefund: false, posReports: false }
                  : { ...value, [o.key]: checked },
              )
            }
          />
        ))}

      <div className="pt-1 text-xs font-bold uppercase tracking-wide text-gray-400">
        HR granular permissions — alternatives to full HR Management
      </div>
      <p className="text-xs text-gray-400">
        Grant these instead of "HR Management (full access)" to give narrower HR capabilities.
        Salary and unmasked bank access are sensitive — vendor accounts must have them granted explicitly.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {HR_GRANULAR.map(({ key, label, description }) => (
          <label
            key={key}
            className="flex items-start gap-2.5 rounded-lg border border-gray-100 bg-gray-50/60 p-2.5 hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={!!value[key]}
              disabled={disabled || !!disabledKeys?.includes(key)}
              onChange={(e) => onChange({ ...value, [key]: e.target.checked })}
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900">{label}</p>
              <p className="text-[11px] text-gray-500">{description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
