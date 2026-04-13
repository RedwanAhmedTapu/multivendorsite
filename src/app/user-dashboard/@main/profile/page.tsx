"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
  useRequestEmailChangeMutation,
  useVerifyEmailChangeMutation,
  useRequestPhoneChangeMutation,
  useVerifyPhoneChangeMutation,
  Gender,
} from "@/features/customerProfileApi";

/* ══════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════ */
type Tab = "profile" | "contact" | "security";
type ToastState = { msg: string; type: "success" | "error" } | null;

/* ══════════════════════════════════════════════════════
   INLINE SVG ICONS
══════════════════════════════════════════════════════ */
const Icon = {
  user: (cls = "w-4 h-4") => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  mail: (cls = "w-4 h-4") => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <rect x="2" y="4" width="20" height="16" rx="3" /><path d="m2 7 10 7 10-7" />
    </svg>
  ),
  shield: (cls = "w-4 h-4") => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <path d="M12 2 3 7v6c0 5.25 3.75 10.15 9 11.35C17.25 23.15 21 18.25 21 13V7l-9-5z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  camera: (cls = "w-5 h-5") => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
  lock: (cls = "w-4 h-4") => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  check: (cls = "w-4 h-4") => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <path d="m5 13 4 4L19 7" />
    </svg>
  ),
  x: (cls = "w-4 h-4") => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  phone: (cls = "w-4 h-4") => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.05 2.7h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z" />
    </svg>
  ),
  warning: (cls = "w-4 h-4") => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  wallet: (cls = "w-4 h-4") => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <path d="M20 12V8H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14v4" />
      <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
      <circle cx="18" cy="12" r="2" />
    </svg>
  ),
  star: (cls = "w-4 h-4") => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
};

/* ══════════════════════════════════════════════════════
   SPINNER
══════════════════════════════════════════════════════ */
function Spinner({ size = 16, light = false }: { size?: number; light?: boolean }) {
  return (
    <div
      className={`rounded-full border-2 animate-spin shrink-0 ${
        light
          ? "border-white/30 border-t-white"
          : "border-[#0052cc]/20 border-t-[#0052cc]"
      }`}
      style={{ width: size, height: size }}
    />
  );
}

/* ══════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════ */
function Toast({
  msg, type, onClose,
}: {
  msg: string; type: "success" | "error"; onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold border max-w-[calc(100vw-2rem)]
        ${type === "success"
          ? "bg-emerald-600 text-white border-emerald-500/50"
          : "bg-red-500 text-white border-red-400/50"
        }`}
    >
      <span className="shrink-0">
        {type === "success" ? Icon.check("w-4 h-4") : Icon.warning("w-4 h-4")}
      </span>
      <span className="flex-1 min-w-0 truncate">{msg}</span>
      <button onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
        {Icon.x("w-4 h-4")}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   AVATAR DISPLAY
══════════════════════════════════════════════════════ */
function AvatarDisplay({
  src, name, size = 80,
}: {
  src?: string | null; name?: string | null; size?: number;
}) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  if (src) {
    return (
      <Image
        src={src} alt={name ?? "avatar"} width={size} height={size}
        className="rounded-2xl object-cover"
        style={{ width: size, height: size, minWidth: size }}
        unoptimized
      />
    );
  }
  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-[#0052cc] to-[#1a6fff] flex items-center justify-center select-none shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="text-white font-bold" style={{ fontSize: size * 0.33 }}>
        {initials}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   VERIFIED BADGE
══════════════════════════════════════════════════════ */
function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 whitespace-nowrap">
      {Icon.check("w-3 h-3")} Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 whitespace-nowrap">
      {Icon.warning("w-3 h-3")} Unverified
    </span>
  );
}

/* ══════════════════════════════════════════════════════
   INPUT BASE
══════════════════════════════════════════════════════ */
const inputBase =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-300 outline-none transition-all duration-200 focus:border-[#0052cc] focus:ring-4 focus:ring-[#0052cc]/8 disabled:bg-slate-50 disabled:text-slate-400 hover:border-slate-300";

/* ══════════════════════════════════════════════════════
   FIELD WRAPPER
══════════════════════════════════════════════════════ */
function Field({
  label, hint, children,
}: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          {label}
        </label>
        {hint && (
          <span className="text-[11px] text-slate-400 truncate max-w-[60%]">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   BUTTON
══════════════════════════════════════════════════════ */
function Btn({
  loading, label, small, variant = "primary", onClick, type = "submit",
}: {
  loading?: boolean; label: string; small?: boolean;
  variant?: "primary" | "ghost"; onClick?: () => void; type?: "submit" | "button";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] whitespace-nowrap";
  const sizes = small ? "text-xs px-4 py-2.5" : "text-sm px-5 py-3";
  const variants = {
    primary:
      "bg-[#0052cc] text-white hover:bg-[#0047b3] shadow-sm shadow-[#0052cc]/25 hover:shadow-md hover:shadow-[#0052cc]/30",
    ghost:
      "text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200",
  };
  return (
    <button
      type={type}
      disabled={loading}
      onClick={onClick}
      className={`${base} ${sizes} ${variants[variant]}`}
    >
      {loading && <Spinner size={13} light={variant === "primary"} />}
      {label}
    </button>
  );
}

/* ══════════════════════════════════════════════════════
   LOCKED NOTICE
══════════════════════════════════════════════════════ */
function LockedNotice({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-2.5 text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 leading-relaxed">
      <span className="shrink-0 mt-0.5 text-slate-300">{Icon.lock("w-3.5 h-3.5")}</span>
      <span>
        <span className="font-semibold text-slate-500">{label}</span> is verified and locked.
        Contact support to make changes.
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SECTION HEAD
══════════════════════════════════════════════════════ */
function SectionHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 pb-5 border-b border-slate-100">
      <h2 className="text-base font-bold text-slate-800 tracking-tight">{title}</h2>
      <p className="text-sm text-slate-400 mt-0.5 leading-snug">{subtitle}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   AVATAR UPLOAD SECTION
══════════════════════════════════════════════════════ */
function AvatarUploadSection({
  profile, cp, showToast,
}: {
  profile: any; cp: any;
  showToast: (m: string, t?: "success" | "error") => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadAvatar, { isLoading: uploading }] = useUploadAvatarMutation();
  const [deleteAvatar, { isLoading: deleting }] = useDeleteAvatarMutation();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      await uploadAvatar(fd).unwrap();
      showToast("Photo updated!");
    } catch {
      showToast("Upload failed", "error");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async () => {
    try {
      await deleteAvatar().unwrap();
      showToast("Photo removed");
    } catch {
      showToast("Failed to remove", "error");
    }
  };

  return (
    <div className="relative group/av shrink-0">
      <div className="ring-[3px] ring-white/30 rounded-2xl overflow-hidden">
        <AvatarDisplay src={cp?.profileImage} name={profile?.name} size={80} />
      </div>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover/av:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
        title="Change photo"
      >
        {uploading ? (
          <Spinner size={18} light />
        ) : (
          <span className="text-white">{Icon.camera("w-5 h-5")}</span>
        )}
      </button>

      {cp?.profileImage && !uploading && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/av:opacity-100 transition-opacity hover:bg-red-600 shadow z-10"
          title="Remove photo"
        >
          {deleting ? <Spinner size={10} light /> : Icon.x("w-2.5 h-2.5")}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   OTP INPUT
══════════════════════════════════════════════════════ */
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/, "").slice(-1);
    const chars = value.padEnd(6, " ").split("");
    chars[i] = digit || " ";
    const next = chars.join("").trimEnd();
    onChange(next);
    if (digit && i < 5) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (!value[i] && i > 0) {
        refs[i - 1].current?.focus();
      } else {
        const chars = value.padEnd(6, " ").split("");
        chars[i] = " ";
        onChange(chars.join("").trimEnd());
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste) {
      onChange(paste);
      refs[Math.min(paste.length, 5)].current?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={(value[i] ?? "").trim()}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="flex-1 min-w-0 h-11 rounded-xl border border-slate-200 bg-white text-center text-base font-bold text-slate-700 outline-none transition-all focus:border-[#0052cc] focus:ring-4 focus:ring-[#0052cc]/10 hover:border-slate-300"
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   CONTACT CARD
══════════════════════════════════════════════════════ */
function ContactCard({
  icon, title, value, verified, children,
}: {
  icon: React.ReactNode; title: string; value: string;
  verified: boolean; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-wrap sm:flex-nowrap">
        <div className="w-9 h-9 rounded-xl bg-[#0052cc]/8 flex items-center justify-center shrink-0">
          <span className="text-[#0052cc]">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-700 leading-tight">{title}</p>
          <p className="text-xs text-slate-400 truncate mt-0.5">{value}</p>
        </div>
        <div className="shrink-0">
          <VerifiedBadge verified={verified} />
        </div>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   EMAIL SECTION
══════════════════════════════════════════════════════ */
function EmailSection({ profile, showToast }: { profile: any; showToast: any }) {
  const [requestEmailChange, { isLoading: requesting }] = useRequestEmailChangeMutation();
  const [verifyEmailChange, { isLoading: verifying }] = useVerifyEmailChangeMutation();
  const [newEmail, setNewEmail] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"idle" | "verify">("idle");
  const isVerified = !!profile?.email && profile?.isVerified;

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestEmailChange({ newEmail }).unwrap();
      setStep("verify");
      showToast("Verification email sent!");
    } catch (err: any) {
      showToast(err?.data?.error ?? "Request failed", "error");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyEmailChange({ token }).unwrap();
      setStep("idle");
      setNewEmail("");
      setToken("");
      showToast("Email updated!");
    } catch (err: any) {
      showToast(err?.data?.error ?? "Verification failed", "error");
    }
  };

  return (
    <ContactCard
      icon={Icon.mail("w-4 h-4")}
      title="Email address"
      value={profile?.email ?? "Not set"}
      verified={isVerified}
    >
      {isVerified ? (
        <LockedNotice label="Email" />
      ) : step === "idle" ? (
        <form onSubmit={handleRequest} className="space-y-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter new email address"
            required
            className={inputBase}
          />
          <Btn loading={requesting} label="Send verification link" small />
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-3">
          <div className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 leading-relaxed">
            We sent a link to{" "}
            <span className="font-bold text-[#0052cc]">{newEmail}</span>. Paste the token below.
          </div>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token from email"
            required
            className={inputBase}
          />
          <div className="flex flex-wrap gap-2">
            <Btn loading={verifying} label="Verify & save" small />
            <Btn
              type="button"
              label="Cancel"
              small
              variant="ghost"
              onClick={() => { setStep("idle"); setNewEmail(""); setToken(""); }}
            />
          </div>
        </form>
      )}
    </ContactCard>
  );
}

/* ══════════════════════════════════════════════════════
   PHONE SECTION
══════════════════════════════════════════════════════ */
function PhoneSection({ profile, showToast }: { profile: any; showToast: any }) {
  const [requestPhoneChange, { isLoading: requesting }] = useRequestPhoneChangeMutation();
  const [verifyPhoneChange, { isLoading: verifying }] = useVerifyPhoneChangeMutation();
  const [newPhone, setNewPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"idle" | "verify">("idle");
  const isVerified = !!profile?.phone && profile?.isVerified;

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestPhoneChange({ newPhone }).unwrap();
      setStep("verify");
      showToast("OTP sent!");
    } catch (err: any) {
      showToast(err?.data?.error ?? "Request failed", "error");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return showToast("Enter all 6 digits", "error");
    try {
      await verifyPhoneChange({ newPhone, otp }).unwrap();
      setStep("idle");
      setNewPhone("");
      setOtp("");
      showToast("Phone updated!");
    } catch (err: any) {
      showToast(err?.data?.error ?? "Verification failed", "error");
    }
  };

  return (
    <ContactCard
      icon={Icon.phone("w-4 h-4")}
      title="Phone number"
      value={profile?.phone ?? "Not set"}
      verified={isVerified}
    >
      {isVerified ? (
        <LockedNotice label="Phone" />
      ) : step === "idle" ? (
        <form onSubmit={handleRequest} className="space-y-3">
          <input
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="e.g. +8801XXXXXXXXX"
            required
            className={inputBase}
          />
          <Btn loading={requesting} label="Send OTP" small />
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-3">
          <div className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 leading-relaxed">
            Enter the 6-digit code sent to{" "}
            <span className="font-bold text-[#0052cc]">{newPhone}</span>
          </div>
          <OtpInput value={otp} onChange={setOtp} />
          <div className="flex flex-wrap gap-2">
            <Btn loading={verifying} label="Verify & save" small />
            <Btn
              type="button"
              label="Cancel"
              small
              variant="ghost"
              onClick={() => { setStep("idle"); setNewPhone(""); setOtp(""); }}
            />
          </div>
        </form>
      )}
    </ContactCard>
  );
}

/* ══════════════════════════════════════════════════════
   PROFILE TAB
══════════════════════════════════════════════════════ */
function ProfileTab({
  profile, showToast,
}: {
  profile: any;
  showToast: (m: string, t?: "success" | "error") => void;
}) {
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [form, setForm] = useState({
    name: profile?.name ?? "",
    gender: profile?.customerProfile?.gender ?? "",
    dateOfBirth: profile?.customerProfile?.dateOfBirth?.slice(0, 10) ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        name: form.name || undefined,
        gender: (form.gender as Gender) || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
      }).unwrap();
      showToast("Profile saved!");
    } catch {
      showToast("Failed to save", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <SectionHead
        title="Personal information"
        subtitle="Your name and basic details visible on your account"
      />
      <div className="space-y-5">
        <Field label="Full name" hint="As it appears on your account">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your full name"
            className={inputBase}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Gender">
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className={inputBase}
            >
              <option value="">Select gender</option>
              <option value={Gender.MALE}>Male</option>
              <option value={Gender.FEMALE}>Female</option>
              <option value={Gender.OTHER}>Prefer not to say</option>
            </select>
          </Field>

          <Field label="Date of birth">
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              className={inputBase}
            />
          </Field>
        </div>

        <div className="pt-1 flex justify-end">
          <Btn loading={isLoading} label="Save changes" />
        </div>
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════════════════
   CONTACT TAB
══════════════════════════════════════════════════════ */
function ContactTab({ profile, showToast }: { profile: any; showToast: any }) {
  return (
    <div>
      <SectionHead
        title="Contact details"
        subtitle="Manage your email and phone. Verified contacts are locked."
      />
      <div className="space-y-4">
        <EmailSection profile={profile} showToast={showToast} />
        <PhoneSection profile={profile} showToast={showToast} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SECURITY TAB
══════════════════════════════════════════════════════ */
function SecurityTab() {
  const items = [
    {
      icon: Icon.lock("w-4 h-4"),
      title: "Password",
      desc: "Change your account password",
      action: { label: "Change", href: "/user-dashboard/change-password" },
    },
    {
      icon: Icon.shield("w-4 h-4"),
      title: "Account status",
      desc: "Your identity has been verified",
      badge: (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0">
          {Icon.check("w-3 h-3")} Active
        </span>
      ),
    },
  ];

  return (
    <div>
      <SectionHead
        title="Account security"
        subtitle="Manage access and keep your account safe"
      />
      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0052cc]/8 flex items-center justify-center shrink-0">
              <span className="text-[#0052cc]">{item.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">{item.title}</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{item.desc}</p>
            </div>
            <div className="shrink-0">
              {item.action ? (
                <a
                  href={item.action.href}
                  className="text-xs font-semibold text-[#0052cc] bg-[#0052cc]/8 hover:bg-[#0052cc]/15 px-3.5 py-2 rounded-xl transition-colors border border-[#0052cc]/15 inline-block"
                >
                  {item.action.label}
                </a>
              ) : (
                item.badge
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   STAT CHIP
══════════════════════════════════════════════════════ */
function StatChip({
  icon, label, value,
}: {
  icon: React.ReactNode; label: string; value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 bg-white/15 backdrop-blur-sm rounded-2xl px-3 py-2.5 border border-white/20 min-w-0">
      <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
        <span className="text-white">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest leading-none truncate">
          {label}
        </p>
        <p className="text-sm font-bold text-white leading-tight mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TABS CONFIG
══════════════════════════════════════════════════════ */
const TABS: { id: Tab; label: string; icon: (cls?: string) => React.ReactNode }[] = [
  { id: "profile",  label: "Profile",  icon: Icon.user   },
  { id: "contact",  label: "Contact",  icon: Icon.mail   },
  { id: "security", label: "Security", icon: Icon.shield },
];

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { data, isLoading } = useGetProfileQuery();
  const profile = data?.data;
  const cp = profile?.customerProfile;

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") =>
    setToast({ msg, type });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7f8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size={36} />
          <p className="text-sm text-slate-400 font-medium">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f8]">
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ── BANNER ── */}
      <div className="relative bg-gradient-to-br from-[#003d99] via-[#0052cc] to-[#1a6fff] overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 left-1/4 w-64 h-64 rounded-full bg-white/[0.04]" />
          <div className="absolute top-6 right-1/3 w-40 h-40 rounded-full bg-white/[0.03]" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.035) 1px,transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 sm:pt-10 sm:pb-28">
          {/* Top row: avatar + name/meta + stats */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5">

            {/* Avatar */}
            <AvatarUploadSection profile={profile} cp={cp} showToast={showToast} />

            {/* Name + meta — takes remaining space */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight break-words">
                  {profile?.name ?? "Your Name"}
                </h1>
                {profile?.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/15 text-white border border-white/25 px-2.5 py-1 rounded-full uppercase tracking-wide backdrop-blur-sm shrink-0">
                    {Icon.check("w-3 h-3")} Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-white/60 font-medium truncate">
                {profile?.email ?? profile?.phone ?? "No contact set"}
              </p>
              {profile?.provider && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white/10 text-white/80 px-2.5 py-1 rounded-full capitalize mt-2 border border-white/15">
                  {profile.provider} account
                </span>
              )}
            </div>

            {/* Stats — row on mobile, col-aligned on desktop */}
            <div className="flex flex-row gap-2 sm:flex-col sm:items-end shrink-0">
              <StatChip
                icon={Icon.wallet("w-3.5 h-3.5")}
                label="Wallet"
                value={`৳${cp?.wallet?.toFixed(2) ?? "0.00"}`}
              />
              <StatChip
                icon={Icon.star("w-3.5 h-3.5")}
                label="Points"
                value={(cp?.loyaltyPoints ?? 0).toLocaleString()}
              />
            </div>

          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-16">
        <div className="flex flex-col lg:flex-row gap-4 items-start">

          {/* ── SIDEBAR (desktop only) ── */}
          <aside className="hidden lg:block w-52 shrink-0 sticky top-6">
            <div className="relative bg-white rounded-2xl border border-slate-100/80 shadow-sm p-2 overflow-hidden">
              {/* accent bar */}
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-[#0052cc] via-[#4d8fe8] to-transparent rounded-t-2xl" />
              <nav className="space-y-0.5">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150
                        ${isActive
                          ? "bg-[#0052cc]/8 text-[#0052cc]"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      <span
                        className={`shrink-0 transition-colors ${
                          isActive ? "text-[#0052cc]" : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      >
                        {tab.icon("w-4 h-4")}
                      </span>
                      <span className="flex-1 text-left">{tab.label}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0052cc] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* ── MAIN PANEL ── */}
          <div className="flex-1 min-w-0 w-full">

            {/* Mobile tab bar */}
            <div className="lg:hidden bg-white rounded-2xl border border-slate-100/80 shadow-sm mb-4 overflow-hidden">
              <div className="grid grid-cols-3">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center gap-1.5 py-3.5 text-[10px] font-bold transition-all border-b-2 uppercase tracking-wide
                        ${isActive
                          ? "border-[#0052cc] text-[#0052cc] bg-[#0052cc]/5"
                          : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      <span className={isActive ? "text-[#0052cc]" : "text-slate-400"}>
                        {tab.icon("w-4 h-4")}
                      </span>
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content card */}
            <div className="relative bg-white rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden">
              {/* accent bar */}
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-[#0052cc] via-[#4d8fe8] to-transparent" />
              <div className="p-5 sm:p-7">
                {activeTab === "profile" && (
                  <ProfileTab profile={profile} showToast={showToast} />
                )}
                {activeTab === "contact" && (
                  <ContactTab profile={profile} showToast={showToast} />
                )}
                {activeTab === "security" && <SecurityTab />}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}