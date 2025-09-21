// app/signup/CustomerSignupPage.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  ArrowRight,
  Mail,
  Phone,
  ChevronDown,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useRegisterMutation, useVerifyOtpMutation } from "@/features/authApi";
import { toast } from "sonner";

// OTP Timer
const OTP_EXPIRY_SECONDS = 300;

export default function CustomerSignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [useEmail, setUseEmail] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [timer, setTimer] = useState(0);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));

  const [register, { isLoading }] = useRegisterMutation();
  const [verifyOtp, { isLoading: verifyingOtp }] = useVerifyOtpMutation();

  // refs for OTP inputs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
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

  // Validate inputs
  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^\d{11}$/.test(phone);

  // Handle input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle OTP digit change
  const handleOtpChange = (value: string, idx: number) => {
    if (!/^\d?$/.test(value)) return;

    const updated = [...otp];
    updated[idx] = value;
    setOtp(updated);

    if (value && idx < otpRefs.current.length - 1) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  // Send OTP (phone register step 1)
  const handleSendOtp = async () => {
    // if (!validatePhone(formData.phone)) {
    //   toast.error("Phone must be exactly 11 digits");
    //   return;
    // }
    // if (!formData.password || formData.password.length < 6) {
    //   toast.error("Password must be at least 6 characters");
    //   return;
    // }
    // if (formData.password !== formData.confirmPassword) {
    //   toast.error("Passwords do not match");
    //   return;
    // }

    try {
      await register({
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        email: "",
        password: formData.password,
        role: "CUSTOMER",
      }).unwrap();
      setOtpSent(true);
      setTimer(OTP_EXPIRY_SECONDS);
      toast.success("OTP sent to your phone");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to send OTP");
    }
  };

  // Verify OTP (phone register step 2)
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
      }).unwrap();
      setVerified(true);
      toast.success("Phone verified & account created!");
    } catch (err: any) {
      toast.error(err?.data?.message || "OTP verification failed");
    }
  };

  // Register directly if using email
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(formData.email)) {
      toast.error("Enter valid email address");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await register({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: "",
        password: formData.password,
        role: "CUSTOMER",
      }).unwrap();
      toast.success("Registration successful! You can log in.");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      toast.error(err?.data?.message || "Registration failed");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center p-6"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1507679799987-c73779587ccf')",
      }}
    >
      <Card className="w-full max-w-lg shadow-2xl rounded-2xl backdrop-blur-md bg-white/95 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-900 to-teal-700 p-6 text-center">
          <h1 className="text-3xl font-bold text-white">
            Join Our Marketplace
          </h1>
          <p className="text-teal-100 mt-2">
            Create an account to start buying
          </p>
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-gray-900 text-center">
            Customer Signup
          </CardTitle>
          <CardDescription className="text-center">
            Fill in your details to create an account
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Email Flow */}
          {useEmail && !otpSent && !verified && (
            <form onSubmit={handleEmailRegister} className="space-y-5">
              {/* Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Email */}
              <Input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                required
              />

              {/* Passwords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Registering..." : "Create Account"}{" "}
                <ArrowRight size={16} />
              </Button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setUseEmail(false)}
                  className="text-teal-700 hover:underline"
                >
                  Or signup with phone
                </button>
              </div>
            </form>
          )}

          {/* Phone Flow */}
          {!useEmail && !verified && (
            <div className="space-y-5">
              {/* Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Phone */}
              <div className="flex">
                <div className="flex items-center px-3 bg-gray-100 border rounded-l-lg">
                  🇧🇩 +880
                </div>
                <Input
                  type="tel"
                  name="phone"
                  placeholder="1XXXXXXXXX"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="rounded-l-none"
                  required
                />
              </div>

              {/* Password */}
              <Input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <Input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />

              {!otpSent ? (
                <Button
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Sending OTP..." : "Send OTP"}
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-center text-gray-700">
                    Enter the OTP sent to your phone
                  </p>

                  <div className="flex justify-center gap-2">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpRefs.current[idx] = el;
                        }}
                        type="text"
                        value={digit}
                        maxLength={1}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        className="w-10 h-12 text-center border rounded-md text-lg"
                      />
                    ))}
                  </div>

                  {timer > 0 ? (
                    <p className="text-center text-sm text-teal-700">
                      <Clock className="inline w-4 h-4 mr-1" />
                      Expires in {formatTime(timer)}
                    </p>
                  ) : (
                    <button
                      onClick={handleSendOtp}
                      className="text-teal-700 hover:underline text-sm"
                    >
                      Resend OTP
                    </button>
                  )}

                  <Button
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp}
                    className="w-full"
                  >
                    {verifyingOtp ? "Verifying..." : "Verify & Register"}
                  </Button>
                </div>
              )}

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setUseEmail(true)}
                  className="text-teal-700 hover:underline"
                >
                  Or signup with email
                </button>
              </div>
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
              <h3 className="text-xl font-semibold text-teal-900 mt-4">
                Registration Successful!
              </h3>
              <p className="text-gray-600 mt-2">
                Your account has been created successfully.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
