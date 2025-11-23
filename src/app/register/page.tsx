"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Phone, Lock, ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRegisterMutation, useVerifyOtpMutation } from "@/features/authApi";
import SocialAuth from "@/components/sociallogin/SocialAuth";
import { useRouter } from "next/navigation";

// Mock toast function
const toast = {
  success: (msg: string) => alert(msg),
  error: (msg: string) => alert(msg),
};

const OTP_EXPIRY_SECONDS = 300;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [useEmail, setUseEmail] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation();
  
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOtpChange = (value: string, idx: number) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[idx] = value;
    setOtp(updated);

    // Auto-focus next input
    if (value && idx < 5) {
      const nextInput = document.getElementById(`otp-${idx + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      const prevInput = document.getElementById(`otp-${idx - 1}`);
      prevInput?.focus();
    }
  };

  const handleSendOtp = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error("Please enter your full name");
      return;
    }
    if (!formData.phone) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!formData.password) {
      toast.error("Please enter your password");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await register({
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        password: formData.password,
        role: "CUSTOMER",
      }).unwrap();
      setOtpSent(true);
      setTimer(OTP_EXPIRY_SECONDS);
      setOtp(Array(6).fill(""));
      toast.success("OTP sent to your phone");
      
      // Auto-focus first OTP input
      setTimeout(() => {
        document.getElementById('otp-0')?.focus();
      }, 100);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Enter 6 digit OTP");
      return;
    }
    try {
      await verifyOtp({
        phone: formData.phone,
        otp: otpCode,
        password: formData.password,
        role: "CUSTOMER",
        name: `${formData.firstName} ${formData.lastName}`,
      }).unwrap();
      toast.success("Account created successfully!");
      router.push("/login");
    } catch (err: any) {
      toast.error(err?.data?.message || "OTP verification failed");
      setOtp(Array(6).fill(""));
      document.getElementById('otp-0')?.focus();
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName) {
      toast.error("Please enter your full name");
      return;
    }
    if (!formData.email) {
      toast.error("Please enter your email address");
      return;
    }
    if (!formData.password) {
      toast.error("Please enter your password");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await register({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        role: "CUSTOMER",
      }).unwrap();
      toast.success("Registration successful! Check your email for verification.");
      router.push("/login");
    } catch (err: any) {
      toast.error(err?.data?.message || "Registration failed");
    }
  };

  const handleSocialLoginSuccess = () => {
    router.push("/dashboard");
  };

  const handleBackToForm = () => {
    setOtpSent(false);
    setOtp(Array(6).fill(""));
    setTimer(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpSent && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-gray-50 to-teal-50">
      {/* Left Side - Matching Login Design */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/2 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 items-center justify-center p-6 relative overflow-hidden">
        <div className="max-w-md w-full relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-2xl">
            <ShoppingCart className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">FinixMart</h1>
          <p className="text-teal-100">Join our marketplace community</p>
        </div>
      </div>

      {/* Right Side - Registration Form or OTP Verification */}
      <div className="w-full lg:w-3/5 xl:w-1/2 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Mobile Brand */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-600 rounded-xl mb-2">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-teal-600">FinixMart</h1>
          </div>

          {/* Show OTP Verification Screen */}
          {otpSent && !useEmail ? (
            <div className="space-y-4">
              {/* Back Button */}
              <button
                onClick={handleBackToForm}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-teal-600 transition-colors"
              >
                <ArrowLeft size={16} />
                Back to registration
              </button>

              {/* Header */}
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Verify Your Phone
                </h2>
                <p className="text-sm text-gray-600">
                  Enter the 6-digit code sent to
                </p>
                <p className="text-sm font-semibold text-teal-600 mt-1">
                  +880{formData.phone}
                </p>
              </div>

              {/* OTP Input */}
              <div className="space-y-4 p-6 bg-white rounded-xl border-2 border-teal-100 shadow-sm">
                <div className="flex justify-center gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      maxLength={1}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      className="w-12 h-14 text-center border-2 border-gray-300 rounded-lg text-lg font-bold focus:border-teal-600 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                    />
                  ))}
                </div>

                {/* Timer / Resend */}
                {timer > 0 ? (
                  <p className="text-sm text-gray-600 text-center">
                    Code expires in:{" "}
                    <span className="font-semibold text-teal-600">
                      {formatTime(timer)}
                    </span>
                  </p>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Didn't receive the code?
                    </p>
                    <button
                      onClick={handleSendOtp}
                      disabled={isRegistering}
                      className="text-sm text-teal-600 hover:text-teal-700 font-semibold hover:underline disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  </div>
                )}
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp || otp.join("").length !== 6}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-sm font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {isVerifyingOtp ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Create Account"
                )}
              </button>

              {/* Help Text */}
              <p className="text-xs text-gray-500 text-center">
                Having trouble? Make sure you entered the correct phone number
              </p>
            </div>
          ) : (
            /* Show Registration Form */
            <>
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h1 className="text-lg font-bold text-teal-600 hidden lg:block">
                    FinixMart
                  </h1>
                  <div className="text-xs text-gray-600 mx-auto md:ml-auto">
                    Already have an account?{" "}
                    <Link href="/login" passHref>
                      <button className="text-teal-600 font-semibold hover:underline cursor-pointer">
                        Sign in
                      </button>
                    </Link>
                  </div>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Create Account
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  Join thousands of happy shoppers
                </p>
              </div>

              {/* Social Auth */}
              <div className="mb-4">
                <SocialAuth
                  enableOneTap={true}
                  onSuccess={handleSocialLoginSuccess}
                />
              </div>

              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-transparent text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Registration Method Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                <button
                  type="button"
                  onClick={() => setUseEmail(true)}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    useEmail
                      ? "bg-white shadow-sm text-teal-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Mail size={14} />
                    Email
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setUseEmail(false)}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    !useEmail
                      ? "bg-white shadow-sm text-teal-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Phone size={14} />
                    Phone
                  </div>
                </button>
              </div>

              {/* Email Registration */}
              {useEmail && (
                <form onSubmit={handleEmailRegister} className="space-y-3">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-0 py-2 text-sm border-0 border-b-2 border-gray-300 focus:border-teal-600 focus:ring-0 outline-none transition-colors bg-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-0 py-2 text-sm border-0 border-b-2 border-gray-300 focus:border-teal-600 focus:ring-0 outline-none transition-colors bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        placeholder="john.doe@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-0 py-2 text-sm border-0 border-b-2 border-gray-300 focus:border-teal-600 focus:ring-0 outline-none transition-colors bg-transparent"
                        required
                      />
                      <span className="absolute right-0 bottom-2 text-gray-400 text-xs">
                        @
                      </span>
                    </div>
                  </div>

                  <PasswordField
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create password"
                  />

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-0 py-2 text-sm border-0 border-b-2 border-gray-300 focus:border-teal-600 focus:ring-0 outline-none transition-colors bg-transparent"
                      required
                    />
                  </div>

                  {/* Terms */}
                  <div className="flex items-center pt-1">
                    <input
                      type="checkbox"
                      id="terms"
                      className="w-3 h-3 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      required
                    />
                    <label htmlFor="terms" className="ml-1 text-xs text-gray-700">
                      I agree to the{" "}
                      <a href="#" className="text-teal-600 hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-teal-600 hover:underline">
                        Privacy Policy
                      </a>
                    </label>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl mt-3 flex items-center justify-center gap-2"
                  >
                    {isRegistering ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>
              )}

              {/* Phone Registration */}
              {!useEmail && (
                <div className="space-y-3">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-0 py-2 text-sm border-0 border-b-2 border-gray-300 focus:border-teal-600 focus:ring-0 outline-none transition-colors bg-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-0 py-2 text-sm border-0 border-b-2 border-gray-300 focus:border-teal-600 focus:ring-0 outline-none transition-colors bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="flex items-end border-b-2 border-gray-300 focus-within:border-teal-600 transition-colors">
                      <span className="text-xs text-gray-600 pb-2 pr-2">
                        🇧🇩 +880
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="1XXXXXXXXX"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="flex-1 px-0 py-2 text-sm border-0 focus:ring-0 outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  <PasswordField
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create password"
                  />

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-0 py-2 text-sm border-0 border-b-2 border-gray-300 focus:border-teal-600 focus:ring-0 outline-none transition-colors bg-transparent"
                      required
                    />
                  </div>

                  {/* Terms */}
                  <div className="flex items-center pt-1">
                    <input
                      type="checkbox"
                      id="terms-phone"
                      className="w-3 h-3 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      required
                    />
                    <label htmlFor="terms-phone" className="ml-1 text-xs text-gray-700">
                      I agree to the{" "}
                      <a href="#" className="text-teal-600 hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-teal-600 hover:underline">
                        Privacy Policy
                      </a>
                    </label>
                  </div>

                  {/* Send OTP Button */}
                  <button
                    onClick={handleSendOtp}
                    disabled={isRegistering}
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl mt-3 flex items-center justify-center gap-2"
                  >
                    {isRegistering ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Password Field Component
interface PasswordFieldProps {
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

function PasswordField({ 
  showPassword, 
  setShowPassword, 
  value, 
  onChange,
  placeholder = "Password" 
}: PasswordFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Password
      </label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full px-0 py-2 pr-6 text-sm border-0 border-b-2 border-gray-300 focus:border-teal-600 focus:ring-0 outline-none transition-colors bg-transparent"
        />
        <button
          type="button"
          className="absolute right-0 bottom-2 text-gray-400 hover:text-gray-600"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}