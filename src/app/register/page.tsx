"use client";

import { useState } from "react";
import { Eye, EyeOff, Mail, Phone, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRegisterMutation } from "@/features/authApi";

export default function CustomerSignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [register, { isLoading }] = useRegisterMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: either email or phone must be provided, not both
    if ((!formData.email && !formData.phone) || (formData.email && formData.phone)) {
      alert("Please provide either Email or Phone, but not both.");
      return;
    }

    // Password match validation
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await register({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email ,
        phone: formData.phone ,
        password: formData.password,
        role: "CUSTOMER",
      }).unwrap();

      alert("Registration successful! You can now log in.");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      alert(error.data?.message || error.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#E8EDF6" }}>
      <Card className="w-full max-w-md shadow-lg rounded-2xl overflow-hidden">
        <div className="bg-teal-900 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Join Our Marketplace</h1>
          <p className="text-teal-100 mt-2">Create an account to start buying</p>
        </div>

        <CardHeader className="pb-4">
          <CardTitle className="text-gray-900 text-center">Customer Signup</CardTitle>
          <CardDescription className="text-center">
            Fill in your details to create an account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="pl-10 py-2 rounded-lg"
                  required
                />
              </div>

              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="pl-10 py-2 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 py-2 rounded-lg"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="pl-10 py-2 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 py-2 rounded-lg"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-10 py-2 rounded-lg"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-900 hover:bg-teal-800 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              {isLoading ? "Registering..." : "Register"} <ArrowRight size={16} />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
