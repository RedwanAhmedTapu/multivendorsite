// src/app/admin-dashboard/@main/settings/fraud-providers/page.tsx
"use client";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useGetAvailableFraudAdaptersQuery,
  useGetFraudProvidersQuery,
  useGetFraudProviderLogsQuery,
  useCreateFraudProviderMutation,
  useUpdateFraudProviderMutation,
  useSetFraudProviderActiveMutation,
  useDeleteFraudProviderMutation,
  useTestFraudProviderConnectionMutation,
  type AvailableFraudAdapter,
  type CredentialField,
  type FraudProvider,
  type FraudCheckTestResult,
} from "@/features/adminFraudProviderApi";
import {
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Plus,
  X,
  Sparkles,
  AlertCircle,
  Check,
  KeyRound,
  FlaskConical,
  ScrollText,
  Trash2,
  Pencil,
  ArrowUpDown,
  ChevronDown,
  Search,
} from "lucide-react";

/* ─── Small reusable bits (same primitives/colors as the bank settings page) ─── */

function IconButton({
  icon,
  onClick,
  variant = "outline",
  loading,
  disabled,
  label,
  danger,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "outline";
  loading?: boolean;
  disabled?: boolean;
  label: string;
  danger?: boolean;
}) {
  const isDisabled = disabled || loading;
  const primary = variant === "primary";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      style={{
        padding: "7px 14px",
        borderRadius: 8,
        border: primary ? "none" : `1.5px solid ${danger ? "#FECACA" : "#E2E8F0"}`,
        background: isDisabled
          ? "#E2E8F0"
          : primary
            ? "linear-gradient(135deg,#1D4ED8,#7C3AED)"
            : danger
              ? "#FEF2F2"
              : "#fff",
        color: isDisabled ? "#94A3B8" : primary ? "#fff" : danger ? "#DC2626" : "#334155",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: isDisabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      {loading ? (
        <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        icon
      )}
      {label}
    </button>
  );
}

function FilterInput({
  icon,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
      <div
        style={{
          position: "absolute",
          left: 9,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#94A3B8",
          display: "flex",
        }}
      >
        {icon}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "7px 10px 7px 30px",
          borderRadius: 8,
          border: "1.5px solid #E2E8F0",
          fontSize: 12.5,
          fontFamily: "inherit",
          outline: "none",
          background: "#fff",
        }}
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  flex = "1 1 160px",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  flex?: string;
}) {
  return (
    <div style={{ flex }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>
        {label} {required && <span style={{ color: "#DC2626" }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "7px 10px",
          borderRadius: 8,
          border: "1.5px solid #E2E8F0",
          fontSize: 12.5,
          marginTop: 4,
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function StatusPill({ active, onLabel = "Active", offLabel = "Inactive" }: { active: boolean; onLabel?: string; offLabel?: string }) {
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 20,
        background: active ? "#F0F9F0" : "#FEF2F2",
        color: active ? "#16A34A" : "#DC2626",
        border: `1px solid ${active ? "#BBF7D0" : "#FECACA"}`,
      }}
    >
      {active ? onLabel : offLabel}
    </span>
  );
}

function RiskPill({ level }: { level: string }) {
  const map: Record<string, { bg: string; fg: string; border: string }> = {
    low: { bg: "#F0F9F0", fg: "#16A34A", border: "#BBF7D0" },
    medium: { bg: "#FFFBEB", fg: "#92400E", border: "#FDE68A" },
    high: { bg: "#FFF1F0", fg: "#DC2626", border: "#FECACA" },
    very_high: { bg: "#FEF2F2", fg: "#B91C1C", border: "#FECACA" },
    unknown: { bg: "#F1F5F9", fg: "#64748B", border: "#E2E8F0" },
  };
  const c = map[level] || map.unknown;
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 20,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        textTransform: "capitalize",
      }}
    >
      {level.replace("_", " ")}
    </span>
  );
}

/** Toggle switch used for the active/inactive column — matches the page's rounded-pill language. */
function Switch({ checked, onChange, loading }: { checked: boolean; onChange: () => void; loading?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={loading}
      style={{
        width: 36,
        height: 20,
        borderRadius: 20,
        border: "none",
        background: checked ? "linear-gradient(135deg,#1D4ED8,#7C3AED)" : "#E2E8F0",
        position: "relative",
        cursor: loading ? "not-allowed" : "pointer",
        flexShrink: 0,
        opacity: loading ? 0.6 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.18s ease",
          boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
        }}
      />
    </button>
  );
}

/* ─── Dynamic credential inputs, driven by the selected adapter's credentialFields ─── */

function CredentialFieldsForm({
  fields,
  values,
  onChange,
  optionalHint,
}: {
  fields: CredentialField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  optionalHint?: boolean;
}) {
  if (fields.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {fields.map((f) => (
        <TextField
          key={f.key}
          label={f.label}
          type={f.secret ? "password" : "text"}
          value={values[f.key] ?? ""}
          onChange={(v) => onChange(f.key, v)}
          placeholder={optionalHint ? "Leave blank to keep current" : f.secret ? "••••••••" : undefined}
          required={!optionalHint}
          flex="1 1 200px"
        />
      ))}
    </div>
  );
}

/* ─── Inline collapsible "Add Provider" panel ─────────────────────────────── */

function AddProviderInlinePanel({
  open,
  onClose,
  adapters,
  adaptersLoading,
}: {
  open: boolean;
  onClose: () => void;
  adapters: AvailableFraudAdapter[];
  adaptersLoading: boolean;
}) {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [priority, setPriority] = useState("0");
  const [fallbackOnError, setFallbackOnError] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [createProvider, { isLoading }] = useCreateFraudProviderMutation();

  const selectableAdapters = adapters.filter((a) => !a.alreadyConfigured);
  const selectedAdapter = adapters.find((a) => a.slug === slug) || null;

  const resetForm = () => {
    setSlug("");
    setName("");
    setBaseUrl("");
    setPriority("0");
    setFallbackOnError(true);
    setIsActive(true);
    setCredentials({});
  };

  const handleSelectAdapter = (newSlug: string) => {
    setSlug(newSlug);
    setCredentials({});
    const adapter = adapters.find((a) => a.slug === newSlug);
    if (adapter && !name) setName(adapter.displayName);
  };

  const handleSubmit = async () => {
    if (!slug) {
      toast.error("Please choose a provider to add");
      return;
    }
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    const missingField = selectedAdapter?.credentialFields.find((f) => !credentials[f.key]?.trim());
    if (missingField) {
      toast.error(`${missingField.label} is required`);
      return;
    }
    try {
      await createProvider({
        slug,
        name: name.trim(),
        baseUrl: baseUrl.trim() || undefined,
        priority: Number(priority) || 0,
        fallbackOnError,
        isActive,
        credentials,
      }).unwrap();
      toast.success(`${name} added`);
      resetForm();
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.error || err?.data?.message || "Failed to add provider");
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 0.32s ease",
        marginBottom: open ? 12 : 0,
      }}
    >
      <div style={{ overflow: "hidden", minHeight: 0 }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5EAF2",
            borderRadius: 12,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 220px" }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>
                Provider <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <select
                value={slug}
                onChange={(e) => handleSelectAdapter(e.target.value)}
                disabled={adaptersLoading}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1.5px solid #E2E8F0",
                  fontSize: 12.5,
                  marginTop: 4,
                  boxSizing: "border-box",
                  background: "#fff",
                }}
              >
                <option value="">
                  {adaptersLoading
                    ? "Loading providers…"
                    : selectableAdapters.length === 0
                      ? "All available providers are already added"
                      : "Select a provider"}
                </option>
                {selectableAdapters.map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.displayName}
                  </option>
                ))}
              </select>
            </div>
            <TextField label="Display Name" required value={name} onChange={setName} placeholder="e.g. Nirvor.app" flex="1 1 220px" />
            <TextField label="Base URL" value={baseUrl} onChange={setBaseUrl} placeholder="Optional override" flex="1 1 220px" />
          </div>

          {selectedAdapter && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <KeyRound size={13} color="#7C3AED" />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#7C3AED" }}>
                  Credentials for {selectedAdapter.displayName}
                </span>
              </div>
              <CredentialFieldsForm
                fields={selectedAdapter.credentialFields}
                values={credentials}
                onChange={(k, v) => setCredentials((c) => ({ ...c, [k]: v }))}
              />
            </>
          )}

          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              label="Priority"
              type="number"
              value={priority}
              onChange={setPriority}
              placeholder="0"
              flex="0 0 100px"
            />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#334155", cursor: "pointer" }}>
              <input type="checkbox" checked={fallbackOnError} onChange={(e) => setFallbackOnError(e.target.checked)} />
              Fall back to next provider on error
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#334155", cursor: "pointer" }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Activate immediately
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <IconButton icon={<X size={13} />} label="Cancel" onClick={onClose} />
            <IconButton
              icon={<Sparkles size={13} />}
              label="Save Provider"
              variant="primary"
              loading={isLoading}
              disabled={!slug || !name.trim()}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Edit provider modal ──────────────────────────────────────────────────── */

function EditProviderModal({
  provider,
  adapters,
  onClose,
}: {
  provider: FraudProvider;
  adapters: AvailableFraudAdapter[];
  onClose: () => void;
}) {
  const adapterDef = adapters.find((a) => a.slug === provider.slug);
  const [name, setName] = useState(provider.name);
  const [baseUrl, setBaseUrl] = useState(provider.baseUrl ?? "");
  const [priority, setPriority] = useState(String(provider.priority));
  const [fallbackOnError, setFallbackOnError] = useState(provider.fallbackOnError);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [updateProvider, { isLoading }] = useUpdateFraudProviderMutation();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    const hasAnyCredentialInput = Object.values(credentials).some((v) => v.trim());
    try {
      await updateProvider({
        id: provider.id,
        name: name.trim(),
        baseUrl: baseUrl.trim() || undefined,
        priority: Number(priority) || 0,
        fallbackOnError,
        credentials: hasAnyCredentialInput ? credentials : undefined,
      }).unwrap();
      toast.success("Provider updated");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.error || err?.data?.message || "Failed to update provider");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 520,
          padding: 20,
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0D1B2E" }}>Edit {provider.name}</div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "#F1F5F9",
              borderRadius: 6,
              width: 24,
              height: 24,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={13} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <TextField label="Display Name" required value={name} onChange={setName} flex="1 1 200px" />
            <TextField label="Base URL" value={baseUrl} onChange={setBaseUrl} placeholder="Optional override" flex="1 1 200px" />
          </div>

          {adapterDef && adapterDef.credentialFields.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <KeyRound size={13} color="#7C3AED" />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#7C3AED" }}>
                  Rotate credentials (optional)
                </span>
              </div>
              <CredentialFieldsForm
                fields={adapterDef.credentialFields}
                values={credentials}
                onChange={(k, v) => setCredentials((c) => ({ ...c, [k]: v }))}
                optionalHint
              />
            </>
          )}

          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <TextField label="Priority" type="number" value={priority} onChange={setPriority} flex="0 0 100px" />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#334155", cursor: "pointer" }}>
              <input type="checkbox" checked={fallbackOnError} onChange={(e) => setFallbackOnError(e.target.checked)} />
              Fall back to next provider on error
            </label>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <IconButton icon={<X size={13} />} label="Cancel" onClick={onClose} />
          <IconButton
            icon={<Sparkles size={13} />}
            label="Save Changes"
            variant="primary"
            loading={isLoading}
            onClick={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Test connection modal ────────────────────────────────────────────────── */

function TestConnectionModal({ provider, onClose }: { provider: FraudProvider; onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<FraudCheckTestResult | null>(null);
  const [testConnection, { isLoading }] = useTestFraudProviderConnectionMutation();

  const handleTest = async () => {
    if (!/^01[3-9]\d{8}$/.test(phone)) {
      toast.error("Enter a valid Bangladeshi number, e.g. 01712345678");
      return;
    }
    try {
      const res = await testConnection({ id: provider.id, phone }).unwrap();
      setResult(res.data);
    } catch (err: any) {
      toast.error(err?.data?.error || "Test call failed");
      setResult(null);
    }
  };

  const hasFraudReports = (result?.fraudReports?.length ?? 0) > 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 460,
          maxHeight: "85vh",
          overflow: "auto",
          padding: 20,
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0D1B2E" }}>Test {provider.name}</div>
          <button
            onClick={onClose}
            style={{ border: "none", background: "#F1F5F9", borderRadius: 6, width: 24, height: 24, cursor: "pointer" }}
          >
            <X size={13} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <TextField label="Phone Number" value={phone} onChange={setPhone} placeholder="01712345678" flex="1" />
        </div>

        <IconButton
          icon={<FlaskConical size={13} />}
          label="Run Test"
          variant="primary"
          loading={isLoading}
          disabled={!phone}
          onClick={handleTest}
        />

        {result && (
          <div style={{ marginTop: 14, borderTop: "1px solid #F0F4FA", paddingTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0D1B2E" }}>
                {result.delivered}/{result.totalParcels} delivered ({result.successRate}%)
              </span>
              <RiskPill level={result.riskLevel} />
              {hasFraudReports && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 20,
                    background: "#FEF2F2",
                    color: "#B91C1C",
                    border: "1px solid #FECACA",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <ShieldAlert size={11} />
                  {result.fraudReports!.length} fraud report{result.fraudReports!.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {result.couriers.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: hasFraudReports ? 12 : 0 }}>
                {result.couriers.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11.5,
                      color: "#64748B",
                      padding: "4px 8px",
                      background: "#FAFBFD",
                      borderRadius: 6,
                    }}
                  >
                    <span>{c.courierName}</span>
                    <span>{c.ratingOnly ? c.customerRating : `${c.delivered}/${c.totalParcels}`}</span>
                  </div>
                ))}
              </div>
            )}

            {hasFraudReports && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <ShieldAlert size={13} color="#DC2626" />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "#DC2626" }}>
                    Merchant-Reported Fraud
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {result.fraudReports!.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: "#FFFBFB",
                        border: "1px solid #FEE2E2",
                        fontSize: 11.5,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, color: "#0D1B2E" }}>{r.name}</span>
                        <span style={{ color: "#94A3B8", fontSize: 10.5, whiteSpace: "nowrap" }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ color: "#64748B" }}>{r.details}</div>
                      {r.courierName && (
                        <div style={{ color: "#94A3B8", fontSize: 10.5, marginTop: 2 }}>via {r.courierName}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Logs modal ────────────────────────────────────────────────────────────── */

function LogsModal({ provider, onClose }: { provider: FraudProvider; onClose: () => void }) {
  const { data, isLoading } = useGetFraudProviderLogsQuery({ id: provider.id, limit: 30 });
  const logs = data?.data ?? [];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 640,
          maxHeight: "80vh",
          overflow: "auto",
          padding: 20,
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0D1B2E" }}>{provider.name} — Recent Checks</div>
          <button
            onClick={onClose}
            style={{ border: "none", background: "#F1F5F9", borderRadius: 6, width: 24, height: 24, cursor: "pointer" }}
          >
            <X size={13} />
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: 24, textAlign: "center" }}>
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 28, textAlign: "center", color: "#9BAABB", fontSize: 12.5 }}>
            No checks recorded yet
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {logs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: log.success ? "#FAFBFD" : "#FFFBFB",
                  border: `1px solid ${log.success ? "#F0F4FA" : "#FEE2E2"}`,
                  fontSize: 11.5,
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ color: "#334155", fontWeight: 600 }}>{log.phone}</span>
                <span style={{ color: "#94A3B8" }}>{new Date(log.createdAt).toLocaleString()}</span>
                {log.latencyMs != null && <span style={{ color: "#94A3B8" }}>{log.latencyMs}ms</span>}
                {log.success ? (
                  log.riskLevel && <RiskPill level={log.riskLevel} />
                ) : (
                  <span style={{ color: "#DC2626", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertCircle size={12} /> {log.errorMessage || "Failed"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */

export default function FraudProvidersPage() {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<FraudProvider | null>(null);
  const [testingProvider, setTestingProvider] = useState<FraudProvider | null>(null);
  const [logsProvider, setLogsProvider] = useState<FraudProvider | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: adaptersData, isLoading: adaptersLoading } = useGetAvailableFraudAdaptersQuery();
  const { data: providersData, isLoading: providersLoading, refetch } = useGetFraudProvidersQuery();
  const [setActive] = useSetFraudProviderActiveMutation();
  const [deleteProvider] = useDeleteFraudProviderMutation();

  const adapters = adaptersData?.data ?? [];
  const providers = providersData?.data ?? [];

  const filteredProviders = useMemo(() => {
    if (!search.trim()) return providers;
    const q = search.trim().toLowerCase();
    return providers.filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
  }, [providers, search]);

  const handleToggleActive = async (provider: FraudProvider) => {
    setTogglingId(provider.id);
    try {
      await setActive({ id: provider.id, isActive: !provider.isActive }).unwrap();
      toast.success(provider.isActive ? `${provider.name} deactivated` : `${provider.name} activated`);
    } catch (err: any) {
      toast.error(err?.data?.error || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (provider: FraudProvider) => {
    if (!confirm(`Remove ${provider.name}? This cannot be undone.`)) return;
    setDeletingId(provider.id);
    try {
      await deleteProvider(provider.id).unwrap();
      toast.success(`${provider.name} removed`);
    } catch (err: any) {
      toast.error(err?.data?.error || "Failed to remove provider");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background: "#F0F4FA",
        minHeight: "100vh",
        width: "100%",
        padding: "18px 24px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 4,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={18} color="#1D4ED8" />
            <span style={{ fontSize: 16, fontWeight: 800, color: "#0D1B2E" }}>
              Fraud Checker Providers
            </span>
          </div>
          <IconButton
            icon={showAddForm ? <X size={13} /> : <Plus size={13} />}
            label={showAddForm ? "Close" : "Add Provider"}
            variant="primary"
            onClick={() => setShowAddForm((v) => !v)}
          />
        </div>
        <p style={{ fontSize: 12, color: "#7A90AB", margin: "0 0 14px" }}>
          Providers are tried in priority order at checkout to flag risky courier customers.
          Turn one off any time — no deploy needed.
        </p>

        <AddProviderInlinePanel
          open={showAddForm}
          onClose={() => setShowAddForm(false)}
          adapters={adapters}
          adaptersLoading={adaptersLoading}
        />

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            flexWrap: "wrap",
            background: "#fff",
            border: "1px solid #E5EAF2",
            borderRadius: 10,
            padding: 10,
          }}
        >
          <FilterInput
            icon={<Search size={13} />}
            placeholder="Search by name or provider key…"
            value={search}
            onChange={setSearch}
          />
          {search && <IconButton icon={<X size={12} />} label="Clear" onClick={() => setSearch("")} />}
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #E5EAF2",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#FAFBFD", borderBottom: "1px solid #E5EAF2" }}>
                  {["Provider", "Priority", "Fallback", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: h === "Actions" ? "right" : "left",
                        padding: "9px 12px",
                        fontWeight: 700,
                        color: "#64748B",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {providersLoading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 24, textAlign: "center" }}>
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    </td>
                  </tr>
                ) : filteredProviders.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 28, textAlign: "center", color: "#9BAABB", fontSize: 12.5 }}>
                      {search ? "No providers match your search" : "No fraud-checker providers added yet"}
                    </td>
                  </tr>
                ) : (
                  filteredProviders.map((provider) => (
                    <tr key={provider.id} style={{ borderBottom: "1px solid #F0F4FA" }}>
                      <td style={{ padding: "9px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 7,
                              background: "#EEF3FB",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <ShieldCheck size={13} color="#1D4ED8" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0D1B2E" }}>{provider.name}</div>
                            <div style={{ fontSize: 10.5, color: "#94A3B8" }}>{provider.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "9px 12px", color: "#334155" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <ArrowUpDown size={11} color="#94A3B8" /> {provider.priority}
                        </span>
                      </td>
                      <td style={{ padding: "9px 12px", color: "#334155" }}>
                        {provider.fallbackOnError ? "Yes" : "No"}
                      </td>
                      <td style={{ padding: "9px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Switch
                            checked={provider.isActive}
                            onChange={() => handleToggleActive(provider)}
                            loading={togglingId === provider.id}
                          />
                          <StatusPill active={provider.isActive} />
                        </div>
                      </td>
                      <td style={{ padding: "9px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, flexWrap: "wrap" }}>
                          <IconButton icon={<FlaskConical size={12} />} label="Test" onClick={() => setTestingProvider(provider)} />
                          <IconButton icon={<ScrollText size={12} />} label="Logs" onClick={() => setLogsProvider(provider)} />
                          <IconButton icon={<Pencil size={12} />} label="Edit" onClick={() => setEditingProvider(provider)} />
                          <IconButton
                            icon={<Trash2 size={12} />}
                            label="Remove"
                            danger
                            loading={deletingId === provider.id}
                            onClick={() => handleDelete(provider)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingProvider && (
        <EditProviderModal provider={editingProvider} adapters={adapters} onClose={() => setEditingProvider(null)} />
      )}
      {testingProvider && <TestConnectionModal provider={testingProvider} onClose={() => setTestingProvider(null)} />}
      {logsProvider && <LogsModal provider={logsProvider} onClose={() => setLogsProvider(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}