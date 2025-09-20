// components/VendorRegisterForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRegisterMutation, useVerifyOtpMutation } from "@/features/authApi";
import { toast } from "sonner";
import { Eye, EyeOff, Clock, Phone, Lock, CheckCircle } from "lucide-react";

const OTP_EXPIRY_SECONDS = 300; // 5 minutes

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

  // OTP Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpSent && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Step 1: Register to send OTP
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

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      await verifyOtp({ phone, otp, password, role: "VENDOR" }).unwrap();
      setVerified(true);
      toast.success("Phone verified & account created!");
    } catch (err: any) {
      toast.error(err?.data?.message || "OTP verification failed");
    }
  };

  // Resend OTP
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
    <div className="max-w-md mx-auto bg-white shadow-xl rounded-2xl p-8 space-y-6 border border-gray-100">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-teal-900">Vendor Registration</h2>
        <p className="text-gray-600 mt-2">Create your vendor account</p>
      </div>

      {/* Phone Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Phone className="h-5 w-5 text-teal-700" />
        </div>
        <input
          type="text"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={otpSent || verified}
          className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition disabled:bg-gray-100"
        />
      </div>

      {/* Password fields */}
      {!verified && !otpSent && (
        <>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-teal-700" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-12 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-500" />
              ) : (
                <Eye className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-teal-700" />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-12 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-500" />
              ) : (
                <Eye className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
        </>
      )}

      {/* Send OTP Button */}
      {!otpSent && !verified && (
        <button
          onClick={handleSendOtp}
          disabled={registering}
          className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-lg font-medium transition flex items-center justify-center"
        >
          {registering ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending OTP...
            </>
          ) : (
            "Send OTP"
          )}
        </button>
      )}

      {/* OTP Input & Verify */}
      {otpSent && !verified && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-700">Enter the OTP sent to your phone</p>
          </div>
          
          <div className="flex justify-center">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-48 text-center text-xl tracking-widest border border-teal-500 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
          
          <div className="flex items-center justify-center text-sm">
            {timer > 0 ? (
              <div className="flex items-center text-teal-700">
                <Clock className="h-4 w-4 mr-1" />
                OTP expires in: {formatTime(timer)}
              </div>
            ) : (
              <button
                onClick={handleResendOtp}
                className="text-teal-700 hover:text-teal-900 font-medium flex items-center"
              >
                <Phone className="h-4 w-4 mr-1" />
                Resend OTP
              </button>
            )}
          </div>
          
          <button
            onClick={handleVerifyOtp}
            disabled={verifyingOtp || otp.length !== 6}
            className="w-full bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white py-3 rounded-lg font-medium transition flex items-center justify-center"
          >
            {verifyingOtp ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </>
            ) : (
              "Verify & Register"
            )}
          </button>
        </div>
      )}

      {/* Success Message */}
      {verified && (
        <div className="text-center py-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-teal-100 p-4">
              <CheckCircle className="h-12 w-12 text-teal-700" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-teal-900 mt-4">Registration Successful!</h3>
          <p className="text-gray-600 mt-2">Your vendor account has been created successfully.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-medium transition"
          >
            Create Another Account
          </button>
        </div>
      )}
    </div>
  );
};

export default VendorRegisterForm;