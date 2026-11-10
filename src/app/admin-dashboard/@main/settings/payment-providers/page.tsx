// src/app/admin-dashboard/@main/settings/payment-providers/page.tsx
"use client";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useGetPaymentProvidersQuery,
  useCreatePaymentProviderMutation,
  useUpsertPaymentCredentialMutation,
  useActivatePaymentProviderMutation,
  useDeactivatePaymentProviderMutation,
  type PaymentProvider,
  type PaymentCredential,
  type PaymentAuthType,
  type PaymentEnvironment,
  type UpsertPaymentCredentialDto,
  type ApiErrorResponse,
} from "@/features/adminPaymentProviderApi";
import {
  Loader2,
  Landmark,
  Plus,
  X,
  Sparkles,
  KeyRound,
  Pencil,
  ArrowUpDown,
  Search,
  Globe,
  CircleCheck,
  Info,
} from "lucide-react";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as { data?: Partial<ApiErrorResponse> } | undefined;
  return e?.data?.message || fallback;
}

function parsePriority(value: string, fallback = 100): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envLabel(env: PaymentEnvironment): string {
  return env === "PRODUCTION" ? "Production" : "Sandbox";
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function credentialFor(provider: PaymentProvider, env: PaymentEnvironment): PaymentCredential | undefined {
  return provider.payment_credentials.find((c) => c.environment === env);
}

/* ─── Credential field definitions ──────────────────────────────────────────
   The form is driven by a "profile" = the provider's authType, refined by
   gateway name where the field set differs from the generic one:

   BASIC      (SSLCommerz-style): storeId + storePassword
   TOKEN      (EPS-style):        merchantId + storeId + username + password + hashKey
   PAYSTATION (authType BASIC):   merchantId + password
   ─────────────────────────────────────────────────────────────────────────── */

type CredentialKey = "storeId" | "storePassword" | "merchantId" | "username" | "password" | "hashKey";
type CredentialValues = Partial<Record<CredentialKey, string>>;
type CredentialProfile = "BASIC" | "TOKEN" | "PAYSTATION";

interface CredentialFieldDef {
  key: CredentialKey;
  label: string;
  secret?: boolean;
}

function credentialProfileFor(authType: PaymentAuthType, gatewayName?: string): CredentialProfile {
  if (gatewayName?.trim().toUpperCase() === "PAYSTATION") return "PAYSTATION";
  return authType;
}

function credentialFieldsFor(profile: CredentialProfile): CredentialFieldDef[] {
  switch (profile) {
    case "PAYSTATION":
      return [
        { key: "merchantId", label: "Merchant ID" },
        { key: "password", label: "Password", secret: true },
      ];
    case "TOKEN":
      return [
        { key: "merchantId", label: "Merchant ID" },
        { key: "storeId", label: "Store ID" },
        { key: "username", label: "Username" },
        { key: "password", label: "Password", secret: true },
        { key: "hashKey", label: "Hash Key", secret: true },
      ];
    default:
      return [
        { key: "storeId", label: "Store ID" },
        { key: "storePassword", label: "Store Password", secret: true },
      ];
  }
}

/** Only send fields that belong to this profile and are non-blank. */
function buildCredentialPayload(
  profile: CredentialProfile,
  values: CredentialValues,
): Omit<UpsertPaymentCredentialDto, "providerId" | "environment"> {
  const payload: Omit<UpsertPaymentCredentialDto, "providerId" | "environment"> = {};
  for (const field of credentialFieldsFor(profile)) {
    const v = values[field.key]?.trim();
    if (v) payload[field.key] = v;
  }
  return payload;
}

function hasAnyCredentialInput(profile: CredentialProfile, values: CredentialValues): boolean {
  return Object.keys(buildCredentialPayload(profile, values)).length > 0;
}

function missingCredentialLabels(profile: CredentialProfile, values: CredentialValues): string[] {
  return credentialFieldsFor(profile)
    .filter((f) => !values[f.key]?.trim())
    .map((f) => f.label);
}

/* ─── Small reusable bits (identical language to the fraud-providers page) ─── */

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
      {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : icon}
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
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  flex?: string;
  disabled?: boolean;
}) {
  return (
    <div style={{ flex }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>
        {label} {required && <span style={{ color: "#DC2626" }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={type === "password" ? "new-password" : "off"}
        style={{
          width: "100%",
          padding: "7px 10px",
          borderRadius: 8,
          border: "1.5px solid #E2E8F0",
          fontSize: 12.5,
          marginTop: 4,
          boxSizing: "border-box",
          background: disabled ? "#F8FAFC" : "#fff",
          color: disabled ? "#94A3B8" : "inherit",
          cursor: disabled ? "not-allowed" : "text",
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
        whiteSpace: "nowrap",
      }}
    >
      {active ? onLabel : offLabel}
    </span>
  );
}

function EnvPill({ label, configured, title }: { label: string; configured: boolean; title?: string }) {
  return (
    <span
      title={title}
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 20,
        background: configured ? "#EEF3FB" : "#F1F5F9",
        color: configured ? "#1D4ED8" : "#94A3B8",
        border: `1px solid ${configured ? "#DCE6FA" : "#E2E8F0"}`,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {configured && <CircleCheck size={10} />}
      {label}
    </span>
  );
}

/** Toggle switch — activating one gateway deactivates every other one server-side. */
function Switch({ checked, onChange, loading }: { checked: boolean; onChange: () => void; loading?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
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

/** Provider logo (from API `logo`) with a Landmark fallback. */
function ProviderLogo({ logo, size = 26 }: { logo: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        background: "#EEF3FB",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {logo && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" onError={() => setFailed(true)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      ) : (
        <Landmark size={Math.round(size / 2)} color="#1D4ED8" />
      )}
    </div>
  );
}

function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        background: "#F8FAFF",
        border: "1px solid #DCE6FA",
        borderRadius: 8,
        padding: "8px 10px",
        fontSize: 11.5,
        color: "#475569",
        lineHeight: 1.45,
      }}
    >
      <Info size={13} color="#1D4ED8" style={{ marginTop: 1, flexShrink: 0 }} />
      <div>{children}</div>
    </div>
  );
}

/* ─── Known gateway templates — quick-select fills name/authType/base URLs.
   Admin can still pick "Custom" and fill everything by hand for a gateway
   not listed here. EPS base URLs are left blank on purpose (confirm them
   against your EPS onboarding docs) — production URL is required by the API. */

interface GatewayTemplate {
  key: string;
  name: string; // becomes PaymentProvider.name (id/slug source)
  displayName: string;
  authType: PaymentAuthType;
  productionBaseUrl: string;
  sandboxBaseUrl: string;
}

const GATEWAY_TEMPLATES: GatewayTemplate[] = [
  {
    key: "SSLCOMMERZ",
    name: "SSLCOMMERZ",
    displayName: "SSLCommerz",
    authType: "BASIC",
    productionBaseUrl: "https://securepay.sslcommerz.com",
    sandboxBaseUrl: "https://sandbox.sslcommerz.com",
  },
  {
    key: "PAYSTATION",
    name: "PAYSTATION",
    displayName: "PayStation",
    authType: "BASIC",
    productionBaseUrl: "https://api.paystation.com.bd",
    sandboxBaseUrl: "https://sandbox.paystation.com.bd",
  },
  {
    key: "EPS",
    name: "EPS",
    displayName: "EPS (Easy Payment System)",
    authType: "TOKEN",
    productionBaseUrl: "",
    sandboxBaseUrl: "",
  },
];

function CredentialFieldsForm({
  profile,
  values,
  onChange,
  existing,
}: {
  profile: CredentialProfile;
  values: CredentialValues;
  onChange: (key: CredentialKey, value: string) => void;
  /** When rotating: the saved credential row, used only for placeholders (secrets are never displayed). */
  existing?: PaymentCredential;
}) {
  const fields = credentialFieldsFor(profile);
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {fields.map((f) => {
        let placeholder: string | undefined;
        if (existing) {
          const current = existing[f.key];
          placeholder = f.secret
            ? current
              ? "•••••••• saved — leave blank to keep"
              : "Not set"
            : current
              ? `Current: ${current} — leave blank to keep`
              : "Not set";
        } else if (f.secret) {
          placeholder = "••••••••";
        }
        return (
          <TextField
            key={f.key}
            label={f.label}
            type={f.secret ? "password" : "text"}
            value={values[f.key] ?? ""}
            onChange={(v) => onChange(f.key, v)}
            placeholder={placeholder}
            flex="1 1 200px"
          />
        );
      })}
    </div>
  );
}

/* ─── Inline collapsible "Add Provider" panel ─────────────────────────────── */

function AddProviderInlinePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [templateKey, setTemplateKey] = useState<string>("");
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [productionBaseUrl, setProductionBaseUrl] = useState("");
  const [sandboxBaseUrl, setSandboxBaseUrl] = useState("");
  const [authType, setAuthType] = useState<PaymentAuthType>("BASIC");
  const [priority, setPriority] = useState("100");
  const [activateImmediately, setActivateImmediately] = useState(false);
  const [prodCredentials, setProdCredentials] = useState<CredentialValues>({});
  const [sandboxCredentials, setSandboxCredentials] = useState<CredentialValues>({});
  // Set once the provider row exists so a retry after a later-step failure never creates a duplicate.
  const [createdProviderId, setCreatedProviderId] = useState<string | null>(null);

  const [createProvider, { isLoading: creating }] = useCreatePaymentProviderMutation();
  const [upsertCredential, { isLoading: savingCreds }] = useUpsertPaymentCredentialMutation();
  const [activateProvider, { isLoading: activating }] = useActivatePaymentProviderMutation();

  const isBusy = creating || savingCreds || activating;
  const locked = !!createdProviderId;
  const profile = credentialProfileFor(authType, name);

  const resetForm = () => {
    setTemplateKey("");
    setName("");
    setDisplayName("");
    setProductionBaseUrl("");
    setSandboxBaseUrl("");
    setAuthType("BASIC");
    setPriority("100");
    setActivateImmediately(false);
    setProdCredentials({});
    setSandboxCredentials({});
    setCreatedProviderId(null);
  };

  const handleSelectTemplate = (key: string) => {
    setTemplateKey(key);
    if (key === "CUSTOM" || key === "") return;
    const tpl = GATEWAY_TEMPLATES.find((t) => t.key === key);
    if (!tpl) return;
    setName(tpl.name);
    setDisplayName(tpl.displayName);
    setAuthType(tpl.authType);
    setProductionBaseUrl(tpl.productionBaseUrl);
    setSandboxBaseUrl(tpl.sandboxBaseUrl);
    setProdCredentials({});
    setSandboxCredentials({});
  };

  const handleAuthTypeChange = (next: PaymentAuthType) => {
    setAuthType(next);
    setProdCredentials({});
    setSandboxCredentials({});
  };

  const hasProdCreds = hasAnyCredentialInput(profile, prodCredentials);
  const hasSandboxCreds = hasAnyCredentialInput(profile, sandboxCredentials);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Gateway name is required");
      return;
    }
    if (!productionBaseUrl.trim()) {
      toast.error("Production base URL is required");
      return;
    }
    // Once an environment is started, every field for this auth type is needed.
    for (const [env, values, started] of [
      ["PRODUCTION", prodCredentials, hasProdCreds],
      ["SANDBOX", sandboxCredentials, hasSandboxCreds],
    ] as const) {
      if (started) {
        const missing = missingCredentialLabels(profile, values);
        if (missing.length) {
          toast.error(`${envLabel(env)} credentials incomplete — missing: ${missing.join(", ")}`);
          return;
        }
      }
    }
    if (activateImmediately && !hasProdCreds && !hasSandboxCreds) {
      toast.error("Add credentials before activating — checkout can't use a gateway with none");
      return;
    }

    let providerId = createdProviderId;
    try {
      if (!providerId) {
        const provider = await createProvider({
          name: name.trim(),
          displayName: displayName.trim() || undefined,
          sandboxBaseUrl: sandboxBaseUrl.trim() || undefined,
          productionBaseUrl: productionBaseUrl.trim(),
          authType,
          priority: parsePriority(priority),
        }).unwrap();
        providerId = provider.data.id;
        setCreatedProviderId(providerId);
      }

      if (hasProdCreds) {
        await upsertCredential({
          providerId,
          environment: "PRODUCTION",
          ...buildCredentialPayload(profile, prodCredentials),
        }).unwrap();
      }
      if (hasSandboxCreds) {
        await upsertCredential({
          providerId,
          environment: "SANDBOX",
          ...buildCredentialPayload(profile, sandboxCredentials),
        }).unwrap();
      }
      if (activateImmediately) {
        await activateProvider(providerId).unwrap();
      }

      toast.success(`${displayName.trim() || name.trim()} added${activateImmediately ? " and activated" : ""}`);
      resetForm();
      onClose();
    } catch (err) {
      const base = getErrorMessage(err, "Failed to add gateway");
      toast.error(
        providerId
          ? `${base}. The gateway was created — fix the issue and press Save again to finish (it won't be duplicated).`
          : base,
      );
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "7px 10px",
    borderRadius: 8,
    border: "1.5px solid #E2E8F0",
    fontSize: 12.5,
    marginTop: 4,
    boxSizing: "border-box",
    background: locked ? "#F8FAFC" : "#fff",
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
          {locked && (
            <InfoNote>
              This gateway was already created, but a later step (credentials or activation) failed. Gateway details are locked —
              adjust the credentials below and press <b>Save Gateway</b> to retry.
            </InfoNote>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 220px" }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>Gateway Template</label>
              <select value={templateKey} disabled={locked} onChange={(e) => handleSelectTemplate(e.target.value)} style={selectStyle}>
                <option value="">Select a template </option>
                {GATEWAY_TEMPLATES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.displayName}
                  </option>
                ))}
              </select>
            </div>
            <TextField label="Gateway Name" required value={name} onChange={setName} placeholder="e.g. SSLCOMMERZ" flex="1 1 180px" disabled={locked} />
            <TextField label="Display Name" value={displayName} onChange={setDisplayName} placeholder="e.g. SSLCommerz" flex="1 1 200px" disabled={locked} />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <TextField
              label="Production Base URL"
              required
              value={productionBaseUrl}
              onChange={setProductionBaseUrl}
              placeholder="https://securepay.example.com"
              flex="1 1 240px"
              disabled={locked}
            />
            <TextField
              label="Sandbox Base URL"
              value={sandboxBaseUrl}
              onChange={setSandboxBaseUrl}
              placeholder="Optional — e.g. https://sandbox.example.com"
              flex="1 1 240px"
              disabled={locked}
            />
            <div style={{ flex: "0 0 200px" }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>Auth Type</label>
              <select value={authType} disabled={locked} onChange={(e) => handleAuthTypeChange(e.target.value as PaymentAuthType)} style={selectStyle}>
                <option value="BASIC">BASIC (static credentials)</option>
                <option value="TOKEN">TOKEN (merchant/store + user/pass + hash)</option>
              </select>
            </div>
          </div>

          <InfoNote>
            {profile === "PAYSTATION"
              ? "PayStation needs a Merchant ID and Password per environment (the Password is sent with each initiate-payment call)."
              : profile === "BASIC"
                ? "BASIC gateways (e.g. SSLCommerz) need a Store ID and Store Password per environment."
                : "TOKEN gateways (e.g. EPS) need Merchant ID, Store ID, Username, Password and Hash Key per environment."}{" "}
            Once you start filling an environment, all of its fields are required. New gateways are created inactive.
          </InfoNote>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <KeyRound size={13} color="#7C3AED" />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#7C3AED" }}>Production Credentials</span>
          </div>
          <CredentialFieldsForm profile={profile} values={prodCredentials} onChange={(k, v) => setProdCredentials((c) => ({ ...c, [k]: v }))} />

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <KeyRound size={13} color="#7C3AED" />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#7C3AED" }}>Sandbox Credentials (optional)</span>
          </div>
          <CredentialFieldsForm profile={profile} values={sandboxCredentials} onChange={(k, v) => setSandboxCredentials((c) => ({ ...c, [k]: v }))} />

          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <TextField label="Priority" type="number" value={priority} onChange={setPriority} placeholder="100" flex="0 0 100px" disabled={locked} />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#334155", cursor: "pointer" }}>
              <input type="checkbox" checked={activateImmediately} onChange={(e) => setActivateImmediately(e.target.checked)} />
              Activate immediately (deactivates every other gateway)
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <IconButton icon={<X size={13} />} label="Cancel" onClick={handleCancel} disabled={isBusy} />
            <IconButton
              icon={<Sparkles size={13} />}
              label="Save Gateway"
              variant="primary"
              loading={isBusy}
              disabled={!name.trim() || !productionBaseUrl.trim()}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Saved-credential status card (never shows secret values) ─────────────── */

function CredentialStatusCard({
  profile,
  environment,
  credential,
}: {
  profile: CredentialProfile;
  environment: PaymentEnvironment;
  credential?: PaymentCredential;
}) {
  if (!credential) {
    return (
      <div
        style={{
          background: "#F8FAFC",
          border: "1px dashed #CBD5E1",
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 12,
          color: "#64748B",
          marginBottom: 10,
        }}
      >
        No {envLabel(environment).toLowerCase()} credentials saved yet — fill in every field below to set them up.
      </div>
    );
  }

  const tokenExpired = !!credential.tokenExpiresAt && new Date(credential.tokenExpiresAt).getTime() < Date.now();

  const rows: { label: string; value: React.ReactNode }[] = credentialFieldsFor(profile).map((f) => {
    const current = credential[f.key];
    return {
      label: f.label,
      value: f.secret ? (
        <span style={{ color: current ? "#16A34A" : "#94A3B8", fontWeight: 700 }}>{current ? "Set" : "Not set"}</span>
      ) : (
        <span style={{ color: current ? "#0D1B2E" : "#94A3B8", fontWeight: current ? 600 : 400 }}>{current || "Not set"}</span>
      ),
    };
  });

  if (profile === "TOKEN") {
    rows.push({
      label: "Access Token",
      value: <span style={{ color: credential.accessToken ? "#16A34A" : "#94A3B8", fontWeight: 700 }}>{credential.accessToken ? "Cached" : "None yet"}</span>,
    });
    rows.push({
      label: "Token Expires",
      value: (
        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          {formatDateTime(credential.tokenExpiresAt)}
          {credential.tokenExpiresAt && <StatusPill active={!tokenExpired} onLabel="Valid" offLabel="Expired" />}
        </span>
      ),
    });
  }

  return (
    <div style={{ background: "#F8FAFC", border: "1px solid #E5EAF2", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#334155" }}>Saved {envLabel(environment).toLowerCase()} credentials</span>
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <StatusPill active={credential.isActive} onLabel="Enabled" offLabel="Disabled" />
          <span style={{ fontSize: 10.5, color: "#94A3B8" }}>Updated {formatDateTime(credential.updatedAt)}</span>
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "6px 16px" }}>
        {rows.map((r) => (
          <div key={r.label} style={{ fontSize: 12 }}>
            <div style={{ fontSize: 10.5, color: "#94A3B8", fontWeight: 700 }}>{r.label}</div>
            <div style={{ overflowWrap: "anywhere" }}>{r.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Edit provider modal — provider details (read-only) + rotate credentials per environment ─── */

function EditProviderModal({ provider, onClose }: { provider: PaymentProvider; onClose: () => void }) {
  const [environment, setEnvironment] = useState<PaymentEnvironment>("PRODUCTION");
  const [credentials, setCredentials] = useState<CredentialValues>({});

  const [upsertCredential, { isLoading: savingCreds }] = useUpsertPaymentCredentialMutation();

  const profile = credentialProfileFor(provider.authType, provider.name);
  const prodCredential = credentialFor(provider, "PRODUCTION");
  const sandboxCredential = credentialFor(provider, "SANDBOX");
  const currentCredential = environment === "PRODUCTION" ? prodCredential : sandboxCredential;

  const switchEnvironment = (env: PaymentEnvironment) => {
    setEnvironment(env);
    setCredentials({});
  };

  const handleSaveCredentials = async () => {
    if (!hasAnyCredentialInput(profile, credentials)) {
      toast.error("Enter at least one credential field to update");
      return;
    }
    // First-time setup of an environment needs the full set; rotation can be partial.
    if (!currentCredential) {
      const missing = missingCredentialLabels(profile, credentials);
      if (missing.length) {
        toast.error(`${envLabel(environment)} credentials incomplete — missing: ${missing.join(", ")}`);
        return;
      }
    }
    try {
      await upsertCredential({
        providerId: provider.id,
        environment,
        ...buildCredentialPayload(profile, credentials),
      }).unwrap();
      toast.success(`${envLabel(environment)} credentials saved`);
      setCredentials({});
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save credentials"));
    }
  };

  const envTab = (env: PaymentEnvironment, configured: boolean) => (
    <button
      type="button"
      onClick={() => switchEnvironment(env)}
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 20,
        border: `1px solid ${environment === env ? "#1D4ED8" : "#E2E8F0"}`,
        background: environment === env ? "#EEF3FB" : "#fff",
        color: environment === env ? "#1D4ED8" : "#64748B",
        cursor: "pointer",
      }}
    >
      {envLabel(env)} {configured && "✓"}
    </button>
  );

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
          maxWidth: 620,
          maxHeight: "92vh",
          overflowY: "auto",
          padding: 20,
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <ProviderLogo logo={provider.logo} size={30} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0D1B2E", display: "flex", alignItems: "center", gap: 8 }}>
                {provider.displayName || provider.name}
                <StatusPill active={provider.isActive} />
              </div>
              <div style={{ fontSize: 10.5, color: "#94A3B8" }}>
                {provider.slug} · {provider.authType}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
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
              flexShrink: 0,
            }}
          >
            <X size={13} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {provider.description && <div style={{ fontSize: 12, color: "#475569" }}>{provider.description}</div>}

          <InfoNote>
            Gateway details are read-only here — the API currently supports creating a gateway, saving credentials, and
            activating/deactivating. Base URLs, priority and display name can't be changed after creation.
          </InfoNote>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <TextField label="Display Name" value={provider.displayName ?? ""} onChange={() => {}} flex="1 1 200px" disabled />
            <TextField label="Priority" type="number" value={String(provider.priority)} onChange={() => {}} flex="0 0 100px" disabled />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <TextField label="Production Base URL" value={provider.productionBaseUrl} onChange={() => {}} flex="1 1 220px" disabled />
            <TextField label="Sandbox Base URL" value={provider.sandboxBaseUrl ?? ""} onChange={() => {}} placeholder="Not set" flex="1 1 220px" disabled />
          </div>
          <div style={{ fontSize: 10.5, color: "#94A3B8" }}>
            Created {formatDateTime(provider.createdAt)} · Updated {formatDateTime(provider.updatedAt)}
          </div>

          <div style={{ borderTop: "1px solid #F0F4FA", paddingTop: 10, marginTop: 2 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <KeyRound size={13} color="#7C3AED" />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#7C3AED" }}>Credentials</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {envTab("PRODUCTION", !!prodCredential)}
                {envTab("SANDBOX", !!sandboxCredential)}
              </div>
            </div>

            <CredentialStatusCard profile={profile} environment={environment} credential={currentCredential} />

            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
              {currentCredential ? `Rotate ${envLabel(environment).toLowerCase()} credentials` : `Set ${envLabel(environment).toLowerCase()} credentials`}
            </div>
            <CredentialFieldsForm
              profile={profile}
              values={credentials}
              onChange={(k, v) => setCredentials((c) => ({ ...c, [k]: v }))}
              existing={currentCredential}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <IconButton
                icon={<Sparkles size={13} />}
                label={`Save ${envLabel(environment)} Credentials`}
                variant="primary"
                loading={savingCreds}
                onClick={handleSaveCredentials}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <IconButton icon={<X size={13} />} label="Close" onClick={onClose} />
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */

export default function PaymentProvidersPage() {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  // Keep only the id so the modal always renders fresh data after a credential save refetches the list.
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: providersData, isLoading: providersLoading, isError: providersError, refetch } = useGetPaymentProvidersQuery();
  const [activateProvider] = useActivatePaymentProviderMutation();
  const [deactivateProvider] = useDeactivatePaymentProviderMutation();

  const providers = useMemo(() => providersData?.data ?? [], [providersData]);
  const editingProvider = useMemo(
    () => (editingProviderId ? providers.find((p) => p.id === editingProviderId) ?? null : null),
    [providers, editingProviderId],
  );

  const filteredProviders = useMemo(() => {
    if (!search.trim()) return providers;
    const q = search.trim().toLowerCase();
    return providers.filter(
      (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || (p.displayName ?? "").toLowerCase().includes(q),
    );
  }, [providers, search]);

  const handleToggleActive = async (provider: PaymentProvider) => {
    const label = provider.displayName || provider.name;
    if (!provider.isActive && provider.payment_credentials.length === 0) {
      toast.error(`Add credentials to ${label} before activating it`);
      return;
    }
    setTogglingId(provider.id);
    try {
      if (provider.isActive) {
        await deactivateProvider(provider.id).unwrap();
        toast.success(`${label} deactivated`);
      } else {
        const res = await activateProvider(provider.id).unwrap();
        toast.success(res.message || `${label} activated — every other gateway was turned off`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update status"));
    } finally {
      setTogglingId(null);
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
        {/* Header */}
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
            <Landmark size={18} color="#1D4ED8" />
            <span style={{ fontSize: 16, fontWeight: 800, color: "#0D1B2E" }}>Payment Gateway Providers</span>
          </div>
          <IconButton
            icon={showAddForm ? <X size={13} /> : <Plus size={13} />}
            label={showAddForm ? "Close" : "Add Gateway"}
            variant="primary"
            onClick={() => setShowAddForm((v) => !v)}
          />
        </div>
        <p style={{ fontSize: 12, color: "#7A90AB", margin: "0 0 14px" }}>
          Exactly one gateway is active at a time — that's the one checkout uses. Activating a gateway automatically deactivates
          every other one.
        </p>

        {/* Inline collapsible add-gateway form */}
        <AddProviderInlinePanel open={showAddForm} onClose={() => setShowAddForm(false)} />

        {/* Filter bar */}
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
          <FilterInput icon={<Search size={13} />} placeholder="Search by gateway name…" value={search} onChange={setSearch} />
          {search && <IconButton icon={<X size={12} />} label="Clear" onClick={() => setSearch("")} />}
        </div>

        {/* Table */}
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
                  {["Gateway", "Auth Type", "Environments", "Priority", "Status", "Actions"].map((h) => (
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
                    <td colSpan={6} style={{ padding: 24, textAlign: "center" }}>
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    </td>
                  </tr>
                ) : providersError ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 28, textAlign: "center", color: "#DC2626", fontSize: 12.5 }}>
                      <div style={{ marginBottom: 10 }}>Couldn't load payment gateways.</div>
                      <IconButton icon={<ArrowUpDown size={12} />} label="Try again" onClick={() => refetch()} />
                    </td>
                  </tr>
                ) : filteredProviders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 28, textAlign: "center", color: "#9BAABB", fontSize: 12.5 }}>
                      {search ? "No gateways match your search" : "No payment gateways added yet"}
                    </td>
                  </tr>
                ) : (
                  filteredProviders.map((provider) => {
                    const prodCredential = credentialFor(provider, "PRODUCTION");
                    const sandboxCredential = credentialFor(provider, "SANDBOX");
                    return (
                      <tr key={provider.id} style={{ borderBottom: "1px solid #F0F4FA" }}>
                        <td style={{ padding: "9px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <ProviderLogo logo={provider.logo} />
                            <div>
                              <div style={{ fontWeight: 700, color: "#0D1B2E" }} title={provider.description ?? undefined}>
                                {provider.displayName || provider.name}
                              </div>
                              <div style={{ fontSize: 10.5, color: "#94A3B8", display: "flex", alignItems: "center", gap: 4 }}>
                                <Globe size={10} /> {provider.productionBaseUrl.replace(/^https?:\/\//, "")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "9px 12px", color: "#334155" }}>{provider.authType}</td>
                        <td style={{ padding: "9px 12px" }}>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            <EnvPill
                              label="Production"
                              configured={!!prodCredential}
                              title={prodCredential ? `Updated ${formatDateTime(prodCredential.updatedAt)}` : "No production credentials"}
                            />
                            <EnvPill
                              label="Sandbox"
                              configured={!!sandboxCredential}
                              title={sandboxCredential ? `Updated ${formatDateTime(sandboxCredential.updatedAt)}` : "No sandbox credentials"}
                            />
                          </div>
                        </td>
                        <td style={{ padding: "9px 12px", color: "#334155" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <ArrowUpDown size={11} color="#94A3B8" /> {provider.priority}
                          </span>
                        </td>
                        <td style={{ padding: "9px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Switch checked={provider.isActive} onChange={() => handleToggleActive(provider)} loading={togglingId === provider.id} />
                            <StatusPill active={provider.isActive} />
                          </div>
                        </td>
                        <td style={{ padding: "9px 12px" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, flexWrap: "wrap" }}>
                            <IconButton icon={<Pencil size={12} />} label="Edit" onClick={() => setEditingProviderId(provider.id)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingProvider && <EditProviderModal key={editingProvider.id} provider={editingProvider} onClose={() => setEditingProviderId(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}