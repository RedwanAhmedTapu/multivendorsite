"use client";

import { useState } from "react";
import { Eye, EyeOff, Mail, Phone, Lock, User, Facebook, Github, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email");
  const [credentials, setCredentials] = useState({
    email: "",
    phone: "",
    password: "",
    rememberMe: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt with:", credentials);
    // Here you would typically handle the login logic
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
          <CardDescription className="text-center">
            Choose your preferred login method
          </CardDescription>
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
            
            <TabsContent value="email">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={credentials.email}
                      onChange={handleInputChange}
                      className="pl-10 py-2 rounded-lg"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
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
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={credentials.rememberMe}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-gray-300 text-teal-900 focus:ring-teal-900"
                    />
                    <span className="text-gray-700">Remember me</span>
                  </label>
                  <a href="#" className="text-teal-900 hover:underline font-medium">
                    Forgot password?
                  </a>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-teal-900 hover:bg-teal-800 text-white py-2 rounded-lg font-medium"
                >
                  Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="phone">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      type="tel"
                      name="phone"
                      placeholder="Enter your phone number"
                      value={credentials.phone}
                      onChange={handleInputChange}
                      className="pl-10 py-2 rounded-lg"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
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
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={credentials.rememberMe}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-gray-300 text-teal-900 focus:ring-teal-900"
                    />
                    <span className="text-gray-700">Remember me</span>
                  </label>
                  <a href="#" className="text-teal-900 hover:underline font-medium">
                    Forgot password?
                  </a>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-teal-900 hover:bg-teal-800 text-white py-2 rounded-lg font-medium"
                >
                  Sign In
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
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
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