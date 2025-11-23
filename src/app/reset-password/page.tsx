"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, CheckCircle, XCircle, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useResetPasswordMutation, useVerifyResetTokenMutation } from "@/features/authApi";

// Mock toast function
const toast = {
  success: (msg: string) => alert(msg),
  error: (msg: string) => alert(msg),
};

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [token, setToken] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();

  // RTK Query mutations
  const [verifyResetToken, { isLoading: isVerifyingToken }] = useVerifyResetTokenMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      verifyToken(tokenFromUrl);
    } else {
      setIsTokenValid(false);
      setIsVerifying(false);
    }
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    try {
      const response = await verifyResetToken({ token }).unwrap();
      setIsTokenValid(true);
      toast.success("Token verified successfully");
    } catch (error: any) {
      setIsTokenValid(false);
      toast.error(error.data?.message || "Invalid or expired reset token");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast.error("Reset token is missing");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await resetPassword({
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      }).unwrap();

      toast.success("Password reset successfully!");
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      toast.error(error.data?.message || "Failed to reset password");
    }
  };

  // Loading state while verifying token
  if (isVerifying) {
    return (
      <div className="min-h-screen w-full flex bg-gradient-to-br from-gray-50 to-teal-50 items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center shadow-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Reset Token</h2>
          <p className="text-gray-600">Please wait while we verify your reset token...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isTokenValid) {
    return (
      <div className="min-h-screen w-full flex bg-gradient-to-br from-gray-50 to-teal-50">
        {/* Left Side */}
        <div className="hidden lg:flex lg:w-2/5 xl:w-1/2 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 items-center justify-center p-6 relative overflow-hidden">
          <div className="max-w-md w-full relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-2xl">
              <ShoppingCart className="w-8 h-8 text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">FinixMart</h1>
            <p className="text-teal-100">Your trusted e-commerce platform</p>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-3/5 xl:w-1/2 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md">
            {/* Mobile Brand */}
            <div className="lg:hidden text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-600 rounded-xl mb-2">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-teal-600">FinixMart</h1>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
              <div className="flex justify-center mb-4">
                <XCircle size={64} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h2>
              <p className="text-gray-600 mb-6">
                This password reset link is invalid or has expired. Please request a new reset link from the login page.
              </p>
              <div className="space-y-3">
                <Link href="/login" passHref>
                  <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-lg transition-colors">
                    Go to Login
                  </button>
                </Link>
                <Link href="/forgot-password" passHref>
                  <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-lg transition-colors">
                    Request New Reset Link
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main reset password form
  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-gray-50 to-teal-50">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/2 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 items-center justify-center p-6 relative overflow-hidden">
        <div className="max-w-md w-full relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-2xl">
            <Lock className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">FinixMart</h1>
          <p className="text-teal-100">Create your new secure password</p>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-3/5 xl:w-1/2 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Mobile Brand */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-600 rounded-xl mb-2">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-teal-600">FinixMart</h1>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <CheckCircle size={48} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h2>
              <p className="text-gray-600">
                Create a new password for your FinixMart account
              </p>
            </div>

            {/* Password Requirements */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-teal-800 mb-2">Password Requirements:</h3>
              <ul className="text-xs text-teal-700 space-y-1">
                <li className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${formData.newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  At least 6 characters long
                </li>
                <li className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${/[A-Z]/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  Contains uppercase letter
                </li>
                <li className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${/[a-z]/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  Contains lowercase letter
                </li>
                <li className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${/\d/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  Contains number
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter your new password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors disabled:opacity-50"
                    required
                    minLength={6}
                    disabled={isResetting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isResetting}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your new password"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors disabled:opacity-50 ${
                      formData.confirmPassword && formData.newPassword !== formData.confirmPassword
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                    required
                    minLength={6}
                    disabled={isResetting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isResetting}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                  <p className="text-red-600 text-xs mt-2">Passwords do not match</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isResetting || !!(formData.confirmPassword && formData.newPassword !== formData.confirmPassword)}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Remember your password?{" "}
                <Link href="/login" passHref>
                  <button className="text-teal-600 hover:text-teal-700 font-medium">
                    Back to Login
                  </button>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}