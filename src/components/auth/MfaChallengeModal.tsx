"use client";

// components/auth/MfaChallengeModal.tsx
// Second-factor challenge shown after a successful first-factor login when
// the account is MFA-protected or policy-enforced.
//
// Two modes:
//  - verify: TOTP code or single-use recovery code
//  - enrollment (policy-enforced first login): QR + manual secret, then the
//    first code both enables MFA and completes login. Recovery codes are
//    shown exactly once after enrollment.
import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Loader2,
  KeyRound,
  Copy,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import {
  useMfaVerifyMutation,
  useMfaEnrollmentStartMutation,
} from "@/features/mfaApi";
import type { AuthResponse } from "@/features/authApi";

interface MfaChallengeModalProps {
  challengeId: string;
  enrollmentRequired: boolean;
  onSuccess: (response: AuthResponse) => void;
  onCancel: () => void;
  showError: (title: string, message: string) => void;
}

export default function MfaChallengeModal({
  challengeId,
  enrollmentRequired,
  onSuccess,
  onCancel,
  showError,
}: MfaChallengeModalProps) {
  const [useRecovery, setUseRecovery] = useState(false);
  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [enrollment, setEnrollment] = useState<{
    otpauthUrl: string;
    qrCodeDataUrl: string;
    manualEntrySecret: string;
  } | null>(null);
  const [issuedRecoveryCodes, setIssuedRecoveryCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  const [verify, { isLoading: verifying }] = useMfaVerifyMutation();
  const [startEnrollment, { isLoading: enrollmentLoading }] =
    useMfaEnrollmentStartMutation();

  // Policy-enforced first login: fetch the enrollment QR immediately.
  useEffect(() => {
    if (!enrollmentRequired) return;
    startEnrollment({ challengeId })
      .unwrap()
      .then(setEnrollment)
      .catch((err: any) => {
        showError(
          "Setup Failed",
          err?.data?.message || "Could not start authenticator setup. Please sign in again."
        );
        onCancel();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId, enrollmentRequired]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = useRecovery
        ? { challengeId, recoveryCode: recoveryCode.trim() }
        : { challengeId, code: code.trim() };
      const response = (await verify(payload).unwrap()) as AuthResponse & {
        recoveryCodes?: string[];
      };
      if (response.mfaEnrolled && response.recoveryCodes) {
        // Enrollment completed during login — show recovery codes once,
        // then hand the session to the caller.
        setIssuedRecoveryCodes(response.recoveryCodes);
        setTimeout(() => onSuccess(response), 0);
        return;
      }
      onSuccess(response);
    } catch (err: any) {
      showError(
        "Verification Failed",
        err?.data?.message || "Invalid code. Please try again."
      );
    }
  };

  const copyCodes = async () => {
    if (!issuedRecoveryCodes) return;
    try {
      await navigator.clipboard.writeText(issuedRecoveryCodes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — user can copy manually
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #CBD5E1",
    fontSize: 16,
    letterSpacing: "0.3em",
    textAlign: "center",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-w-md w-full mx-4 bg-white rounded-2xl shadow-2xl p-6">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Cancel sign-in"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {enrollmentRequired ? "Set Up Two-Factor Authentication" : "Two-Factor Authentication"}
            </h3>
            <p className="text-xs text-gray-500">
              {enrollmentRequired
                ? "Your account requires an authenticator app"
                : "Enter the code from your authenticator app"}
            </p>
          </div>
        </div>

        {issuedRecoveryCodes ? (
          <div>
            <div className="flex items-start gap-2 p-3 mb-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Save these recovery codes now. Each can be used once if you lose
                your authenticator. They will not be shown again.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4 font-mono text-xs bg-gray-50 border border-gray-200 rounded-lg p-3">
              {issuedRecoveryCodes.map((c) => (
                <span key={c} className="text-gray-800">{c}</span>
              ))}
            </div>
            <button
              onClick={copyCodes}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-teal-600 text-teal-700 text-sm font-semibold hover:bg-teal-50 transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy recovery codes"}
            </button>
            <p className="text-center text-xs text-green-600 mt-3 flex items-center justify-center gap-1">
              <Check size={12} /> Sign-in complete — redirecting…
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {enrollmentRequired && (
              <div className="text-center">
                {enrollmentLoading || !enrollment ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-gray-500 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    Preparing your authenticator setup…
                  </div>
                ) : (
                  <>
                    <img
                      src={enrollment.qrCodeDataUrl}
                      alt="Authenticator QR code"
                      className="mx-auto w-44 h-44 rounded-lg border border-gray-200"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Scan with your authenticator app, or enter this key
                      manually:
                    </p>
                    <p className="font-mono text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 mt-1 break-all select-all">
                      {enrollment.manualEntrySecret}
                    </p>
                  </>
                )}
              </div>
            )}

            {useRecovery && !enrollmentRequired ? (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Recovery code
                </label>
                <input
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  placeholder="xxxx-xxxx-xxxx"
                  autoFocus
                  style={{ ...inputStyle, letterSpacing: "0.05em", fontSize: 14 }}
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  6-digit code
                </label>
                <input
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="••••••"
                  inputMode="numeric"
                  autoFocus
                  style={inputStyle}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={
                verifying ||
                (enrollmentRequired && !enrollment) ||
                (useRecovery ? !recoveryCode.trim() : code.length !== 6)
              }
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <KeyRound size={14} />
                  {enrollmentRequired ? "Enable & Sign In" : "Verify & Sign In"}
                </>
              )}
            </button>

            {!enrollmentRequired && (
              <button
                type="button"
                onClick={() => setUseRecovery((p) => !p)}
                className="w-full text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                {useRecovery
                  ? "Use authenticator code instead"
                  : "Lost your device? Use a recovery code"}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
