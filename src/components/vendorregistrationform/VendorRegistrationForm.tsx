"use client";

import React, { useState, useEffect } from "react";
import { useRegisterMutation, useVerifyOtpMutation } from "@/features/authApi";
import { toast } from "sonner";
import { Eye, EyeOff, Clock, Phone, Lock, CheckCircle, Store, User, TrendingUp, Shield, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const OTP_EXPIRY_SECONDS = 300;

const VendorRegisterForm: React.FC = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [register, { isLoading: registering }] = useRegisterMutation();
  const [verifyOtp, { isLoading: verifyingOtp }] = useVerifyOtpMutation();
  const router = useRouter();

  // OTP Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpSent && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  // Redirect to vendor dashboard after successful verification
  useEffect(() => {
    if (verified) {
      const redirectTimer = setTimeout(() => {
        router.push("/vendor-dashboard");
      }, 2000); // Redirect after 2 seconds to show success message

      return () => clearTimeout(redirectTimer);
    }
  }, [verified, router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSendOtp = async () => {
    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }
    
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await register({ phone, password, role: "VENDOR" }).unwrap();
      setOtpSent(true);
      setTimer(OTP_EXPIRY_SECONDS);
      toast.success("OTP sent to your phone");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      await verifyOtp({ phone, otp, password, role: "VENDOR" }).unwrap();
      setVerified(true);
      toast.success("Vendor account created successfully!");
    } catch (err: any) {
      toast.error(err?.data?.message || "OTP verification failed");
    }
  };

  const handleResendOtp = async () => {
    try {
      await register({ phone, password, role: "VENDOR" }).unwrap();
      setTimer(OTP_EXPIRY_SECONDS);
      setOtp("");
      toast.success("New OTP sent to your phone");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-gray-50 to-teal-50">
      {/* Left Side - Vendor Illustration with Teal Theme */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/2 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 items-center justify-center p-6 relative overflow-hidden">
        <div className="max-w-md w-full relative z-10 text-center">
          {/* Animated Background Elements */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl"></div>
          
          {/* Main Illustration */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-white/20 shadow-2xl">
            <div className="relative h-64">
              {/* Vendor Store */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-40 bg-white rounded-xl shadow-2xl">
                <div className="h-8 bg-gradient-to-r from-teal-500 to-teal-600 rounded-t-xl flex items-center justify-center">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <div className="p-3 space-y-2">
                  {/* Products */}
                  <div className="grid grid-cols-2 gap-1">
                    <div className="w-full h-4 bg-teal-200 rounded"></div>
                    <div className="w-full h-4 bg-teal-300 rounded"></div>
                    <div className="w-full h-4 bg-teal-200 rounded"></div>
                    <div className="w-full h-4 bg-teal-300 rounded"></div>
                  </div>
                  {/* Store Front */}
                  <div className="h-12 bg-gradient-to-b from-teal-100 to-teal-200 rounded mt-2 flex items-center justify-center">
                    <div className="w-8 h-6 bg-teal-300 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Vendor Character */}
              <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2">
                <div className="w-16 h-20 bg-white rounded-full shadow-lg flex items-end justify-center">
                  {/* Head */}
                  <div className="w-10 h-10 bg-teal-200 rounded-full -mb-2 relative">
                    {/* Face */}
                    <div className="absolute top-2 left-3 w-1 h-1 bg-gray-600 rounded-full"></div>
                    <div className="absolute top-2 right-3 w-1 h-1 bg-gray-600 rounded-full"></div>
                    <div className="absolute top-5 left-5 w-2 h-1 bg-gray-600 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute top-6 left-8 bg-white rounded-xl p-2 shadow-lg animate-bounce">
                <TrendingUp className="w-5 h-5 text-teal-600" />
              </div>
              <div className="absolute top-12 right-6 bg-teal-400 rounded-full p-2 shadow-lg">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div className="absolute top-2 left-1/3 bg-white rounded-full p-2 shadow-lg">
                <Shield className="w-5 h-5 text-teal-600" />
              </div>

              {/* Connection Dots */}
              <div className="absolute top-20 left-12 w-2 h-2 bg-white/50 rounded-full"></div>
              <div className="absolute top-16 right-16 w-2 h-2 bg-white/50 rounded-full"></div>
              <div className="absolute top-8 left-1/2 w-2 h-2 bg-white/50 rounded-full"></div>
            </div>
          </div>

          {/* Brand Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-2xl">
              <Store className="w-8 h-8 text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">FinixMart Vendor</h1>
            <p className="text-teal-100">Start selling to thousands of customers</p>
          </div>

          {/* Vendor Benefits */}
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-teal-100 text-sm">Grow your business with our platform</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-teal-100 text-sm">Access to thousands of customers</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-teal-100 text-sm">Secure and reliable platform</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Vendor Registration Form */}
      <div className="w-full lg:w-3/5 xl:w-1/2 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Mobile Brand */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-600 rounded-xl mb-2">
              <Store className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-teal-600">FinixMart Vendor</h1>
          </div>

          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-bold text-teal-600 hidden lg:block">
                FinixMart Vendor
              </h1>
              <div className="text-xs text-gray-600 mx-auto md:ml-auto">
                Already a vendor?{" "}
                <Link href="/login" passHref>
                  <button className="text-teal-600 font-semibold hover:underline cursor-pointer">
                    Sign in
                  </button>
                </Link>
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Vendor Registration
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              Start your business with us today
            </p>
          </div>

          {/* Success State */}
          {verified && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-teal-100 p-4">
                  <CheckCircle className="h-12 w-12 text-teal-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Welcome to FinixMart!
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Your vendor account has been created successfully. 
              </p>
              <div className="flex items-center justify-center gap-2 text-teal-600">
                <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Redirecting to dashboard...</span>
              </div>
            </div>
          )}

          {/* Registration Form */}
          {!verified && (
            <div className="space-y-4">
              {/* Phone Input */}
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
                    placeholder="1XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={otpSent}
                    className="flex-1 px-0 py-2 text-sm border-0 focus:ring-0 outline-none bg-transparent disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Fields - Only show before OTP is sent */}
              {!otpSent && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-0 py-2 pr-6 text-sm border-0 border-b-2 border-gray-300 focus:border-teal-600 focus:ring-0 outline-none transition-colors bg-transparent"
                      />
                      <button
                        type="button"
                        className="absolute right-0 bottom-2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* OTP Section */}
              {otpSent && (
                <div className="space-y-4 p-4 bg-teal-50 rounded-lg border border-teal-200">
                  <p className="text-xs text-teal-800 text-center font-medium">
                    Enter the 6-digit OTP sent to your phone
                  </p>
                  
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={otp[idx] || ""}
                        maxLength={1}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value) {
                            const newOtp = otp.split('');
                            newOtp[idx] = value;
                            setOtp(newOtp.join(''));
                            // Auto-focus next input
                            if (idx < 5) {
                              const nextInput = document.getElementById(`otp-${idx + 1}`);
                              nextInput?.focus();
                            }
                          }
                        }}
                        id={`otp-${idx}`}
                        className="w-8 h-10 text-center border-2 border-gray-300 rounded-lg text-sm font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                      />
                    ))}
                  </div>

                  {timer > 0 ? (
                    <p className="text-xs text-teal-600 text-center flex items-center justify-center gap-1">
                      <Clock size={12} />
                      OTP expires in: {formatTime(timer)}
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium w-full text-center flex items-center justify-center gap-1"
                    >
                      <Phone size={12} />
                      Resend OTP
                    </button>
                  )}
                </div>
              )}

              {/* Terms */}
              {!otpSent && (
                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    id="vendor-terms"
                    className="w-3 h-3 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    required
                  />
                  <label htmlFor="vendor-terms" className="ml-1 text-xs text-gray-700">
                    I agree to the{" "}
                    <a href="#" className="text-teal-600 hover:underline">
                      Vendor Terms
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-teal-600 hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                {!otpSent ? (
                  <button
                    onClick={handleSendOtp}
                    disabled={registering}
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {registering ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otp.length !== 6}
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {verifyingOtp ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Register"
                    )}
                  </button>
                )}
              </div>

              {/* Alternative Signup */}
              <div className="text-center pt-2">
                <p className="text-xs text-gray-600">
                  Want to shop instead?{" "}
                  <Link href="/register" passHref>
                    <button className="text-teal-600 hover:underline font-medium">
                      Create customer account
                    </button>
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorRegisterForm;