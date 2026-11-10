// src/components/hrm/hrm-nav-config.ts
//
// SINGLE SOURCE for the /hrm workspace sidebar: groups, order, labels,
// routes and the EXISTING hrCapabilities each item requires. Every entry is
// gated against the server-derived capability map (usePermissions.can) —
// a user without the capability for an item never sees it, and the backend
// re-authorizes every API call regardless (UI hiding is convenience only).
//
// Icons are stored as string names and resolved in the shell, so this file
// stays import-safe outside React.

export interface HrmNavItem {
  label: string;
  href: string;
  icon: string;
  /** Every listed capability must pass (OR within a group item = any).
   *  Empty array = visible to anyone inside the /hrm workspace. */
  caps: string[];
  /** Visible only to platform admins (e.g. Audit Trail — platform resource
   *  with no tenant column). */
  adminsOnly?: boolean;
  /** "self-service" items additionally require a linked employee profile. */
  requiresEmployeeProfile?: boolean;
}

export interface HrmNavGroup {
  label: string;
  items: HrmNavItem[];
}

// Read-only/view gates use hrEmployeeView; management surfaces use the
// matching granular key; Payroll rides the SENSITIVE hrSalaryView gate
// (VENDOR does not auto-pass it — backend policy, mirrored here for UX).
export const HRM_NAV: HrmNavGroup[] = [
  {
    label: "HR & Workforce",
    items: [
      { label: "HR Dashboard", href: "/hrm", icon: "LayoutGrid", caps: ["hrEmployeeView"] },
      { label: "HR Calendar", href: "/hrm/calendar", icon: "CalendarDays", caps: ["hrEmployeeView"] },
    ],
  },
  {
    label: "Employees",
    items: [
      { label: "Employee Directory", href: "/hrm/employees", icon: "Users", caps: ["hrEmployeeView"] },
      { label: "Employment Lifecycle", href: "/hrm/lifecycle", icon: "GitBranch", caps: ["hrEmployeeEdit"] },
      { label: "My Self-Service", href: "/hrm/self-service", icon: "UserRound", caps: [], requiresEmployeeProfile: true },
    ],
  },
  {
    label: "Organization",
    items: [
      { label: "Branches & Departments", href: "/hrm/organization", icon: "Building2", caps: ["hrEmployeeView"] },
      { label: "Org Chart", href: "/hrm/org-chart", icon: "Network", caps: ["hrEmployeeView"] },
    ],
  },
  {
    label: "Attendance",
    items: [
      { label: "Attendance & Shifts", href: "/hrm/attendance", icon: "Clock", caps: ["hrEmployeeView"] },
      { label: "Overtime Management", href: "/hrm/overtime", icon: "Timer", caps: ["hrEmployeeView"] },
    ],
  },
  {
    label: "Leave",
    items: [{ label: "Leave Management", href: "/hrm/leave", icon: "Plane", caps: ["hrEmployeeView"] }],
  },
  {
    label: "Payroll",
    items: [{ label: "Payroll", href: "/hrm/payroll", icon: "Wallet", caps: ["hrSalaryView"] }],
  },
  {
    label: "Approvals",
    items: [{ label: "Approval Queue", href: "/hrm/approvals", icon: "CheckCheck", caps: ["hrEmployeeEdit"] }],
  },
  {
    label: "Notifications",
    items: [{ label: "Notification Center", href: "/hrm/notifications", icon: "Bell", caps: ["hrEmployeeView"] }],
  },
  {
    label: "Communication",
    items: [
      { label: "Email & SMS Center", href: "/hrm/communication", icon: "Send", caps: ["hrEmployeeView"] },
      { label: "HR Announcements", href: "/hrm/announcements", icon: "Megaphone", caps: ["hrEmployeeView"] },
    ],
  },
  {
    label: "HR Documents",
    items: [{ label: "Letters & Templates", href: "/hrm/documents", icon: "FileText", caps: ["hrEmployeeEdit"] }],
  },
  {
    label: "Resignation & Exit",
    items: [{ label: "Exit Management", href: "/hrm/exit", icon: "LogOut", caps: ["hrEmployeeEdit"] }],
  },
  {
    label: "Insights",
    items: [
      { label: "HR Reports", href: "/hrm/reports", icon: "BarChart3", caps: ["hrEmployeeView"] },
      { label: "HR Analytics", href: "/hrm/analytics", icon: "TrendingUp", caps: ["hrEmployeeView"] },
      { label: "Audit Trail", href: "/hrm/audit", icon: "ShieldCheck", caps: ["hrEmployeeView"], adminsOnly: true },
    ],
  },
  {
    label: "Settings",
    items: [{
      label: "HR Settings",
      href: "/hrm/settings",
      icon: "Settings",
      // OR-semantics: either management capability unlocks settings.
      caps: ["hrOrgEdit", "hrLeaveTypesEdit"],
    }],
  },
];

/** Titles/subtitles for the placeholder phase pages. */
export const HRM_SECTION_META: Record<string, { title: string; subtitle: string }> = {
  calendar: { title: "HR Calendar", subtitle: "Company events, birthdays, anniversaries and HR reminders" },
  employees: { title: "Employee Directory", subtitle: "Central employee master — arriving in the next phase" },
  lifecycle: { title: "Employment Lifecycle", subtitle: "Promotions, transfers and salary revisions — the immutable employee history register" },
  "self-service": { title: "My Self-Service Portal", subtitle: "Your personal HR workspace — arriving in the next phase" },
  organization: { title: "Organization Structure", subtitle: "Branches, departments and designations" },
  "org-chart": { title: "Org Chart", subtitle: "Reporting lines across branches and departments" },
  attendance: { title: "Attendance & Shifts", subtitle: "Daily attendance, corrections and shift rosters" },
  overtime: { title: "Overtime Management", subtitle: "Overtime requests, approvals and cost tracking" },
  leave: { title: "Leave Management", subtitle: "Leave requests, balances, approvals and the leave calendar" },
  payroll: { title: "Payroll", subtitle: "Payroll runs, salary structures and payslips" },
  approvals: { title: "Approval Queue", subtitle: "Requests waiting on your approval" },
  notifications: { title: "Notification Center", subtitle: "Everything that happened while you were away" },
  communication: { title: "Email & SMS Center", subtitle: "Blast communication with delivery status" },
  announcements: { title: "HR Announcements", subtitle: "Company-wide and targeted announcements" },
  documents: { title: "Letters & Templates", subtitle: "HR letter templates, generation and issuance" },
  exit: { title: "Exit Management", subtitle: "Resignations, clearances and final settlements" },
  reports: { title: "HR Reports", subtitle: "Workforce, attendance, leave and payroll registers" },
  analytics: { title: "HR Analytics", subtitle: "Trends and distributions across your workforce" },
  audit: { title: "Audit Trail", subtitle: "Who changed what — the immutable action log" },
  settings: { title: "HR Settings", subtitle: "Policies, approval workflows and HR configuration" },
};
