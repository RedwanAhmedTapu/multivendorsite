"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Phone, ArrowRight, CheckCircle, AlertCircle, ChevronRight, Store, TrendingUp, Shield, Zap } from "lucide-react";
import { useLoginMutation, useRegisterMutation, useVerifyOtpMutation } from "@/features/authApi";
import { useDispatch } from "react-redux";
import { setCredentials as setReduxCredentials } from "@/features/authSlice";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = "login" | "register" | "otp";

interface FieldState {
  phone: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

// ── Animated stat card ────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, delay }: {
  icon: React.ElementType; label: string; value: string; delay: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-white font-bold text-sm leading-none">{value}</p>
        <p className="text-teal-100 text-xs mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Input field ───────────────────────────────────────────────────────────────

function InputField({
  label, children, error, success,
}: { label: string; children: React.ReactNode; error?: string; success?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
        {label}
      </label>
      {children}
      {error && (
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
          <span className="text-xs text-red-400">{error}</span>
        </div>
      )}
      {success && !error && (
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-3 h-3 text-teal-500 shrink-0" />
          <span className="text-xs text-teal-500">{success}</span>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all duration-200";

// ── OTP boxes ──────────────────────────────────────────────────────────────────

function OtpInput({ otp, setOtp }: { otp: string[]; setOtp: (v: string[]) => void }) {
  return (
    <div className="flex gap-2.5 justify-center">
      {otp.map((digit, idx) => (
        <input
          key={idx}
          id={`vendor-otp-${idx}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => {
            if (!/^\d?$/.test(e.target.value)) return;
            const updated = [...otp];
            updated[idx] = e.target.value;
            setOtp(updated);
            if (e.target.value && idx < 5) {
              document.getElementById(`vendor-otp-${idx + 1}`)?.focus();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !otp[idx] && idx > 0) {
              document.getElementById(`vendor-otp-${idx - 1}`)?.focus();
            }
          }}
          className="w-12 h-14 text-center text-lg font-bold border-2 border-slate-200 rounded-xl bg-slate-50 focus:border-teal-500 focus:bg-white focus:outline-none transition-all duration-200 text-slate-800"
        />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function VendorAuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm,  setShowConfirm]    = useState(false);
  const [otp,          setOtp]            = useState<string[]>(Array(6).fill(""));
  const [otpTimer,     setOtpTimer]       = useState(0);
  const [formVisible,  setFormVisible]    = useState(false);
  const [phoneError,   setPhoneError]     = useState("");
  const [passError,    setPassError]      = useState("");
  const [fields,       setFields]         = useState<FieldState>({
    phone: "", password: "", confirmPassword: "", firstName: "", lastName: "",
  });

  const dispatch = useDispatch();
  const router   = useRouter();

  const [loginMutation,     { isLoading: loginLoading }]    = useLoginMutation();
  const [registerMutation,  { isLoading: registerLoading }] = useRegisterMutation();
  const [verifyOtpMutation, { isLoading: verifyLoading }]   = useVerifyOtpMutation();

  // Animate form in on mount and on mode change
  useEffect(() => {
    setFormVisible(false);
    const t = setTimeout(() => setFormVisible(true), 60);
    return () => clearTimeout(t);
  }, [mode]);

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const formatTimer = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const set = (key: keyof FieldState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (key === "phone") val = val.replace(/\D/g, "").slice(0, 11);
    setFields((prev) => ({ ...prev, [key]: val }));
    if (key === "phone") setPhoneError("");
    if (key === "password" || key === "confirmPassword") setPassError("");
  };

  const validatePhone = (phone: string) => {
    if (!phone) { setPhoneError("Phone number is required"); return false; }
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) { setPhoneError("Must be 10 digits (e.g. 1XXXXXXXXX)"); return false; }
    if (!digits.startsWith("1")) { setPhoneError("Must start with 1"); return false; }
    setPhoneError("");
    return true;
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validatePhone(fields.phone)) return;
    if (!fields.password) { setPassError("Password is required"); return; }
    try {
      const res = await loginMutation({
        phone:    fields.phone,
        password: fields.password,
      }).unwrap();
      dispatch(setReduxCredentials({ user: res.user, accessToken: res.accessToken || "" }));
      router.push("/vendor-dashboard");
    } catch (err: any) {
      setPassError(err?.data?.message || "Invalid credentials. Please try again.");
    }
  };

  // ── Register → send OTP ────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!fields.firstName.trim()) return setPassError("First name is required");
    if (!fields.lastName.trim())  return setPassError("Last name is required");
    if (!validatePhone(fields.phone)) return;
    if (!fields.password)              { setPassError("Password is required"); return; }
    if (fields.password.length < 6)    { setPassError("Password must be at least 6 characters"); return; }
    if (fields.password !== fields.confirmPassword) { setPassError("Passwords do not match"); return; }
    setPassError("");
    try {
      await registerMutation({
        name:     `${fields.firstName.trim()} ${fields.lastName.trim()}`,
        phone:    fields.phone,
        password: fields.password,
        role:     "VENDOR",
      }).unwrap();
      setOtp(Array(6).fill(""));
      setOtpTimer(300);
      setMode("otp");
      setTimeout(() => document.getElementById("vendor-otp-0")?.focus(), 200);
    } catch (err: any) {
      setPassError(err?.data?.message || "Registration failed. Please try again.");
    }
  };

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    try {
      await verifyOtpMutation({
        phone:    fields.phone,
        otp:      code,
        password: fields.password,
        role:     "VENDOR",
        name:     `${fields.firstName.trim()} ${fields.lastName.trim()}`,
      }).unwrap();
      router.push("/vendor-dashboard");
    } catch (err: any) {
      setOtp(Array(6).fill(""));
      setPassError(err?.data?.message || "Invalid OTP. Please try again.");
      setTimeout(() => document.getElementById("vendor-otp-0")?.focus(), 100);
    }
  };

  const isLoading = loginLoading || registerLoading || verifyLoading;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex font-[system-ui] bg-white">

      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 flex-col justify-between p-12 relative overflow-hidden">

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-72 h-72 rounded-full bg-teal-400/15 blur-2xl" />
          <div className="absolute -bottom-20 right-20 w-80 h-80 rounded-full bg-teal-800/40 blur-3xl" />
          {/* Grid dots */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <Store className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <span className="text-white font-black text-xl tracking-tight">FinixMart</span>
              <span className="block text-teal-200 text-xs font-medium tracking-widest uppercase">Seller Center</span>
            </div>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
              Become A<br />
              <span className="text-teal-200">FinixMart</span><br />
              Seller Today!
            </h1>
            <p className="text-teal-100 text-base leading-relaxed max-w-xs">
              Join thousands of vendors selling on Bangladesh's fastest growing marketplace.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={TrendingUp} label="Active sellers"  value="12,000+"  delay={200} />
            <StatCard icon={Zap}        label="Orders per day"  value="50,000+"  delay={350} />
            <StatCard icon={Shield}     label="Secure payments" value="100%"     delay={500} />
            <StatCard icon={Store}      label="Product listings" value="2M+"     delay={650} />
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-teal-300 text-xs">
            © 2025 FinixMart · All rights reserved
          </p>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white relative overflow-hidden">

        {/* Subtle bg pattern */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-60" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-50 rounded-full translate-y-1/2 -translate-x-1/2 opacity-40" />
        </div>

        <div className="w-full max-w-[400px] relative z-10">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-teal-700 font-black text-base tracking-tight">FinixMart</span>
              <span className="block text-slate-400 text-[10px] font-medium tracking-widest uppercase">Seller Center</span>
            </div>
          </div>

          {/* Mode switcher tabs */}
          {mode !== "otp" && (
            <div className="flex bg-slate-100 rounded-2xl p-1 mb-8">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setFields({ phone: "", password: "", confirmPassword: "", firstName: "", lastName: "" });
                    setPhoneError(""); setPassError("");
                    setMode(m);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 capitalize"
                  style={{
                    background:  mode === m ? "white" : "transparent",
                    color:       mode === m ? "#0f766e" : "#94a3b8",
                    boxShadow:   mode === m ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {m === "login" ? "Sign In" : "Register"}
                </button>
              ))}
            </div>
          )}

          {/* ── Animated form card ───────────────────────────────────────── */}
          <div
            style={{
              opacity:   formVisible ? 1 : 0,
              transform: formVisible ? "translateY(0px)" : "translateY(28px)",
              transition: "opacity 0.45s cubic-bezier(.22,1,.36,1), transform 0.45s cubic-bezier(.22,1,.36,1)",
            }}
          >

            {/* ── LOGIN ─────────────────────────────────────────────── */}
            {mode === "login" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back</h2>
                  <p className="text-slate-400 text-sm mt-1">Sign in to your seller account</p>
                </div>

                <InputField label="Mobile Number" error={phoneError}>
                  <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-all duration-200 ${phoneError ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 focus-within:border-teal-500 focus-within:bg-white"}`}>
                    <div className="flex items-center gap-2 px-3 py-3 border-r border-slate-200 bg-white/50 shrink-0">
                      <span className="text-base">🇧🇩</span>
                      <span className="text-sm font-semibold text-slate-600">+880</span>
                    </div>
                    <input
                      type="tel"
                      placeholder="1XXXXXXXXX"
                      value={fields.phone}
                      onChange={set("phone")}
                      maxLength={11}
                      className="flex-1 px-3 py-3 bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 outline-none"
                    />
                    {fields.phone.length === 11 && !phoneError && (
                      <CheckCircle className="w-4 h-4 text-teal-500 mr-3 shrink-0" />
                    )}
                  </div>
                </InputField>

                <InputField label="Password" error={passError}>
                  <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-all duration-200 ${passError ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 focus-within:border-teal-500 focus-within:bg-white"}`}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={fields.password}
                      onChange={set("password")}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      className="flex-1 px-4 py-3 bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="px-3 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </InputField>

                <div className="flex justify-end">
                  <button className="text-xs text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                    Forgot password?
                  </button>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 shadow-lg shadow-teal-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400">
                  By signing in, you agree to FinixMart's{" "}
                  <a href="#" className="text-teal-600 hover:underline font-medium">Terms & Conditions</a>{" "}
                  and{" "}
                  <a href="#" className="text-teal-600 hover:underline font-medium">Privacy Policy</a>
                </p>

                <div className="flex items-center justify-center gap-3 pt-1">
                  <span className="text-xs text-slate-400">Don't have an account?</span>
                  <button
                    onClick={() => { setMode("register"); setPhoneError(""); setPassError(""); }}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
                  >
                    Register now <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* ── REGISTER ──────────────────────────────────────────── */}
            {mode === "register" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create account</h2>
                  <p className="text-slate-400 text-sm mt-1">Start selling on FinixMart today</p>
                </div>

                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="First Name">
                    <input
                      type="text"
                      placeholder="John"
                      value={fields.firstName}
                      onChange={set("firstName")}
                      className={inputClass}
                    />
                  </InputField>
                  <InputField label="Last Name">
                    <input
                      type="text"
                      placeholder="Doe"
                      value={fields.lastName}
                      onChange={set("lastName")}
                      className={inputClass}
                    />
                  </InputField>
                </div>

                <InputField label="Mobile Number" error={phoneError}>
                  <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-all duration-200 ${phoneError ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 focus-within:border-teal-500 focus-within:bg-white"}`}>
                    <div className="flex items-center gap-2 px-3 py-3 border-r border-slate-200 bg-white/50 shrink-0">
                      <span className="text-base">🇧🇩</span>
                      <span className="text-sm font-semibold text-slate-600">+880</span>
                    </div>
                    <input
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={fields.phone}
                      onChange={set("phone")}
                      maxLength={11}
                      className="flex-1 px-3 py-3 bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 outline-none"
                    />
                    {fields.phone.length === 11 && !phoneError && (
                      <CheckCircle className="w-4 h-4 text-teal-500 mr-3 shrink-0" />
                    )}
                  </div>
                </InputField>

                <InputField label="Password" error={passError}>
                  <div className="flex items-center border-2 border-slate-200 bg-slate-50 focus-within:border-teal-500 focus-within:bg-white rounded-xl overflow-hidden transition-all duration-200">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={fields.password}
                      onChange={set("password")}
                      className="flex-1 px-4 py-3 bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="px-3 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </InputField>

                <InputField
                  label="Confirm Password"
                  success={fields.confirmPassword && fields.password === fields.confirmPassword ? "Passwords match" : undefined}
                >
                  <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-all duration-200 ${fields.confirmPassword && fields.password !== fields.confirmPassword ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 focus-within:border-teal-500 focus-within:bg-white"}`}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={fields.confirmPassword}
                      onChange={set("confirmPassword")}
                      className="flex-1 px-4 py-3 bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="px-3 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </InputField>

                <button
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 shadow-lg shadow-teal-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending OTP…
                    </>
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400">
                  By registering, you agree to FinixMart's{" "}
                  <a href="#" className="text-teal-600 hover:underline font-medium">Terms & Conditions</a>
                </p>
              </div>
            )}

            {/* ── OTP VERIFY ────────────────────────────────────────── */}
            {mode === "otp" && (
              <div className="space-y-6">
                <button
                  onClick={() => { setMode("register"); setOtp(Array(6).fill("")); setPassError(""); }}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 font-medium transition-colors"
                >
                  ← Back to registration
                </button>

                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-teal-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verify Phone</h2>
                  <p className="text-slate-400 text-sm">
                    Enter the 6-digit code sent to
                  </p>
                  <p className="text-teal-600 font-bold text-sm">+880 {fields.phone}</p>
                </div>

                <OtpInput otp={otp} setOtp={setOtp} />

                {passError && (
                  <div className="flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="text-sm text-red-400">{passError}</span>
                  </div>
                )}

                {/* Timer */}
                <div className="text-center">
                  {otpTimer > 0 ? (
                    <p className="text-sm text-slate-500">
                      Code expires in{" "}
                      <span className="font-bold text-teal-600">{formatTimer(otpTimer)}</span>
                    </p>
                  ) : (
                    <button
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      className="text-sm text-teal-600 font-semibold hover:underline disabled:opacity-50 transition-colors"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.join("").length !== 6}
                  className="w-full bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 shadow-lg shadow-teal-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      Verify & Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}