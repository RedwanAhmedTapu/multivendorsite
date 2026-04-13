// app/settings/change-password/page.tsx
"use client";

import { useState } from "react";
import { useChangePasswordMutation } from "@/features/authApi";
import {
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ------------------- Password Input -------------------
function PasswordInput({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-slate-50
          text-slate-800 text-sm placeholder:text-slate-400
          focus:outline-none focus:border-[#0052cc] focus:bg-white
          focus:ring-[3.5px] focus:ring-[#0052cc]/10 transition-all"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0052cc]"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

// ------------------- Strength Meter -------------------
function StrengthMeter({ password }: { password: string }) {
  const getScore = (pw: string) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const score = getScore(password);
  if (!password) return null;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-red-400", "bg-orange-400", "bg-emerald-400", "bg-emerald-500"];
  const textColors = ["", "text-red-500", "text-orange-500", "text-emerald-600", "text-emerald-600"];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i <= score ? colors[score] : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[score]}`}>
        {labels[score]} password
      </p>
    </div>
  );
}

// ------------------- Page -------------------
export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const passwordsMatch =
    newPassword && confirmPassword && newPassword === confirmPassword;

  const passwordsMismatch =
    newPassword && confirmPassword && newPassword !== confirmPassword;

  // ------------------- Submit -------------------
  const handleSubmit = async () => {
    setErrorMsg("");
    setSuccess(false);

    // ✅ Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return setErrorMsg("Please fill in all fields.");
    }

    if (newPassword !== confirmPassword) {
      return setErrorMsg("Passwords do not match.");
    }

    if (newPassword.length < 8) {
      return setErrorMsg("Password must be at least 8 characters.");
    }

    try {
      // ✅ Only passwords (NO email / phone)
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      }).unwrap();

      setSuccess(true);

      // Reset fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setErrorMsg(err?.data?.message || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f8] flex items-center justify-center p-6">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#0052cc] to-[#2684ff] px-10 py-9 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Lock size={22} />
            <h1 className="text-lg font-bold">Change Password</h1>
          </div>
          <p className="text-white/70 text-sm">
            Update your password to keep your account secure.
          </p>
        </div>

        {/* Body */}
        <div className="px-10 py-8 space-y-6">

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle2 size={16} />
              Password changed successfully
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          <PasswordInput
            id="current"
            label="Current Password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={setCurrentPassword}
          />

          <PasswordInput
            id="new"
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={setNewPassword}
          />

          <StrengthMeter password={newPassword} />

          <PasswordInput
            id="confirm"
            label="Confirm Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />

          {passwordsMatch && (
            <p className="text-xs text-green-600">✓ Passwords match</p>
          )}
          {passwordsMismatch && (
            <p className="text-xs text-red-500">✗ Passwords do not match</p>
          )}

          {/* Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-3 bg-[#0052cc] text-white rounded-xl font-semibold"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>

          {/* Back */}
          <button
            onClick={() => history.back()}
            className="flex items-center gap-1 text-sm text-slate-500 mx-auto"
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>
    </div>
  );
}