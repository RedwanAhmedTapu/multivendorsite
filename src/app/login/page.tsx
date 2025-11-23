"use client";

import { useState } from "react";
import { Eye, EyeOff, Mail, Phone, Lock, ShoppingCart, X, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useLoginMutation } from "@/features/authApi";
import { useDispatch } from "react-redux";
import { setCredentials as setReduxCredentials } from "@/features/authSlice";
import SocialAuth from "@/components/sociallogin/SocialAuth";
import { useRouter } from "next/navigation";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";

// Beautiful Alert Dialog Component
interface AlertDialogProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  onClose: () => void;
}

const AlertDialog: React.FC<AlertDialogProps> = ({ isOpen, type, title, message, onClose }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
      <div className={`relative max-w-md w-full mx-4 p-6 rounded-2xl shadow-2xl transform transition-all duration-300 scale-100 ${getBackgroundColor()} border-2`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-semibold ${getTextColor()} mb-2`}>
              {title}
            </h3>
            <p className={`text-sm ${getTextColor()} opacity-90 leading-relaxed`}>
              {message}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-medium text-white transition-all hover:shadow-lg ${
              type === 'success' 
                ? 'bg-green-500 hover:bg-green-600' 
                : type === 'error'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-yellow-500 hover:bg-yellow-600'
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// Mock toast function replacement with beautiful dialogs
const useAlert = () => {
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const showAlert = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setAlert({ isOpen: true, type, title, message });
  };

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  const AlertComponent = () => (
    <AlertDialog
      isOpen={alert.isOpen}
      type={alert.type}
      title={alert.title}
      message={alert.message}
      onClose={hideAlert}
    />
  );

  return { showAlert, hideAlert, AlertComponent };
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [useEmail, setUseEmail] = useState(true);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [credentials, setCredentials] = useState({
    email: "",
    phone: "",
    password: "",
  });
  const [phoneError, setPhoneError] = useState("");

  const { showAlert, AlertComponent } = useAlert();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const router = useRouter();

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's exactly 10 digits (without country code)
    if (cleanPhone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
      return false;
    }

    // Check if it starts with a valid Bangladeshi mobile prefix
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
      // Only allow numbers and limit to 10 digits
      const numbersOnly = value.replace(/\D/g, '').slice(0, 10);
      setCredentials(prev => ({
        ...prev,
        [name]: numbersOnly,
      }));

      // Validate as user types (but don't show error until they stop typing or submit)
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
  };

  const handlePhoneBlur = () => {
    if (credentials.phone && credentials.phone.length > 0) {
      validatePhoneNumber(credentials.phone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate inputs
      if (!useEmail && credentials.phone) {
        if (!validatePhoneNumber(credentials.phone)) {
          showAlert('error', 'Invalid Phone Number', 'Please enter a valid 10-digit phone number');
          return;
        }
      }

      if ((!credentials.email && !credentials.phone) || (credentials.email && credentials.phone)) {
        showAlert('error', 'Login Error', 'Please provide either email or phone, but not both.');
        return;
      }

      if (!credentials.password) {
        showAlert('error', 'Missing Password', 'Please enter your password');
        return;
      }

      if (useEmail && !credentials.email) {
        showAlert('error', 'Missing Email', 'Please enter your email address');
        return;
      }

      if (!useEmail && !credentials.phone) {
        showAlert('error', 'Missing Phone', 'Please enter your phone number');
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

      showAlert('success', 'Login Successful', 'Welcome back! Redirecting to your dashboard...');

      // Role-based navigation with delay to show success message
      setTimeout(() => {
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
      }, 2000);

    } catch (error: any) {
      showAlert('error', 'Login Failed', error.data?.message || error.message || "Unable to sign in. Please try again.");
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsForgotPasswordOpen(true);
  };

  const handleSocialLoginSuccess = () => {
    showAlert('success', 'Welcome!', 'Successfully signed in with social account.');
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  const handleForgotPasswordSuccess = (message: string) => {
    showAlert('success', 'Password Reset', message);
  };

  return (
    <>
      <div className="min-h-screen w-full flex bg-gradient-to-br from-gray-50 to-teal-50">
        {/* Left Side - Simplified for no scroll */}
        <div className="hidden lg:flex lg:w-2/5 xl:w-1/2 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 items-center justify-center p-6 relative overflow-hidden">
          <div className="max-w-md w-full relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-2xl">
              <ShoppingCart className="w-8 h-8 text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">FinixMart</h1>
            <p className="text-teal-100">Welcome back to your marketplace</p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-3/5 xl:w-1/2 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md">
            {/* Mobile Brand */}
            <div className="lg:hidden text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-600 rounded-xl mb-2">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-teal-600">FinixMart</h1>
            </div>

            {/* Header */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-lg font-bold text-teal-600 hidden lg:block">
                  FinixMart
                </h1>
                <div className="text-xs text-gray-600 mx-auto md:ml-auto">
                  Don't have an account?{" "}
                  <Link href="/register" passHref>
                    <button className="text-teal-600 font-semibold hover:underline cursor-pointer">
                      Sign up
                    </button>
                  </Link>
                </div>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Welcome Back
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Sign in to access your account
              </p>
            </div>

            {/* Login Method Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
              <button
                type="button"
                onClick={() => {
                  setUseEmail(true);
                  setPhoneError("");
                }}
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
                onClick={() => {
                  setUseEmail(false);
                  setPhoneError("");
                }}
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

            {/* Email Login */}
            {useEmail && (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      placeholder="john.doe@example.com"
                      value={credentials.email}
                      onChange={handleInputChange}
                      className="w-full px-0 py-2 text-sm border-0 border-b-2 border-gray-300 focus:border-teal-600 focus:ring-0 outline-none transition-colors bg-transparent disabled:opacity-50"
                      disabled={isLoading}
                    />
                    <span className="absolute right-0 bottom-2 text-gray-400 text-xs">
                      @
                    </span>
                  </div>
                </div>

                <PasswordField
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  value={credentials.password}
                  onChange={handleInputChange}
                  isLoading={isLoading}
                />

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-3 h-3 text-teal-600 border-gray-300 rounded focus:ring-teal-500 disabled:opacity-50"
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="remember"
                      className="ml-1 text-xs text-gray-700"
                    >
                      Remember me
                    </label>
                  </div>
                  <button
                    onClick={handleForgotPassword}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl mt-3 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            )}

            {/* Phone Login */}
            {!useEmail && (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className={`flex items-end border-b-2 transition-colors ${
                    phoneError ? 'border-red-500' : 'border-gray-300 focus-within:border-teal-600'
                  }`}>
                    <span className="text-xs text-gray-600 pb-2 pr-2">
                      🇧🇩 +880
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="1XXXXXXXXX"
                      value={credentials.phone}
                      onChange={handleInputChange}
                      onBlur={handlePhoneBlur}
                      className="flex-1 px-0 py-2 text-sm border-0 focus:ring-0 outline-none bg-transparent disabled:opacity-50"
                      disabled={isLoading}
                      maxLength={10}
                    />
                  </div>
                  {phoneError && (
                    <div className="flex items-center mt-1 space-x-1">
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-red-500">{phoneError}</span>
                    </div>
                  )}
                  {!phoneError && credentials.phone.length === 10 && (
                    <div className="flex items-center mt-1 space-x-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-500">Valid phone number</span>
                    </div>
                  )}
                </div>

                <PasswordField
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  value={credentials.password}
                  onChange={handleInputChange}
                  isLoading={isLoading}
                />

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember-phone"
                      className="w-3 h-3 text-teal-600 border-gray-300 rounded focus:ring-teal-500 disabled:opacity-50"
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="remember-phone"
                      className="ml-1 text-xs text-gray-700"
                    >
                      Remember me
                    </label>
                  </div>
                  <button
                    onClick={handleForgotPassword}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || !!phoneError}
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl mt-3 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            )}

            {/* Social Login */}
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-transparent text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <SocialAuth
                enableOneTap={true}
                onSuccess={handleSocialLoginSuccess}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccess={handleForgotPasswordSuccess}
      />

      {/* Beautiful Alert Dialog */}
      <AlertComponent />
    </>
  );
}

// Password Field Component
interface PasswordFieldProps {
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
}

function PasswordField({ 
  showPassword, 
  setShowPassword, 
  value, 
  onChange,
  isLoading = false 
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
          placeholder="••••••••"
          value={value}
          onChange={onChange}
          className="w-full px-0 py-2 pr-6 text-sm border-0 border-b-2 border-gray-300 focus:border-teal-600 focus:ring-0 outline-none transition-colors bg-transparent disabled:opacity-50"
          disabled={isLoading}
        />
        <button
          type="button"
          className="absolute right-0 bottom-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          onClick={() => setShowPassword(!showPassword)}
          disabled={isLoading}
        >
          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}