"use client";

// components/auth/MfaSettingsSection.tsx
// Self-service two-factor authentication management: status, TOTP enrollment
// wizard (QR + manual key), disable, recovery-code regeneration, and the
// AuthSession device list with per-session revoke.
// Self-contained card — matches the authsettings page design language.
import React, { useState } from "react";
import { toast } from "sonner";
import { Sk } from "@/components/admin/ui/AdminSkeletons";
import {
  ShieldCheck,
  Shield,
  Loader2,
  Copy,
  Check,
  KeyRound,
  Monitor,
  Trash2,
  RefreshCw,
  AlertCircle,
  Smartphone,
} from "lucide-react";
import {
  useGetMfaStatusQuery,
  useMfaSetupStartMutation,
  useMfaSetupVerifyMutation,
  useMfaDisableMutation,
  useMfaRegenerateRecoveryCodesMutation,
  useGetMfaSessionsQuery,
  useRevokeMfaSessionMutation,
} from "@/features/mfaApi";

const ACCENT = "#0D9488";
const ACCENT_BG = "#F0FDFA";
const ACCENT_BORDER = "#99F6E4";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 11px",
  borderRadius: 7,
  border: "1px solid #CBD5E1",
  fontSize: 12.5,
  fontFamily: "inherit",
  color: "#1E293B",
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
};

const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 18px",
  borderRadius: 8,
  border: "none",
  background: disabled ? "#CBD5E1" : `linear-gradient(135deg,${ACCENT},#14B8A6)`,
  color: "#fff",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "inherit",
});

const ghostBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #E2E8F0",
  background: "#fff",
  color: "#64748B",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

function RecoveryCodesGrid({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          padding: "10px 12px",
          background: "#FFFBEB",
          border: "1px solid #FDE68A",
          borderRadius: 9,
          fontSize: 11.5,
          color: "#92400E",
          marginBottom: 10,
        }}
      >
        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        Save these recovery codes now. Each works once if you lose your
        authenticator. They will not be shown again.
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 6,
          fontFamily: "monospace",
          fontSize: 11.5,
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: 9,
          padding: 10,
          marginBottom: 10,
        }}
      >
        {codes.map((c) => (
          <span key={c} style={{ color: "#1E293B" }}>{c}</span>
        ))}
      </div>
      <button onClick={copy} style={ghostBtn}>
        {copied ? <Check size={12} style={{ verticalAlign: -2, marginRight: 5 }} /> : <Copy size={12} style={{ verticalAlign: -2, marginRight: 5 }} />}
        {copied ? "Copied" : "Copy all"}
      </button>
    </div>
  );
}

export default function MfaSettingsSection() {
  const { data: status, refetch: refetchStatus } = useGetMfaStatusQuery();
  const [setupStart, { isLoading: starting }] = useMfaSetupStartMutation();
  const [setupVerify, { isLoading: verifying }] = useMfaSetupVerifyMutation();
  const [disableMfa, { isLoading: disabling }] = useMfaDisableMutation();
  const [regenerate, { isLoading: regenerating }] = useMfaRegenerateRecoveryCodesMutation();

  // wizard state
  const [step, setStep] = useState<"idle" | "password" | "scan" | "disable" | "regenerate">("idle");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [enrollment, setEnrollment] = useState<{
    qrCodeDataUrl: string;
    manualEntrySecret: string;
  } | null>(null);
  const [freshCodes, setFreshCodes] = useState<string[] | null>(null);

  const reset = () => {
    setStep("idle");
    setPassword("");
    setCode("");
    setRecoveryCode("");
    setEnrollment(null);
  };

  const handleStartSetup = async () => {
    try {
      const result = await setupStart({ password: password || undefined }).unwrap();
      setEnrollment(result);
      setStep("scan");
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not start setup");
    }
  };

  const handleVerifySetup = async () => {
    try {
      const result = await setupVerify({ code }).unwrap();
      setFreshCodes(result.recoveryCodes);
      toast.success("Two-factor authentication enabled");
      refetchStatus();
    } catch (err: any) {
      toast.error(err?.data?.message || "Invalid code — try again");
    }
  };

  const handleDisable = async () => {
    try {
      await disableMfa({
        password: password || undefined,
        code: code || undefined,
        recoveryCode: recoveryCode || undefined,
      }).unwrap();
      toast.success("Two-factor authentication disabled");
      reset();
      refetchStatus();
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not disable MFA");
    }
  };

  const handleRegenerate = async () => {
    try {
      const result = await regenerate({ password: password || undefined, code }).unwrap();
      setFreshCodes(result.recoveryCodes);
      reset();
      refetchStatus();
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not regenerate recovery codes");
    }
  };

  const busy = starting || verifying || disabling || regenerating;

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${ACCENT_BORDER}`,
        borderRadius: 12,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.03)",
        overflow: "hidden",
        marginBottom: 14,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: `1px solid ${ACCENT_BORDER}`,
          background: ACCENT_BG,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "#fff",
              border: `1px solid ${ACCENT_BORDER}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {status?.enrolled ? (
              <ShieldCheck size={14} color={ACCENT} />
            ) : (
              <Shield size={14} color="#B45309" />
            )}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, letterSpacing: "-0.2px" }}>
              Two-Factor Authentication (2FA)
            </div>
            <div style={{ fontSize: 11, color: "#7A90AB", marginTop: 2 }}>
              Require an authenticator code in addition to your password
            </div>
          </div>
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "2px 7px",
            borderRadius: 20,
            color: status?.enrolled ? "#059669" : "#B45309",
            background: status?.enrolled ? "#D1FAE5" : "#FEF3C7",
            border: `0.5px solid ${status?.enrolled ? "#6EE7B7" : "#FDE68A"}`,
          }}
        >
          {status?.enrolled ? "Enabled" : "Not Enabled"}
        </span>
      </div>

      <div style={{ padding: 16 }}>
        {freshCodes ? (
          <RecoveryCodesGrid codes={freshCodes} />
        ) : status?.enrolled ? (
          /* ── Enabled state ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 12, color: "#3D5068" }}>
              Your account is protected with an authenticator app.
              {status.enabledAt && (
                <> Enabled on {new Date(status.enabledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.</>
              )}
              {" "}Recovery codes remaining: <strong>{status.remainingRecoveryCodes}</strong>.
            </div>

            {step === "idle" && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => setStep("regenerate")} style={ghostBtn}>
                  <RefreshCw size={12} style={{ verticalAlign: -2, marginRight: 5 }} />
                  Regenerate recovery codes
                </button>
                <button
                  onClick={() => setStep("disable")}
                  style={{ ...ghostBtn, color: "#DC2626", borderColor: "#FECACA" }}
                >
                  Disable 2FA
                </button>
              </div>
            )}

            {(step === "disable" || step === "regenerate") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#3D5068" }}>
                  {step === "disable" ? "Confirm to disable 2FA" : "Confirm to regenerate recovery codes"}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Current password (not needed for social-only accounts)"
                  style={inputStyle}
                />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit authenticator code"
                  inputMode="numeric"
                  style={inputStyle}
                />
                {step === "disable" && (
                  <input
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    placeholder="…or a recovery code"
                    style={inputStyle}
                  />
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={step === "disable" ? handleDisable : handleRegenerate}
                    disabled={busy || !code}
                    style={primaryBtn(busy || !code)}
                  >
                    {busy && <Loader2 size={12} className="spin" />}
                    Confirm
                  </button>
                  <button onClick={reset} style={ghostBtn}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Not-enrolled state / enrollment wizard ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {step === "idle" && (
              <>
                <div style={{ fontSize: 12, color: "#3D5068", lineHeight: 1.5 }}>
                  Add a second layer of protection: after your password, sign-in
                  also requires a 6-digit code from an authenticator app
                  (Google Authenticator, 1Password, etc.).
                </div>
                <div>
                  <button onClick={() => setStep("password")} style={primaryBtn(false)}>
                    <ShieldCheck size={13} />
                    Enable 2FA
                  </button>
                </div>
              </>
            )}

            {step === "password" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#3D5068" }}>
                  Confirm your password to continue
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Current password (not needed for social-only accounts)"
                  style={inputStyle}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleStartSetup} disabled={starting} style={primaryBtn(starting)}>
                    {starting && <Loader2 size={12} className="spin" />}
                    Continue
                  </button>
                  <button onClick={reset} style={ghostBtn}>Cancel</button>
                </div>
              </div>
            )}

            {step === "scan" && enrollment && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 460 }}>
                <div style={{ textAlign: "center" }}>
                  <img
                    src={enrollment.qrCodeDataUrl}
                    alt="Authenticator QR code"
                    style={{ width: 176, height: 176, margin: "0 auto", borderRadius: 8, border: "1px solid #E2E8F0" }}
                  />
                  <p style={{ fontSize: 11.5, color: "#64748B", marginTop: 8 }}>
                    Scan with your authenticator app, or enter this key manually:
                  </p>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11.5,
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 7,
                      padding: "6px 10px",
                      wordBreak: "break-all",
                      userSelect: "all",
                    }}
                  >
                    {enrollment.manualEntrySecret}
                  </p>
                </div>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter the 6-digit code to finish"
                  inputMode="numeric"
                  style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.3em", fontSize: 15 }}
                />
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <button
                    onClick={handleVerifySetup}
                    disabled={verifying || code.length !== 6}
                    style={primaryBtn(verifying || code.length !== 6)}
                  >
                    {verifying && <Loader2 size={12} className="spin" />}
                    <KeyRound size={12} />
                    Verify & Enable
                  </button>
                  <button onClick={reset} style={ghostBtn}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sessions */}
      <SessionsCard />
    </div>
  );
}

function SessionsCard() {
  const { data, isLoading, refetch } = useGetMfaSessionsQuery();
  const [revoke, { isLoading: revoking }] = useRevokeMfaSessionMutation();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const sessions = data?.sessions ?? [];
  const active = sessions.filter((s) => s.active);

  const handleRevoke = async (id: string) => {
    setPendingId(id);
    try {
      await revoke(id).unwrap();
      toast.success("Session signed out");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not sign out the session");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div style={{ borderTop: "1px solid #E2E8F0", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Monitor size={14} color="#475569" />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#3D5068" }}>
          Signed-in devices
        </span>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>
          {active.length} active session{active.length !== 1 ? "s" : ""}
        </span>
      </div>

      {isLoading ? (
        <div
          aria-busy="true"
          aria-label="Loading signed-in devices"
          style={{ display: "flex", flexDirection: "column", gap: 6 }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
              }}
            >
              <Sk className="h-3.5 w-3.5 shrink-0 rounded" />
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                <Sk className={i === 1 ? "h-2.5 w-2/5" : "h-2.5 w-3/5"} />
                <Sk soft className="h-2 w-2/5" />
              </div>
              <Sk className="h-[26px] w-[26px] shrink-0 rounded-[7px]" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ fontSize: 12, color: "#94A3B8" }}>
          No registered sessions yet — devices appear here after your next sign-in.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sessions.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #E2E8F0",
                background: s.active ? "#F8FAFC" : "#FAFAFA",
                opacity: s.active ? 1 : 0.6,
              }}
            >
              <Smartphone size={14} color="#64748B" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.userAgent || "Unknown device"}
                </div>
                <div style={{ fontSize: 10.5, color: "#94A3B8" }}>
                  {s.ip || "unknown ip"} · signed in {new Date(s.createdAt).toLocaleString()}
                  {s.active ? "" : " · signed out"}
                </div>
              </div>
              {s.active && (
                <button
                  onClick={() => handleRevoke(s.id)}
                  disabled={revoking && pendingId === s.id}
                  title="Sign out this session"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    border: "1px solid #FECACA",
                    background: "#FEF2F2",
                    color: "#DC2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {revoking && pendingId === s.id ? (
                    <Loader2 size={11} className="spin" />
                  ) : (
                    <Trash2 size={11} />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
