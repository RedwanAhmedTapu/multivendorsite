"use client";

import { useState } from "react";
import { Eye, EyeOff, Mail, Phone, Lock, User, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useLoginMutation } from "@/features/authApi"; // <- import the mutation

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email");
  const [credentials, setCredentials] = useState({
    email: "",
    phone: "",
    password: "",
    rememberMe: false,
  });

  const [login, { isLoading }] = useLoginMutation(); // RTK Query mutation

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate either email or phone
      if ((!credentials.email && !credentials.phone) || (credentials.email && credentials.phone)) {
        alert("Please provide either email or phone, but not both.");
        return;
      }

      const response = await login({
        email: credentials.email ,
        phone: credentials.phone ,
        password: credentials.password,
      }).unwrap();

      alert("Login successful!");
      console.log("User info:", response);
      // TODO: redirect user or save token to state/localStorage
    } catch (error: any) {
      alert(error.data?.message || error.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#E8EDF6" }}>
      <Card className="w-full max-w-md shadow-lg rounded-2xl overflow-hidden">
        <div className="bg-teal-900 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-teal-100 mt-2">Sign in to access your account</p>
        </div>

        <CardHeader className="pb-4">
          <CardTitle className="text-gray-900 text-center">Login to Your Account</CardTitle>
          <CardDescription className="text-center">Choose your preferred login method</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="email" onValueChange={setLoginMethod} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail size={16} />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center gap-2">
                <Phone size={16} />
                Phone
              </TabsTrigger>
            </TabsList>

            {/* Email login */}
            <TabsContent value="email">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={credentials.email}
                    onChange={handleInputChange}
                    className="pl-10 py-2 rounded-lg"
                    required={loginMethod === "email"}
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={credentials.password}
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-teal-900 hover:bg-teal-800 text-white py-2 rounded-lg font-medium"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            {/* Phone login */}
            <TabsContent value="phone">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    type="tel"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={credentials.phone}
                    onChange={handleInputChange}
                    className="pl-10 py-2 rounded-lg"
                    required={loginMethod === "phone"}
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={credentials.password}
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-teal-900 hover:bg-teal-800 text-white py-2 rounded-lg font-medium"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center">
            <Separator className="flex-1" />
            <span className="px-3 text-sm text-gray-500">or continue with</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="py-2 rounded-lg">
              Google
            </Button>
            <Button variant="outline" className="py-2 rounded-lg">
              <Facebook size={16} className="mr-2 text-blue-600" />
              Facebook
            </Button>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{" "}
            <a href="#" className="text-teal-900 hover:underline font-medium">
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
