// components/auth/LoginModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { useLoginMutation } from "@/features/authApi";
import { useDispatch } from "react-redux";
import { setCredentials as setReduxCredentials } from "@/features/authSlice";
import { useRouter } from "next/navigation";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
  redirectPath?: string;
  message?: string;
}

export function LoginModal({ 
  isOpen, 
  onClose, 
  onLoginSuccess, 
  redirectPath,
  message 
}: LoginModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [useEmail, setUseEmail] = useState(true);
  const [credentials, setCredentials] = useState({
    email: "",
    phone: "",
    password: "",
  });
  const [phoneError, setPhoneError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const router = useRouter();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCredentials({ email: "", phone: "", password: "" });
      setError("");
      setSuccess("");
      setPhoneError("");
    }
  }, [isOpen]);

  const validatePhoneNumber = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
      return false;
    }

    const validPrefixes = ['13', '14', '15', '16', '17', '18', '19'];
    const prefix = cleanPhone.substring(0, 2);
    
    if (!validPrefixes.includes(prefix)) {
      setPhoneError("Invalid phone number format");
      return false;
    }

    setPhoneError("");
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const numbersOnly = value.replace(/\D/g, '').slice(0, 10);
      setCredentials(prev => ({
        ...prev,
        [name]: numbersOnly,
      }));

      if (numbersOnly.length > 0 && numbersOnly.length !== 10) {
        setPhoneError("Phone number must be 10 digits");
      } else {
        setPhoneError("");
      }
    } else {
      setCredentials(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Clear errors when user starts typing
    if (error) setError("");
  };

  const handlePhoneBlur = () => {
    if (credentials.phone && credentials.phone.length > 0) {
      validatePhoneNumber(credentials.phone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Validate inputs
      if (!useEmail && credentials.phone) {
        if (!validatePhoneNumber(credentials.phone)) {
          setError("Please enter a valid 10-digit phone number");
          return;
        }
      }

      if ((!credentials.email && !credentials.phone) || (credentials.email && credentials.phone)) {
        setError("Please provide either email or phone, but not both.");
        return;
      }

      if (!credentials.password) {
        setError("Please enter your password");
        return;
      }

      if (useEmail && !credentials.email) {
        setError("Please enter your email address");
        return;
      }

      if (!useEmail && !credentials.phone) {
        setError("Please enter your phone number");
        return;
      }

      const response = await login({
        email: credentials.email || undefined,
        phone: credentials.phone ? `0${credentials.phone}` : undefined,
        password: credentials.password,
      }).unwrap();

      dispatch(
        setReduxCredentials({
          user: response.user,
          accessToken: response.accessToken || "",
        })
      );

      setSuccess("Login successful! Redirecting...");

      // Call success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess();
      }

      // Close modal after successful login
      setTimeout(() => {
        onClose();
        
        // Redirect if path provided
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          // Role-based navigation
          const userRole = response.user?.role;
          const userId = response.user?.id;

          if (userRole === "CUSTOMER") {
            router.push(`/user-dashboard?userid=${userId}`);
          } else if (userRole === "VENDOR") {
            router.push("/vendor-dashboard");
          } else if (userRole === "ADMIN") {
            router.push("/admin-dashboard");
          } else {
            router.push("/dashboard");
          }
        }
      }, 1500);

    } catch (error: any) {
      setError(error.data?.message || error.message || "Unable to sign in. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-w-md w-full mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-sm text-gray-600 mt-1">
                {message || "Sign in to continue"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-6">
          {/* Login Method Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setUseEmail(true);
                setPhoneError("");
                setError("");
              }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                useEmail
                  ? "bg-white shadow-sm text-teal-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Mail size={16} />
                Email
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setUseEmail(false);
                setPhoneError("");
                setError("");
              }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                !useEmail
                  ? "bg-white shadow-sm text-teal-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Phone size={16} />
                Phone
              </div>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Email Login Form */}
          {useEmail ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    placeholder="john.doe@example.com"
                    value={credentials.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors pr-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          ) : (
            /* Phone Login Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className={`flex items-center border rounded-lg transition-colors ${
                  phoneError ? 'border-red-500' : 'border-gray-300 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500'
                }`}>
                  <span className="px-3 py-3 text-gray-600 border-r border-gray-300">
                    +880
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="1XXXXXXXXX"
                    value={credentials.phone}
                    onChange={handleInputChange}
                    onBlur={handlePhoneBlur}
                    className="flex-1 px-3 py-3 outline-none bg-transparent"
                    disabled={isLoading}
                    maxLength={10}
                    autoFocus
                  />
                </div>
                {phoneError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {phoneError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors pr-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !!phoneError}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          )}

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => {
                  onClose();
                  router.push("/register");
                }}
                className="text-teal-600 font-semibold hover:underline"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}