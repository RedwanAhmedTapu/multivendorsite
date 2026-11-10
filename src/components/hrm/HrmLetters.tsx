// src/components/hrm/HrmLetters.tsx
//
// Letters & Templates (PHASE L) — complete rewrite matching the HRM
// reference screenshots. All APIs are the EXISTING letter endpoints
// (/hrm/letters/*). PDF download uses fetch-as-blob with the auth header.
// Print uses window.print() with a print-ready popup.

"use client";

import { useMemo, useRef, useState } from "react";
import {
  Plus, Search, Download, Printer, Pencil, Trash2, Ban, CheckCircle2,
  ChevronLeft, ChevronRight, FileText, Clock, XCircle, Info, X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetLetterTemplatesQuery,
  useGetManageLetterTemplatesQuery,
  useGetLettersQuery,
  useGetEmployeesQuery,
  useGenerateLetterMutation,
  useApproveLetterMutation,
  useIssueLetterMutation,
  useCreateLetterTemplateMutation,
  useUpdateLetterTemplateMutation,
  useDeleteLetterTemplateMutation,
} from "@/features/hrmApi";
import { usePermissions } from "@/hooks/usePermissions";
import { toArray } from "./hrm-utils";

// ── Constants ──

type Tab = "issue" | "issued" | "templates";
const TABS: Tab[] = ["issue", "issued", "templates"];
type Step = 1 | 2 | 3;

const LETTER_TYPES = [
  "APPOINTMENT", "APPRECIATION", "CONFIRMATION", "CUSTOM", "EMPLOYMENT_CERT",
  "EXPERIENCE", "INCREMENT", "NOC", "PROMOTION", "PROBATION_EXT",
  "RELEASE", "RELIEVING", "RESIGN_ACCEPT", "SALARY_CERT", "SHOW_CAUSE",
  "SUSPENSION", "TERMINATION", "TRANSFER", "WARNING",
];

const STATUS_FILTERS = ["", "DRAFT", "PREPARED", "APPROVED", "ISSUED", "REJECTED"] as const;

const STATUS_CHIP: Record<string, string> = {
  DRAFT: "hrm-chip-resigned",
  PREPARED: "hrm-chip-probation",
  HR_REVIEW: "hrm-chip-probation",
  APPROVED: "hrm-chip-active",
  ISSUED: "hrm-chip-active",
  REJECTED: "hrm-chip-absent",
};

const VARIABLES = [
  "employee_name", "employee_id", "designation", "department", "branch",
  "joining_date", "salary", "basic_salary", "gross_salary", "manager_name",
  "effective_date", "company_name", "date", "probation_months", "employment_type",
];

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── PDF download (fetch as blob with auth header from store) ──

function useAuthFetch() {
  return async (url: string, letterNumber: string) => {
    const token = (window as any).__NEXT_DATA__ ? undefined : undefined;
    // Read the access token from the Redux-persisted localStorage.
    const raw = localStorage.getItem("persist:root");
    let authToken = "";
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const auth = JSON.parse(parsed.auth ?? "{}");
        authToken = auth.accessToken ?? "";
      } catch { /* ignore */ }
    }
    const res = await fetch(url, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message ?? `PDF download failed (${res.status})`);
    }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${letterNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
}

// ── Print helper ──

function printLetter(letter: any) {
  const win = window.open("", "_blank", "width=800,height=600");
  if (!win) { toast.error("Popup blocked — allow popups for this site."); return; }
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const date = (letter.issuedAt ?? letter.createdAt ?? "").slice(0, 10);
  win.document.write(
    `<!doctype html><html><head><title>${esc(letter.letterNumber)}</title>` +
    `<style>body{font-family:Arial,sans-serif;padding:40px;color:#000}` +
    `.company{font-size:21px;font-weight:bold;text-align:center}` +
    `.sub{text-align:center;font-size:12px;color:#555}` +
    `.rule{border:none;border-top:2px solid #059669;margin:8px 0 20px}` +
    `.ref{display:flex;justify-content:space-between;font-size:13px;color:#555}` +
    `.subject{font-size:17px;font-weight:bold;margin-top:20px}` +
    `.content{white-space:pre-wrap;font-size:14px;line-height:1.7;margin-top:16px}` +
    `.sig{margin-top:56px;font-size:14px}</style></head><body>` +
    `<div class="company">FinixMart</div><div class="sub">Human Resources Department</div><hr class="rule"/>` +
    `<div class="ref"><span>Ref: ${esc(letter.letterNumber)}</span><span>Date: ${esc(date)}</span></div>` +
    `<div class="subject">${esc(letter.subject)}</div>` +
    `<div class="content">${esc(letter.content)}</div>` +
    `<div class="sig">_______________________<br/>Authorized Signature</div>` +
    `</body></html>`
  );
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

// ═══ Component ═══

export function HrmLetters() {
  const { can, canHrUmbrella } = usePermissions();
  // Backend letter generate/template routes use requirePermission("hrManagement")
  // (owners or umbrella holders) — mirror that, not "any HR capability".
  const canManage = canHrUmbrella;

  const [tab, setTab] = useState<Tab>("issue");
  const [step, setStep] = useState<Step>(1);
  const [employeeId, setEmployeeId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [search, setSearch] = useState("");
  const [generated, setGenerated] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [letterSearch, setLetterSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const pdfFetch = useAuthFetch();

  // ── Data ──
  const { data: employees } = useGetEmployeesQuery({ page: 1, limit: 100 });
  const manageTemplates = useGetManageLetterTemplatesQuery(undefined, { skip: tab !== "templates" });
  const letters = useGetLettersQuery(
    statusFilter ? { status: statusFilter } : undefined,
    { skip: tab !== "issued" }
  );

  const [generate, { isLoading: generating }] = useGenerateLetterMutation();
  const [approve] = useApproveLetterMutation();
  const [issue] = useIssueLetterMutation();
  const [createTemplate] = useCreateLetterTemplateMutation();
  const [updateTemplate] = useUpdateLetterTemplateMutation();
  const [deleteTemplate] = useDeleteLetterTemplateMutation();

  // ── Derived ──
  const employeeList = useMemo(() => {
    const list = toArray(employees?.items);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((e) =>
      `${e.fullName} ${e.code} ${e.department?.name ?? ""}`.toLowerCase().includes(q)
    );
  }, [employees?.items, search]);

  const selectedEmployee = employeeList.find((e) => e.id === employeeId);
  const templateList = useMemo(() => toArray(manageTemplates.data?.data), [manageTemplates.data]);
  const activeTemplates = templateList.filter((t) => t.active !== false);
  const selectedTemplate = activeTemplates.find((t) => t.id === templateId);

  const letterRows = useMemo(() => {
    const list = toArray(letters.data?.data);
    if (!letterSearch.trim()) return list;
    const q = letterSearch.toLowerCase();
    return list.filter((l: any) =>
      `${l.letterNumber} ${l.employee?.fullName ?? ""} ${l.type}`.toLowerCase().includes(q)
    );
  }, [letters.data, letterSearch]);

  async function act(fn: () => Promise<unknown>, msg: string) {
    try { await fn(); toast.success(msg); }
    catch (err: any) { toast.error(err?.data?.message || err?.message || "Action failed."); }
  }

  const inputCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500";

  return (
    <div>
      <h1 className="hrm-page-title">Letters &amp; Templates</h1>
      <p className="hrm-page-subtitle">
        Generate HR letters from templates with the approval workflow, issuance and print-ready downloads
      </p>

      <div className="flex gap-1.5">
        {TABS.map((t) => (
          <button key={t} className={`hrm-pill ${tab === t ? "hrm-pill-active" : ""}`} onClick={() => { setTab(t); setStep(1); }}>
            {t === "issue" ? "Issue Letter" : t === "issued" ? "Issued Letters" : "Templates"}
          </button>
        ))}
      </div>

      {/* ═══ ISSUE LETTER (3-step wizard) ═══ */}
      {tab === "issue" && (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {["Select Employee", "Select Template", "Preview & Generate"].map((l, i) => {
              const num = i + 1;
              const active = step === num;
              const done = step > num;
              return (
                <div key={l} className="rounded-xl p-4 flex items-center gap-3"
                  style={{ border: active ? "2px solid var(--hrm-emerald)" : "1.5px solid var(--hrm-border)", background: active ? "#ECFDF5" : "#fff" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, background: done || active ? "var(--hrm-emerald)" : "#E5EAF2", color: done || active ? "#fff" : "#64748B" }}>
                    {done ? <CheckCircle2 size={14} /> : num}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--hrm-text)" }}>{l}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--hrm-muted)" }}>{["Choose the recipient", "Template & effective date", "Render, submit, issue"][i]}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {step === 1 && (
            <div className="hrm-card mt-4 p-5">
              <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--hrm-text)", margin: "0 0 12px" }}>Step 1 — Select Employee</h2>
              <div className="hrm-search mb-4" style={{ width: 320 }}>
                <Search size={14} className="text-[#94A3B8]" />
                <input placeholder="Search name, code, department..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto">
                {employeeList.map((e) => (
                  <button key={e.id} className="rounded-xl p-3.5 text-left"
                    style={{ border: employeeId === e.id ? "2px solid var(--hrm-emerald)" : "1.5px solid var(--hrm-border)", background: employeeId === e.id ? "#ECFDF5" : "#fff" }}
                    onClick={() => setEmployeeId(e.id)}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--hrm-text)" }}>{e.fullName}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--hrm-muted)" }}>
                      {e.code} · {e.designation?.name ?? "—"} · {e.department?.name ?? "—"}
                    </p>
                  </button>
                ))}
                {employeeList.length === 0 && <p className="p-4 text-sm" style={{ color: "var(--hrm-muted)" }}>No employees match.</p>}
              </div>
              <div className="mt-4 flex justify-end">
                <button className="hrm-pill hrm-pill-active" disabled={!employeeId} onClick={() => setStep(2)}>Continue →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="hrm-card mt-4 p-5">
              <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--hrm-text)", margin: "0 0 12px" }}>Step 2 — Select Template &amp; Effective Date</h2>
              {selectedEmployee && (
                <div className="mb-4 flex items-center justify-between rounded-lg p-3" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#065F46" }}>
                    {selectedEmployee.fullName} ({selectedEmployee.code}) · {selectedEmployee.designation?.name ?? "—"}
                  </span>
                  <button className="text-xs text-emerald-600 hover:underline" onClick={() => setStep(1)}>Change</button>
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-80 overflow-y-auto">
                {activeTemplates.map((t: any) => (
                  <button key={t.id} className="rounded-xl p-3.5 text-left"
                    style={{ border: templateId === t.id ? "2px solid var(--hrm-emerald)" : "1.5px solid var(--hrm-border)", background: templateId === t.id ? "#ECFDF5" : "#fff" }}
                    onClick={() => setTemplateId(t.id)}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--hrm-text)" }}>{t.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--hrm-muted)" }}>
                      {t.type} · {t.requiresApproval ? "approval required" : "no approval"}
                    </p>
                  </button>
                ))}
                {activeTemplates.length === 0 && (
                  <p className="p-4 text-sm" style={{ color: "var(--hrm-muted)" }}>No active templates — add one under the Templates tab.</p>
                )}
              </div>
              <div className="mt-4">
                <label style={{ fontSize: 12, fontWeight: 700, color: "#3D5068" }}>Effective Date (optional)</label>
                <input type="date" className={inputCls} style={{ width: 200, marginTop: 4 }} value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
                <p style={{ fontSize: 10.5, color: "#9BAABB", marginTop: 2 }}>
                  Renders as {'{{effective_date}}'} — used by increment, promotion &amp; transfer letters.
                </p>
              </div>
              <div className="mt-4 flex justify-between">
                <button className="hrm-pill" onClick={() => setStep(1)}>← Back</button>
                <button className="hrm-pill hrm-pill-active" disabled={!templateId} onClick={() => setStep(3)}>Continue →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="hrm-card mt-4 p-5">
              <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--hrm-text)", margin: "0 0 12px" }}>Step 3 — Preview &amp; Generate</h2>
              <div className="rounded-lg p-3 mb-4" style={{ background: "#FAFBFD", border: "1px solid var(--hrm-border)", fontSize: 12.5, color: "#334155" }}>
                Employee: <b>{selectedEmployee?.fullName}</b> · Template: <b>{selectedTemplate?.name}</b> · Type: <b>{selectedTemplate?.type}</b>
                {effectiveDate && <> · Effective: <b>{effectiveDate}</b></>}
              </div>
              {!generated ? (
                <div className="py-10 text-center">
                  <button className="rounded-lg px-6 py-3 text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#1D4ED8,#7C3AED)" }}
                    disabled={generating}
                    onClick={async () => {
                      try {
                        const r = await generate({ employeeId, templateId: selectedTemplate!.id, type: selectedTemplate!.type, effectiveDate: effectiveDate || undefined }).unwrap();
                        toast.success(`Letter ${r.data.letterNumber} generated as draft`);
                        setGenerated(r.data);
                      } catch (err: any) { toast.error(err?.data?.message || "Generation failed."); }
                    }}>
                    {generating ? "Generating…" : "Generate Letter"}
                  </button>
                  <p style={{ fontSize: 11.5, color: "var(--hrm-muted)", marginTop: 8 }}>
                    Generates a DRAFT letter with variables rendered from the employee record.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl p-6" style={{ border: "1.5px solid var(--hrm-border)", background: "#fff" }}>
                    <p style={{ textAlign: "center", fontSize: 18, fontWeight: 800, color: "var(--hrm-emerald-deep)", margin: "0 0 4px" }}>Letter Preview</p>
                    <div style={{ borderTop: "2px solid var(--hrm-emerald)", margin: "8px 0 16px" }} />
                    <p style={{ fontSize: 12, color: "var(--hrm-muted)", display: "flex", justifyContent: "space-between" }}>
                      <span>Ref: {generated.letterNumber}</span><span>{new Date().toISOString().slice(0, 10)}</span>
                    </p>
                    <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13, lineHeight: 1.7, color: "var(--hrm-text)", margin: "12px 0 0" }}>
                      {generated.content}
                    </pre>
                    <div style={{ marginTop: 24, paddingTop: 12, borderTop: "1px solid #F0F4FA" }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--hrm-text)" }}>Authorized Signature</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="hrm-chip hrm-chip-active">Saved as draft ({generated.letterNumber})</span>
                    {generated.status === "PREPARED" && canManage && (
                      <button className="hrm-pill hrm-pill-active" onClick={() => act(() => approve(generated.id).unwrap(), "Letter approved.")}>Submit for Approval</button>
                    )}
                    {generated.status === "APPROVED" && canManage && (
                      <button className="hrm-pill hrm-pill-active" onClick={() => act(() => issue(generated.id).unwrap(), "Letter issued.")}>Issue</button>
                    )}
                    <button className="hrm-pill" onClick={() => printLetter(generated)}><Printer size={13} /> View / Print</button>
                    <button className="hrm-pill" onClick={() => { setGenerated(null); setStep(1); setEmployeeId(""); setTemplateId(""); }}>Start New Letter</button>
                  </div>
                </>
              )}
              <div className="mt-4"><button className="hrm-pill" onClick={() => setStep(1)}>← Back</button></div>
            </div>
          )}
        </>
      )}

      {/* ═══ ISSUED LETTERS ═══ */}
      {tab === "issued" && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button key={s || "all"} className={`hrm-pill ${statusFilter === s ? "hrm-pill-active" : ""}`} onClick={() => { setStatusFilter(s); setPage(1); }}>
                {s === "" ? "All" : s === "PREPARED" ? "Prepared" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="hrm-search" style={{ width: 320 }}>
              <Search size={14} className="text-[#94A3B8]" />
              <input placeholder="Search letter no, employee..." value={letterSearch} onChange={(e) => { setLetterSearch(e.target.value); setPage(1); }} />
            </div>
            <button className="hrm-pill" onClick={() => {
              const header = ["Letter No", "Date", "Employee", "Type", "Status", "Issued"];
              const lines = letterRows.map((l: any) => [l.letterNumber, new Date(l.createdAt).toISOString().slice(0, 10), l.employee?.fullName ?? "", l.type, l.status, l.issuedAt?.slice(0, 10) ?? ""].map(csvCell).join(","));
              const csv = "\uFEFF" + header.join(",") + "\n" + lines.join("\n");
              const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
              const a = document.createElement("a"); a.href = url; a.download = "issued-letters.csv"; a.click(); URL.revokeObjectURL(url);
            }}><Download size={13} /> CSV</button>
          </div>

          <div className="hrm-card mt-4" style={{ overflow: "hidden" }}>
            <div className="overflow-x-auto">
              <table className="hrm-table">
                <thead><tr>{["Letter No", "Employee", "Type", "Status", "Issued", "Delivery", "Downloads", ""].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {letters.isLoading && <tr><td colSpan={8}><div className="hrm-loading-block" style={{ margin: 16 }} /></td></tr>}
                  {!letters.isLoading && letterRows.length === 0 && (
                    <tr><td colSpan={8} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>No letters match the filters.</td></tr>
                  )}
                  {letterRows.map((l: any) => (
                    <tr key={l.id}>
                      <td>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "var(--hrm-text)" }}>{l.letterNumber}</p>
                        <p style={{ margin: 0, fontSize: 10.5, color: "var(--hrm-muted)" }}>{new Date(l.createdAt).toISOString().slice(0, 10)}</p>
                      </td>
                      <td>
                        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "var(--hrm-text)" }}>{l.employee?.fullName ?? "—"}</p>
                        <p style={{ margin: 0, fontSize: 10.5, color: "var(--hrm-muted)" }}>{l.employee?.code ?? ""}</p>
                      </td>
                      <td><span className="hrm-type-badge">{l.type}</span></td>
                      <td><span className={`hrm-chip ${STATUS_CHIP[l.status] ?? "hrm-chip-resigned"}`}>{l.status === "HR_REVIEW" ? "Prepared" : l.status.charAt(0) + l.status.slice(1).toLowerCase()}</span></td>
                      <td>{l.issuedAt ? new Date(l.issuedAt).toLocaleDateString() : "—"}</td>
                      <td>—</td>
                      <td>—</td>
                      <td className="whitespace-nowrap">
                        <button className="hrm-pill" onClick={() => printLetter(l)}><Printer size={12} /> View / Print</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "10px 16px", borderTop: "1px solid var(--hrm-border)", fontSize: 11.5, color: "var(--hrm-muted)" }}>
              {letterRows.length} records
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2" style={{ fontSize: 12, color: "var(--hrm-muted)" }}>
            <Info size={13} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>Flow: DRAFT → PREPARED → APPROVED → ISSUED. Viewing/printing is audit-logged.</span>
          </div>
        </>
      )}

      {/* ═══ TEMPLATES ═══ */}
      {tab === "templates" && (
        <>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Templates", value: templateList.length, tile: "hrm-tile-emerald", icon: FileText },
              { label: "Approval Required", value: templateList.filter((t) => t.requiresApproval).length, tile: "hrm-tile-orange", icon: Clock },
              { label: "Active", value: templateList.filter((t) => t.active !== false).length, tile: "hrm-tile-emerald", icon: CheckCircle2 },
            ].map((s) => (
              <div key={s.label} className="hrm-card hrm-stat-card">
                <div><p className="hrm-stat-label">{s.label}</p><p className="hrm-stat-value">{s.value}</p></div>
                <div className={`hrm-stat-tile ${s.tile}`}><s.icon size={19} /></div>
              </div>
            ))}
          </div>

          <p className="mt-3" style={{ fontSize: 12, color: "var(--hrm-muted)" }}>
            Grouped by letter type — {LETTER_TYPES.length} supported types with {'{{variables}}'} rendered per employee.
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {canManage ? (
              <button className="hrm-pill hrm-pill-active" onClick={() => { setEditTemplate(null); setShowTemplateModal(true); }}>
                <Plus size={13} /> New Template
              </button>
            ) : <span />}
            <div className="flex items-center gap-3">
              <div className="hrm-search" style={{ width: 260 }}>
                <Search size={14} className="text-[#94A3B8]" />
                <input placeholder="Search name, type, subject..." value={letterSearch} onChange={(e) => setLetterSearch(e.target.value)} />
              </div>
              <button className="hrm-pill" onClick={() => {
                const header = ["Type", "Name", "Subject", "Approval Required", "Active"];
                const lines = templateList.map((t: any) => [t.type, t.name, t.subject, t.requiresApproval ? "Yes" : "No", t.active !== false ? "Yes" : "No"].map(csvCell).join(","));
                const csv = "\uFEFF" + header.join(",") + "\n" + lines.join("\n");
                const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
                const a = document.createElement("a"); a.href = url; a.download = "letter-templates.csv"; a.click(); URL.revokeObjectURL(url);
              }}><Download size={13} /> CSV</button>
            </div>
          </div>

          <div className="hrm-card mt-4" style={{ overflow: "hidden" }}>
            <div className="overflow-x-auto">
              <table className="hrm-table">
                <thead><tr>{["Type", "Template", "Signatory", "Approval Required", "Active", ...(canManage ? ["Actions"] : [])].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {manageTemplates.isLoading && <tr><td colSpan={6}><div className="hrm-loading-block" style={{ margin: 16 }} /></td></tr>}
                  {!manageTemplates.isLoading && templateList.length === 0 && (
                    <tr><td colSpan={6} className="p-10 text-center text-sm" style={{ color: "var(--hrm-muted)" }}>No templates yet — add one to start issuing letters.</td></tr>
                  )}
                  {templateList.map((t: any) => (
                    <tr key={t.id}>
                      <td><span className="hrm-type-badge">{t.type}</span></td>
                      <td>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--hrm-text)" }}>{t.name}</p>
                        <p style={{ margin: 0, fontSize: 10.5, color: "var(--hrm-muted)" }}>
                          {t.type.charAt(0) + t.type.slice(1).toLowerCase()} — {'{{employee_name}}'}
                        </p>
                      </td>
                      <td style={{ color: "var(--hrm-muted)", fontSize: 12 }}>—</td>
                      <td>{t.requiresApproval ? <span className="hrm-chip hrm-chip-probation">Required</span> : <span className="hrm-chip hrm-chip-resigned">Not required</span>}</td>
                      <td>{t.active !== false ? <span className="hrm-chip hrm-chip-active">Active</span> : <span className="hrm-chip hrm-chip-resigned">Inactive</span>}</td>
                      {canManage && (
                        <td className="whitespace-nowrap">
                          <button className="hrm-row-action" style={{ color: "#64748B", marginRight: 10 }} title="Edit"
                            onClick={() => { setEditTemplate(t); setShowTemplateModal(true); }}>
                            <Pencil size={13} />
                          </button>
                          <button className="hrm-row-action" style={{ color: "#94A3B8", marginRight: 10 }}
                            title={t.active !== false ? "Deactivate" : "Activate"}
                            onClick={() => act(() => updateTemplate({ id: t.id, data: { active: t.active === false } }).unwrap(), t.active !== false ? "Template deactivated." : "Template activated.")}>
                            <Ban size={13} />
                          </button>
                          <button className="hrm-row-action" title="Delete" onClick={() => setDeleteTarget(t)}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══ Template modal (New / Edit) ═══ */}
      {showTemplateModal && (
        <TemplateModal
          initial={editTemplate}
          onClose={() => { setShowTemplateModal(false); setEditTemplate(null); }}
          onSave={async (values) => {
            try {
              if (editTemplate) {
                await updateTemplate({ id: editTemplate.id, data: values }).unwrap();
                toast.success("Template updated.");
              } else {
                await createTemplate(values).unwrap();
                toast.success("Template created.");
              }
              setShowTemplateModal(false);
              setEditTemplate(null);
            } catch (err: any) {
              toast.error(err?.data?.message || "Failed to save template.");
            }
          }}
        />
      )}

      {/* ═══ Delete confirm ═══ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl p-5">
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--hrm-text)", margin: 0 }}>
              Delete template "{deleteTarget.name}"?
            </p>
            <p style={{ fontSize: 12, color: "var(--hrm-muted)", marginTop: 6 }}>
              If letters reference this template it will be deactivated instead of deleted.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-md border border-gray-300 px-4 py-2 text-sm" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="rounded-md bg-red-600 px-4 py-2 text-sm text-white"
                onClick={async () => {
                  try {
                    const r = await deleteTemplate(deleteTarget.id).unwrap();
                    toast.success(r.message ?? "Template deleted.");
                    setDeleteTarget(null);
                  } catch (err: any) { toast.error(err?.data?.message || "Delete failed."); }
                }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── New/Edit Template Modal ──

const VARIABLE_CHIPS = VARIABLES.map((v) => `{{${v}}}`);

function TemplateModal({
  initial,
  onClose,
  onSave,
}: { initial?: any; onClose: () => void; onSave: (values: any) => Promise<void> }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(() => ({
    type: initial?.type ?? "APPOINTMENT",
    name: initial?.name ?? "",
    subject: initial?.subject ?? "",
    body: initial?.body ?? "",
    requiresApproval: initial?.requiresApproval !== false,
    active: initial?.active !== false,
  }));
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function insertVariable(varName: string) {
    const el = bodyRef.current;
    if (!el) { setForm((f) => ({ ...f, body: f.body + `{{${varName}}}` })); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const insert = `{{${varName}}}`;
    setForm((f) => ({ ...f, body: f.body.slice(0, start) + insert + f.body.slice(end) }));
    setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = start + insert.length; }, 10);
  }

  const inputCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--hrm-text)", margin: 0 }}>
              {isEdit ? "Edit Letter Template" : "New Letter Template"}
            </h2>
            <p style={{ fontSize: 11, color: "var(--hrm-muted)", margin: "2px 0 0" }}>
              Use {'{{variables}}'} in the body — they are rendered from the employee record when a letter is generated.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Letter Type <span className="text-red-500">*</span></label>
              <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
                {LETTER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Template Name <span className="text-red-500">*</span></label>
              <input className={inputCls} placeholder="e.g. Standard Appointment Letter" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Subject <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder="Letter subject line" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Body <span className="text-red-500">*</span></label>
            <textarea ref={bodyRef} rows={5} className={`${inputCls} font-mono text-[13px]`}
              placeholder="Dear {{employee_name}},&#10;&#10;We are pleased to…"
              value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
          </div>
          <div className="rounded-lg p-3" style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1" }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: "#94A3B8", margin: "0 0 6px" }}>
              Available variables — click to insert
            </p>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLE_CHIPS.map((v) => (
                <button key={v} type="button" className="rounded px-2 py-0.5 text-[11px] font-mono"
                  style={{ background: "#EEF2FF", color: "#4F46E5", border: "1px solid #C7D2FE", cursor: "pointer" }}
                  onClick={() => insertVariable(v.replace(/[{}]/g, ""))}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Signatory Name</label>
              <input className={inputCls} placeholder="Defaults to vendor name" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Signatory Designation</label>
              <input className={inputCls} placeholder="e.g. Managing Director" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.requiresApproval} onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })} className="h-4 w-4 rounded" />
              Approval required before issuing
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded" />
              Active (available for generation)
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-5 py-2 text-sm">Cancel</button>
            <button type="submit" className="rounded-md px-5 py-2 text-sm font-bold text-white" style={{ background: "var(--hrm-emerald-deep)" }}>
              Save Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
