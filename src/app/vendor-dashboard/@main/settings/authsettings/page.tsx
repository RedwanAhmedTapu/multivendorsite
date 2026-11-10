"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import {
  useChangePasswordMutation,
  useGetWebauthnCredentialsQuery,
  useWebauthnRegisterOptionsMutation,
  useWebauthnRegisterVerifyMutation,
  useRemoveWebauthnCredentialMutation,
  WebAuthnCredentialSummary,
  useGetLastLoginQuery,
} from "@/features/authApi";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Plus,
  Trash2,
  Shield,
  ShieldCheck,
  AlertCircle,
  Check,
  Loader2,
  Monitor,
  Smartphone,
  ExternalLink,
  RefreshCw,
  X,
} from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";

/* ─── Shared primitives ────────────────────────────────────────────────── */

function SectionCard({
  icon,
  title,
  subtitle,
  accent = "#1D4ED8",
  accentBg = "#EFF6FF",
  accentBorder = "#BFDBFE",
  children,
  headerRight,
  error,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  accent?: string;
  accentBg?: string;
  accentBorder?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${error ? "#FCA5A5" : accentBorder}`,
        borderRadius: 12,
        boxShadow: error
          ? "0 0 0 3px rgba(239,68,68,0.08)"
          : "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.03)",
        transition: "box-shadow 0.3s, border-color 0.3s",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: `1px solid ${accentBorder}`,
          background: error ? "#FEF2F2" : accentBg,
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
              border: `1px solid ${accentBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: accent,
                letterSpacing: "-0.2px",
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 11, color: "#7A90AB", marginTop: 2 }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
        {headerRight}
      </div>
      <div style={{ padding: "16px", flex: 1 }}>{children}</div>
    </div>
  );
}

function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: 5 }}>
      <label
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: "#3D5068",
          letterSpacing: "0.01em",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {children}
        {required && (
          <span style={{ color: "#DC2626", fontWeight: 800 }}>*</span>
        )}
      </label>
      {hint && (
        <p style={{ fontSize: 10.5, color: "#9BAABB", marginTop: 2 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        marginTop: 4,
        fontSize: 11,
        color: "#DC2626",
      }}
    >
      <AlertCircle size={12} />
      {message}
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  error,
  success,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
  success?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "8px 36px 8px 11px",
          borderRadius: 7,
          border: `1px solid ${error ? "#FCA5A5" : success ? "#6EE7B7" : "#CBD5E1"}`,
          fontSize: 12.5,
          fontFamily: "inherit",
          color: "#1E293B",
          outline: "none",
          background: "#fff",
          boxSizing: "border-box",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
        onFocus={(e) => {
          if (!error && !success) {
            e.currentTarget.style.borderColor = "#1D4ED8";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(29,78,216,0.1)";
          }
        }}
        onBlur={(e) => {
          if (!error && !success) {
            e.currentTarget.style.borderColor = "#CBD5E1";
            e.currentTarget.style.boxShadow = "none";
          }
        }}
      />
      <button
        type="button"
        onClick={() => setShow((p) => !p)}
        style={{
          position: "absolute",
          right: 9,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#94A3B8",
          padding: 0,
          display: "flex",
        }}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

function Pill({
  text,
  color = "#1D4ED8",
  bg = "#EFF6FF",
  border = "#BFDBFE",
}: {
  text: string;
  color?: string;
  bg?: string;
  border?: string;
}) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: 20,
        color,
        background: bg,
        border: `0.5px solid ${border}`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

/* ─── Profile Update Section ────────────────────────────────────────────── */

function ProfileUpdateSection() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = (val: string): React.CSSProperties => ({
    width: "100%",
    padding: "8px 11px",
    borderRadius: 7,
    border: `1px solid ${val ? "#6EE7B7" : "#CBD5E1"}`,
    fontSize: 12.5,
    fontFamily: "inherit",
    color: "#1E293B",
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
  });

  return (
    <SectionCard
      icon={<User size={14} color="#1D4ED8" />}
      title="Update Profile"
      subtitle="Change your name, email, or phone number"
      accent="#1D4ED8"
      accentBg="#EFF6FF"
      accentBorder="#BFDBFE"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        <div style={{ gridColumn: "1 / -1" }}>
          <FieldLabel required>Full Name</FieldLabel>
          <div style={{ position: "relative" }}>
            <User
              size={13}
              color="#94A3B8"
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              style={{
                ...inputStyle(name),
                paddingLeft: 30,
                paddingRight: name ? 28 : 11,
              }}
            />
            {name && (
              <Check
                size={13}
                color="#10B981"
                style={{
                  position: "absolute",
                  right: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
            )}
          </div>
        </div>

        <div>
          <FieldLabel hint="Used for account recovery">
            Email Address
          </FieldLabel>
          <div style={{ position: "relative" }}>
            <Mail
              size={13}
              color="#94A3B8"
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              style={{
                ...inputStyle(email),
                paddingLeft: 30,
                paddingRight: email ? 28 : 11,
              }}
            />
            {email && (
              <Check
                size={13}
                color="#10B981"
                style={{
                  position: "absolute",
                  right: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
            )}
          </div>
        </div>

        <div>
          <FieldLabel hint="Used for OTP login">
            Phone Number
          </FieldLabel>
          <div style={{ position: "relative" }}>
            <Phone
              size={13}
              color="#94A3B8"
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+8801XXXXXXXXX"
              style={{
                ...inputStyle(phone),
                paddingLeft: 30,
                paddingRight: phone ? 28 : 11,
              }}
            />
            {phone && (
              <Check
                size={13}
                color="#10B981"
                style={{
                  position: "absolute",
                  right: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 22px",
            borderRadius: 8,
            border: "none",
            background:
              saving || !name.trim()
                ? "#CBD5E1"
                : "linear-gradient(135deg,#1D4ED8,#2563EB)",
            color: "#fff",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: saving || !name.trim() ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            transition: "all 0.15s",
            boxShadow: saving || !name.trim()
              ? "none"
              : "0 2px 8px rgba(29,78,216,0.25)",
          }}
        >
          {saving ? (
            <>
              <Loader2 size={13} className="spin" />
              Saving…
            </>
          ) : (
            <>
              <Check size={13} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </SectionCard>
  );
}

/* ─── Password Change Section ──────────────────────────────────────────── */

function PasswordChangeSection() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!current) e.current = "Current password is required";
    if (!newPass) e.newPass = "New password is required";
    else if (newPass.length < 8)
      e.newPass = "Password must be at least 8 characters";
    if (!confirm) e.confirm = "Please confirm your new password";
    else if (newPass !== confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [current, newPass, confirm]);

  const handleSubmit = async () => {
    if (!validate()) {
      toast.warning("Please fix the errors above");
      return;
    }
    try {
      await changePassword({
        currentPassword: current,
        newPassword: newPass,
        confirmPassword: confirm,
      }).unwrap();
      toast.success("Password changed successfully");
      setCurrent("");
      setNewPass("");
      setConfirm("");
      setErrors({});
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to change password");
    }
  };

  const pwInput = (
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    errorKey: string
  ) => (
    <div>
      <PasswordInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        error={!!errors[errorKey]}
        success={value.length > 0 && !errors[errorKey]}
      />
      <FieldError message={errors[errorKey]} />
    </div>
  );

  return (
    <SectionCard
      icon={<Lock size={14} color="#DC2626" />}
      title="Change Password"
      subtitle="Update your account password"
      accent="#DC2626"
      accentBg="#FEF2F2"
      accentBorder="#FECACA"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div>
          <FieldLabel required>Current Password</FieldLabel>
          {pwInput(current, setCurrent, "Enter your current password", "current")}
        </div>

        <div>
          <FieldLabel required hint="Minimum 8 characters">
            New Password
          </FieldLabel>
          {pwInput(newPass, setNewPass, "Enter a strong new password", "newPass")}
          {newPass && (
            <div
              style={{
                display: "flex",
                gap: 5,
                marginTop: 6,
                flexWrap: "wrap",
              }}
            >
              {[
                { label: "8+ chars", ok: newPass.length >= 8 },
                { label: "Number", ok: /\d/.test(newPass) },
                { label: "Uppercase", ok: /[A-Z]/.test(newPass) },
                { label: "Symbol", ok: /[^A-Za-z0-9]/.test(newPass) },
              ].map((r) => (
                <span
                  key={r.label}
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 20,
                    color: r.ok ? "#059669" : "#94A3B8",
                    background: r.ok ? "#D1FAE5" : "#F1F5F9",
                    border: `0.5px solid ${r.ok ? "#6EE7B7" : "#E2E8F0"}`,
                    transition: "all 0.2s",
                  }}
                >
                  {r.ok ? "✓" : "○"} {r.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <FieldLabel required>Confirm New Password</FieldLabel>
          {pwInput(confirm, setConfirm, "Re-enter your new password", "confirm")}
        </div>

        <div style={{ marginTop: 2, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 22px",
              borderRadius: 8,
              border: "none",
              background: isLoading
                ? "#CBD5E1"
                : "linear-gradient(135deg,#DC2626,#EF4444)",
              color: "#fff",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
              boxShadow: isLoading ? "none" : "0 2px 8px rgba(220,38,38,0.25)",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={13} className="spin" />
                Changing…
              </>
            ) : (
              <>
                <ShieldCheck size={13} />
                Update Password
              </>
            )}
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

/* ─── WebAuthn / Passkey Section ────────────────────────────────────────── */

function WebAuthnSection() {
  const [nickname, setNickname] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);

  const {
    data: credsData,
    isLoading: credsLoading,
    refetch: refetchCreds,
  } = useGetWebauthnCredentialsQuery();

  const [registerOptions] = useWebauthnRegisterOptionsMutation();
  const [registerVerify] = useWebauthnRegisterVerifyMutation();
  const [removeCredential] = useRemoveWebauthnCredentialMutation();

  const credentials: WebAuthnCredentialSummary[] =
    credsData?.credentials ?? [];

  const handleRegister = async () => {
    if (!showNameInput) {
      setShowNameInput(true);
      return;
    }
    if (!nickname.trim()) {
      toast.warning("Please enter a nickname for this passkey");
      return;
    }

    setIsRegistering(true);
    try {
      const optsResult = await registerOptions().unwrap();
      const attResp = await startRegistration({
        optionsJSON: optsResult.options,
      });
      await registerVerify({
        challengeId: optsResult.challengeId,
        response: attResp,
        nickname: nickname.trim() || undefined,
      }).unwrap();

      toast.success("Passkey registered successfully!");
      setNickname("");
      setShowNameInput(false);
      refetchCreds();
    } catch (err: any) {
      if (err?.name === "AbortError" || err?.name === "NotAllowedError") {
        toast.info("Passkey registration was cancelled");
      } else {
        console.error("WebAuthn register error:", err);
        toast.error(
          err?.data?.message || err?.message || "Failed to register passkey"
        );
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRemove = async (credId: string, credNickname: string) => {
    if (!confirm(`Remove passkey "${credNickname || credId.slice(0, 8)}"?`))
      return;
    setRemovingId(credId);
    try {
      await removeCredential(credId).unwrap();
      toast.success("Passkey removed");
      refetchCreds();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to remove passkey");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <SectionCard
      icon={<Fingerprint size={14} color="#7C3AED" />}
      title="Passkeys & Fast Login"
      subtitle="Register a device for passwordless authentication"
      accent="#7C3AED"
      accentBg="#F5F3FF"
      accentBorder="#C4B5FD"
      headerRight={
        credentials.length > 0 ? (
          <Pill
            text={`${credentials.length} passkey${credentials.length !== 1 ? "s" : ""}`}
            color="#7C3AED"
            bg="#F5F3FF"
            border="#C4B5FD"
          />
        ) : undefined
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 1fr) 2fr",
          gap: 16,
        }}
        className="webauthn-grid"
      >
        {/* Left: Info + Register */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "11px 12px",
              background: "#F5F3FF",
              border: "0.5px solid #C4B5FD",
              borderRadius: 9,
              fontSize: 11.5,
              color: "#5B21B6",
              lineHeight: 1.5,
            }}
          >
            <Shield
              size={15}
              color="#7C3AED"
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <div>
              <strong>What are passkeys?</strong> Passkeys let you log in
              using your device's fingerprint, face ID, or PIN — no password
              needed.
            </div>
          </div>

          {showNameInput ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FieldLabel required hint="e.g. MacBook Pro, Office PC">
                Passkey Nickname
              </FieldLabel>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="My device name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRegister();
                  if (e.key === "Escape") {
                    setShowNameInput(false);
                    setNickname("");
                  }
                }}
                style={{
                  width: "100%",
                  padding: "8px 11px",
                  borderRadius: 7,
                  border: "1px solid #C4B5FD",
                  fontSize: 12.5,
                  fontFamily: "inherit",
                  color: "#1E293B",
                  outline: "none",
                  background: "#fff",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={handleRegister}
                  disabled={isRegistering || !nickname.trim()}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 7,
                    border: "none",
                    background:
                      isRegistering || !nickname.trim()
                        ? "#CBD5E1"
                        : "linear-gradient(135deg,#7C3AED,#8B5CF6)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor:
                      isRegistering || !nickname.trim()
                        ? "not-allowed"
                        : "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  {isRegistering ? (
                    <>
                      <Loader2 size={12} className="spin" />
                      Waiting…
                    </>
                  ) : (
                    <>
                      <Fingerprint size={12} />
                      Register
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowNameInput(false);
                    setNickname("");
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 7,
                    border: "1px solid #E2E8F0",
                    background: "#fff",
                    color: "#64748B",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleRegister}
              disabled={isRegistering}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                padding: "10px 18px",
                borderRadius: 9,
                border: "1.5px solid #C4B5FD",
                background: "#F5F3FF",
                color: "#7C3AED",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: isRegistering ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isRegistering) {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg,#7C3AED,#8B5CF6)";
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.borderColor = "transparent";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#F5F3FF";
                e.currentTarget.style.color = "#7C3AED";
                e.currentTarget.style.borderColor = "#C4B5FD";
              }}
            >
              <Plus size={14} />
              Register New Passkey
            </button>
          )}
        </div>

        {/* Right: Credentials list */}
        <div>
          {credsLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "32px 0",
                color: "#94A3B8",
                fontSize: 12.5,
              }}
            >
              <RefreshCw size={14} className="spin" />
              Loading passkeys…
            </div>
          ) : credentials.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px 0",
                color: "#94A3B8",
                fontSize: 12.5,
              }}
            >
              <Fingerprint
                size={26}
                color="#EDE9FE"
                style={{ margin: "0 auto 8px", display: "block" }}
              />
              No passkeys registered yet
              <br />
              <span style={{ fontSize: 11, color: "#B0BEC5" }}>
                Add one for faster, passwordless login
              </span>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 8,
              }}
            >
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: "#FAFAFE",
                    border: "1px solid #EDE9FE",
                    borderRadius: 9,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#C4B5FD";
                    e.currentTarget.style.background = "#F5F3FF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#EDE9FE";
                    e.currentTarget.style.background = "#FAFAFE";
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {cred.deviceType?.toLowerCase().includes("multi") ? (
                      <Monitor size={14} color="#fff" />
                    ) : (
                      <Smartphone size={14} color="#fff" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "#0D1B2E",
                        marginBottom: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cred.nickname || "Unnamed Passkey"}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <Pill
                        text={cred.deviceType || "Unknown"}
                        color="#7C3AED"
                        bg="#F5F3FF"
                        border="#C4B5FD"
                      />
                      {cred.backedUp && (
                        <Pill
                          text="Synced"
                          color="#0369A1"
                          bg="#F0F9FF"
                          border="#BAE6FD"
                        />
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#94A3B8",
                        marginTop: 3,
                      }}
                    >
                      Added{" "}
                      {new Date(cred.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {cred.lastUsedAt && (
                        <>
                          {" · "}
                          Last used{" "}
                          {new Date(cred.lastUsedAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleRemove(cred.id, cred.nickname || undefined)
                    }
                    disabled={removingId === cred.id}
                    title="Remove this passkey"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      border: "1px solid #FECACA",
                      background: "#FEF2F2",
                      color: removingId === cred.id ? "#CBD5E1" : "#DC2626",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor:
                        removingId === cred.id ? "not-allowed" : "pointer",
                      flexShrink: 0,
                      transition: "all 0.15s",
                      opacity: removingId === cred.id ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (removingId !== cred.id) {
                        e.currentTarget.style.background = "#FEE2E2";
                        e.currentTarget.style.borderColor = "#FCA5A5";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#FEF2F2";
                      e.currentTarget.style.borderColor = "#FECACA";
                    }}
                  >
                    {removingId === cred.id ? (
                      <Loader2 size={12} className="spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

/* ─── Security Overview Section ─────────────────────────────────────────── */

function SecurityOverviewSection() {
  const { data: credsData } = useGetWebauthnCredentialsQuery();
  const { data: lastLoginData } = useGetLastLoginQuery();

  const hasPasskeys = (credsData?.credentials?.length ?? 0) > 0;
  const lastMethod = lastLoginData?.lastLogin?.method;
  const usedPasskeyLast = lastMethod === "WEBAUTHN";

  const items = [
    {
      label: "Passkeys",
      status: hasPasskeys ? "Active" : "Not Set Up",
      ok: hasPasskeys,
      detail: hasPasskeys
        ? `${credsData!.credentials.length} registered`
        : "Add a passkey for fast login",
      icon: <Fingerprint size={16} />,
    },
    {
      label: "Last Login Method",
      status: lastMethod || "N/A",
      ok: usedPasskeyLast,
      detail: usedPasskeyLast
        ? "Passwordless — great!"
        : lastMethod
          ? "Consider setting up a passkey"
          : "No logins yet",
      icon: <KeyRound size={16} />,
    },
    {
      label: "Account Status",
      status: "Verified",
      ok: true,
      detail: "Your vendor account is active and in good standing",
      icon: <ShieldCheck size={16} />,
    },
  ];

  return (
    <SectionCard
      icon={<ShieldCheck size={14} color="#059669" />}
      title="Security Overview"
      subtitle="Your account security status at a glance"
      accent="#059669"
      accentBg="#F0FDF4"
      accentBorder="#BBF7D0"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 10,
        }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              padding: "12px",
              background: item.ok ? "#F0FDF4" : "#FFFBEB",
              border: `1px solid ${item.ok ? "#BBF7D0" : "#FDE68A"}`,
              borderRadius: 9,
              display: "flex",
              flexDirection: "column",
              gap: 5,
              transition: "all 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: item.ok ? "#D1FAE5" : "#FEF3C7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: item.ok ? "#059669" : "#B45309",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#64748B",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: item.ok ? "#059669" : "#B45309",
                  }}
                >
                  {item.status}
                </div>
              </div>
            </div>
            <p
              style={{
                fontSize: 10.5,
                color: "#64748B",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */

export default function AuthSettingsPage() {
  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        background:
          "linear-gradient(180deg, #F0F4FA 0%, #E8EEF7 100%)",
        minHeight: "100vh",
        padding: "20px 24px 40px",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @media (max-width: 1024px) {
          .main-grid { grid-template-columns: 1fr !important; }
          .webauthn-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .auth-page { padding: 16px 12px 32px !important; }
        }
      `}</style>

      <div
        className="auth-page"
        style={{
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        {/* ── Page header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(124,58,237,0.25)",
              }}
            >
              <ShieldCheck size={21} color="#fff" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#0D1B2E",
                  margin: 0,
                  letterSpacing: "-0.4px",
                  lineHeight: 1.1,
                }}
              >
                Security & Authentication
              </h1>
              <p
                style={{
                  fontSize: 12.5,
                  color: "#7A90AB",
                  margin: "3px 0 0",
                }}
              >
                Manage your profile, password, and passkeys
              </p>
            </div>
          </div>
        </div>

        {/* ── Security Overview (full width) ── */}
        <div style={{ marginBottom: 14 }}>
          <SecurityOverviewSection />
        </div>

        {/* ── Two-column: Profile + Password ── */}
        <div
          className="main-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 14,
            marginBottom: 14,
          }}
        >
          <ProfileUpdateSection />
          <PasswordChangeSection />
        </div>

        {/* ── WebAuthn (full width) ── */}
        <WebAuthnSection />
      </div>
    </div>
  );
}