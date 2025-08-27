"use client";

import { useState } from "react";
import { Eye, EyeOff, Mail, Phone, Lock, User, Store, MapPin, Calendar, FileText, Facebook, Github, Twitter, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState("customer");
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Common fields
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    agreeToPrivacy: false,
    receivePromotions: false,
    
    // Customer specific
    dateOfBirth: "",
    
    // Vendor specific
    shopName: "",
    shopAddress: "",
    businessType: "",
    taxId: "",
    bankAccount: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      console.log("Registration attempt with:", formData);
      // Here you would typically handle the registration logic
    }
  };

  const businessTypes = [
    "Individual",
    "Partnership",
    "Private Limited",
    "Public Limited",
    "Sole Proprietorship"
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#E8EDF6" }}>
      <Card className="w-full max-w-2xl shadow-lg rounded-2xl overflow-hidden">
        <div className="bg-teal-900 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Join Our Marketplace</h1>
          <p className="text-teal-100 mt-2">Create an account to start buying or selling</p>
        </div>
        
        <CardHeader className="pb-4">
          <CardTitle className="text-gray-900 text-center">Create Your Account</CardTitle>
          <CardDescription className="text-center">
            {step === 1 ? "Fill in your basic information" : "Complete your profile details"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === 1 && (
            <>
              <Tabs defaultValue="customer" onValueChange={setUserType} className="w-full mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="customer" className="flex items-center gap-2">
                    <User size={16} />
                    Customer
                  </TabsTrigger>
                  <TabsTrigger value="vendor" className="flex items-center gap-2">
                    <Store size={16} />
                    Vendor
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
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
                      required
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
                      required
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
                
                {userType === "customer" && (
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      type="date"
                      name="dateOfBirth"
                      placeholder="Date of Birth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="pl-10 py-2 rounded-lg"
                    />
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="terms" 
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))}
                      required
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the <a href="#" className="text-teal-900 hover:underline">Terms and Conditions</a>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="privacy" 
                      name="agreeToPrivacy"
                      checked={formData.agreeToPrivacy}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeToPrivacy: checked as boolean }))}
                      required
                    />
                    <Label htmlFor="privacy" className="text-sm">
                      I agree to the <a href="#" className="text-teal-900 hover:underline">Privacy Policy</a>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="promotions" 
                      name="receivePromotions"
                      checked={formData.receivePromotions}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, receivePromotions: checked as boolean }))}
                    />
                    <Label htmlFor="promotions" className="text-sm">
                      I want to receive promotional offers and updates
                    </Label>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-teal-900 hover:bg-teal-800 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight size={16} />
                </Button>
              </form>
              
              <div className="my-6 flex items-center">
                <Separator className="flex-1" />
                <span className="px-3 text-sm text-gray-500">or sign up with</span>
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
                Already have an account?{" "}
                <a href="#" className="text-teal-900 hover:underline font-medium">
                  Sign in
                </a>
              </p>
            </>
          )}
          
          {step === 2 && (
            <div>
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-teal-900 flex items-center justify-center text-white">1</div>
                  <div className="w-16 h-1 bg-teal-900"></div>
                  <div className="w-8 h-8 rounded-full bg-teal-900 flex items-center justify-center text-white">2</div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-center mb-6">
                {userType === "customer" ? "Complete Your Profile" : "Tell Us About Your Business"}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {userType === "vendor" ? (
                  <>
                    <div className="relative">
                      <Store className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        type="text"
                        name="shopName"
                        placeholder="Shop Name"
                        value={formData.shopName}
                        onChange={handleInputChange}
                        className="pl-10 py-2 rounded-lg"
                        required
                      />
                    </div>
                    
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        type="text"
                        name="shopAddress"
                        placeholder="Shop Address"
                        value={formData.shopAddress}
                        onChange={handleInputChange}
                        className="pl-10 py-2 rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <Select onValueChange={(value) => handleSelectChange("businessType", value)} required>
                        <SelectTrigger className="w-full py-2 rounded-lg">
                          <SelectValue placeholder="Select Business Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessTypes.map((type) => (
                            <SelectItem key={type} value={type.toLowerCase()}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input
                          type="text"
                          name="taxId"
                          placeholder="Tax ID Number"
                          value={formData.taxId}
                          onChange={handleInputChange}
                          className="pl-10 py-2 rounded-lg"
                        />
                      </div>
                      
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input
                          type="text"
                          name="bankAccount"
                          placeholder="Bank Account Number"
                          value={formData.bankAccount}
                          onChange={handleInputChange}
                          className="pl-10 py-2 rounded-lg"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <p className="text-sm text-gray-600 mb-4">
                        To complete your vendor registration, you'll need to provide additional documentation for verification. You can submit these documents after account creation.
                      </p>
                      <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                        <li>Business registration certificate</li>
                        <li>Tax identification document</li>
                        <li>Bank account verification</li>
                        <li>Identity proof</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-8 w-8 text-teal-900" />
                    </div>
                    <h4 className="font-medium text-gray-900">Almost there!</h4>
                    <p className="text-gray-600 mt-2">Your customer account is ready to be created.</p>
                    <p className="text-gray-600">Click the button below to complete registration.</p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2 rounded-lg"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-teal-900 hover:bg-teal-800 text-white py-2 rounded-lg font-medium"
                  >
                    Complete Registration
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}