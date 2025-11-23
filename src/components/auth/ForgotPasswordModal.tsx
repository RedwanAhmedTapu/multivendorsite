"use client";

import { useState } from "react";
import { X, Mail, Phone, ArrowLeft, CheckCircle } from "lucide-react";
import { 
  useForgotPasswordMutation, 
  useVerifyResetTokenMutation, 
  useResetPasswordMutation 
} from "@/features/authApi";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

type Step = "initial" | "verify" | "reset" | "success";

export default function ForgotPasswordModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>("initial");
  const [useEmail, setUseEmail] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    otp: "",
    token: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");

  // RTK Query mutations
  const [forgotPassword, { isLoading: isSending }] = useForgotPasswordMutation();
  const [verifyResetToken, { isLoading: isVerifying }] = useVerifyResetTokenMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  const isLoading = isSending || isVerifying || isResetting;

  if (!isOpen) return null;

  const handleClose = () => {
    setStep("initial");
    setFormData({
      email: "",
      phone: "",
      otp: "",
      token: "",
      newPassword: "",
      confirmPassword: "",
    });
    setVerifiedEmail("");
    setVerifiedPhone("");
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (useEmail && !formData.email) {
      alert("Please enter your email address");
      return;
    }
    
    if (!useEmail && !formData.phone) {
      alert("Please enter your phone number");
      return;
    }

    try {
      const response = await forgotPassword({
        email: useEmail ? formData.email : undefined,
        phone: !useEmail ? formData.phone : undefined,
      }).unwrap();

      setStep("verify");
      onSuccess?.(response.message || "Reset link sent successfully");
    } catch (error: any) {
      alert(error.data?.message || "Failed to send reset link");
    }
  };

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (useEmail && !formData.token) {
      alert("Please enter the verification token");
      return;
    }
    
    if (!useEmail && !formData.otp) {
      alert("Please enter the OTP");
      return;
    }

    try {
      const response = await verifyResetToken({
        token: useEmail ? formData.token : undefined,
        phone: !useEmail ? formData.phone : undefined,
        otp: !useEmail ? formData.otp : undefined,
      }).unwrap();

      if (useEmail && response.email) {
        setVerifiedEmail(response.email);
      } else if (!useEmail && response.phone) {
        setVerifiedPhone(response.phone);
      }
      
      setStep("reset");
      onSuccess?.(response.message || "Verification successful");
    } catch (error: any) {
      alert(error.data?.message || "Failed to verify token");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    if (formData.newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await resetPassword({
        token: useEmail ? formData.token : undefined,
        phone: !useEmail ? formData.phone : undefined,
        otp: !useEmail ? formData.otp : undefined,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      }).unwrap();

      setStep("success");
      onSuccess?.(response.message || "Password reset successfully!");
    } catch (error: any) {
      alert(error.data?.message || "Failed to reset password");
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center">
        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
          step === "initial" 
            ? "bg-teal-600 text-white" 
            : "bg-teal-100 text-teal-600"
        }`}>
          1
        </div>
        <div className={`w-8 h-0.5 mx-1 ${
          step !== "initial" ? "bg-teal-600" : "bg-gray-300"
        }`} />
        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
          step === "verify" || step === "reset" || step === "success"
            ? "bg-teal-600 text-white" 
            : "bg-gray-300 text-gray-500"
        }`}>
          2
        </div>
        <div className={`w-8 h-0.5 mx-1 ${
          step === "reset" || step === "success" ? "bg-teal-600" : "bg-gray-300"
        }`} />
        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
          step === "reset" || step === "success"
            ? "bg-teal-600 text-white" 
            : "bg-gray-300 text-gray-500"
        }`}>
          3
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {step !== "initial" && (
              <button
                onClick={() => {
                  if (step === "verify") setStep("initial");
                  else if (step === "reset") setStep("verify");
                  else if (step === "success") setStep("reset");
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-gray-900">
              {step === "success" ? "Success!" : "Reset Password"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStepIndicator()}

          {/* Step 1: Request Reset */}
          {step === "initial" && (
            <div>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Enter your email or phone number to receive a reset link
              </p>

              {/* Method Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                <button
                  type="button"
                  onClick={() => setUseEmail(true)}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    useEmail
                      ? "bg-white shadow-sm text-teal-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  disabled={isLoading}
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
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Phone size={14} />
                    Phone
                  </div>
                </button>
              </div>

              <form onSubmit={handleSendResetLink}>
                {useEmail ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john.doe@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors disabled:opacity-50"
                      required
                      disabled={isLoading}
                    />
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-shrink-0">
                        <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600">
                          🇧🇩 +880
                        </div>
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="1XXXXXXXXX"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors disabled:opacity-50"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Verify Token/OTP */}
          {step === "verify" && (
            <div>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Enter the {useEmail ? "verification token" : "OTP"} sent to your{" "}
                {useEmail ? formData.email : `+880${formData.phone}`}
              </p>

              <form onSubmit={handleVerifyToken}>
                {useEmail ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Token
                    </label>
                    <input
                      type="text"
                      name="token"
                      value={formData.token}
                      onChange={handleInputChange}
                      placeholder="Enter the token from your email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors disabled:opacity-50"
                      required
                      disabled={isLoading}
                    />
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OTP Code
                    </label>
                    <input
                      type="text"
                      name="otp"
                      value={formData.otp}
                      onChange={handleInputChange}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-center text-lg font-mono tracking-widest disabled:opacity-50"
                      required
                      disabled={isLoading}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Step 3: Reset Password */}
          {step === "reset" && (
            <div>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Create your new password for{" "}
                {verifiedEmail || `+880${verifiedPhone}`}
              </p>

              <form onSubmit={handleResetPassword}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="Enter new password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors disabled:opacity-50"
                      required
                      minLength={6}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors disabled:opacity-50"
                      required
                      minLength={6}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                >
                  {isResetting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle size={48} className="text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Password Reset Successful!
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <button
                onClick={handleClose}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}