"use client";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  HardDrive,
  Image,
  FileText,
  Plus,
  TrendingUp,
  AlertCircle,
  Database,
  CloudUpload,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Zap,
  Crown,
} from "lucide-react";
import {
  StorageStats,
  useGetStorageStatsQuery,
  usePurchaseStorageMutation,
} from "@/features/vendorManageApi";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StorageDashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const vendorId = user?.vendorId;

  const [selectedPlan, setSelectedPlan] = useState<number>(25);
  const [activeTab, setActiveTab] = useState<"overview" | "upgrade">("overview");

  const {
    data: stats,
    isLoading,
    error,
  } = useGetStorageStatsQuery(vendorId || "", {
    skip: !vendorId,
    refetchOnMountOrArgChange: true,
  });

  const [purchaseStorage, { isLoading: isPurchasing }] =
    usePurchaseStorageMutation();

  const handlePurchase = async () => {
    if (!vendorId) {
      toast.error("Vendor ID not found");
      return;
    }

    try {
      const result = await purchaseStorage({
        vendorId,
        additionalGB: selectedPlan,
      }).unwrap();
      toast.success(
        result.message || `Successfully purchased ${selectedPlan}GB of storage!`
      );
    } catch (error: any) {
      toast.error(error.data?.message || "Failed to purchase storage");
    }
  };

  // 🔄 Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading storage data...</p>
        </div>
      </div>
    );
  }

  // ⚠️ Error state
  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load storage data. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <Database className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No storage data available</h3>
          <p className="text-muted-foreground">
            Start uploading files to see your storage usage
          </p>
        </CardContent>
      </Card>
    );
  }

  // ✅ Extract and normalize values
  const {
    usedGB,
    totalGB,
    usedSize,
    usedUnit,
    remainingGB,
    usagePercent,
    freeQuotaGB,
    paidQuotaGB,
    totalFiles,
    imageFiles,
    documentFiles,
  } = stats as StorageStats;

  console.log(stats)

  const displayPercent =
    usagePercent < 0.01
      ? usagePercent.toFixed(4)
      : usagePercent < 1
      ? usagePercent.toFixed(3)
      : usagePercent.toFixed(2);

  const isNearLimit = usagePercent > 80;
  const isCritical = usagePercent > 95;

  const storagePlans = [
    { gb: 10, price: 5, popular: false },
    { gb: 25, price: 10, popular: true },
    { gb: 50, price: 18, popular: false },
    { gb: 100, price: 30, popular: false },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* 🎯 Header with Tabs */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Storage Management
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Monitor your storage usage and upgrade your capacity with flexible plans
        </p>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as "overview" | "upgrade")}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger 
            value="overview" 
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <BarChart3 className="w-4 h-4" />
            Storage Overview
          </TabsTrigger>
          <TabsTrigger 
            value="upgrade" 
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Zap className="w-4 h-4" />
            Upgrade Storage
          </TabsTrigger>
        </TabsList>

        {/* 📊 Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Database className="w-7 h-7 text-primary" />
                    Storage Overview
                  </CardTitle>
                  <CardDescription className="mt-1 text-base">
                    Real-time monitoring of your cloud storage usage
                  </CardDescription>
                </div>
                <div className="text-right bg-primary/5 rounded-xl px-4 py-3 border">
                  <p className="text-sm text-muted-foreground">Total Quota</p>
                  <p className="text-2xl font-bold text-primary">
                    {totalGB.toFixed(2)}GB
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* ✅ Main Storage Display */}
              <div className="bg-gradient-to-br from-primary/5 via-blue-50 to-primary/10 rounded-2xl p-8 space-y-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">
                      Storage Used
                    </p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                      {usedSize} {usedUnit}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      of {totalGB} GB total capacity
                    </p>
                  </div>
                  <div className="text-right bg-white rounded-xl px-6 py-4 shadow-sm border">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Available</p>
                    <p className="text-4xl font-bold text-green-600">
                      {remainingGB} GB
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {(100 - usagePercent)}% free space
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Storage Usage</span>
                    <span className={`font-bold ${
                      isCritical ? "text-red-600" : 
                      isNearLimit ? "text-orange-600" : "text-green-600"
                    }`}>
                      {displayPercent}% used
                    </span>
                  </div>
                  <Progress
                    value={usagePercent}
                    className={`h-4 rounded-full ${
                      isCritical
                        ? "bg-red-100"
                        : isNearLimit
                        ? "bg-orange-100"
                        : "bg-green-100"
                    }`}
                  />
                </div>
              </div>

              {/* ⚠️ Alerts */}
              {isCritical && (
                <Alert variant="destructive" className="border-2">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="font-medium">
                    <strong>Critical Storage Alert:</strong> You've used {displayPercent}% of your storage.
                    Please upgrade immediately to avoid upload failures and service interruption.
                  </AlertDescription>
                </Alert>
              )}

              {isNearLimit && !isCritical && (
                <Alert className="border-2 border-orange-200 bg-orange-50">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <AlertDescription className="text-orange-800 font-medium">
                    <strong>Storage Warning:</strong> You're approaching your storage limit ({displayPercent}% used). 
                    Consider upgrading your plan to ensure uninterrupted service.
                  </AlertDescription>
                </Alert>
              )}

              {/* 📁 File Statistics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  File Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <HardDrive className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Files</p>
                          <p className="text-2xl font-bold">{totalFiles}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <Image className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Images</p>
                          <p className="text-2xl font-bold">{imageFiles}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 rounded-xl">
                          <FileText className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Documents</p>
                          <p className="text-2xl font-bold">{documentFiles}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 📦 Quota Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Database className="w-5 h-5 text-primary" />
                    Storage Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">Free Quota</p>
                          <p className="text-sm text-muted-foreground">Included with your account</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold">{freeQuotaGB} GB</span>
                    </div>

                    {paidQuotaGB > 0 && (
                      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
                        <div className="flex items-center gap-3">
                          <Plus className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium">Additional Storage</p>
                            <p className="text-sm text-muted-foreground">Purchased capacity</p>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          +{paidQuotaGB.toFixed(1)} GB
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border-2 border-primary/30">
                      <div className="flex items-center gap-3">
                        <Crown className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-bold">Total Available Storage</p>
                          <p className="text-sm text-primary/80">Your complete capacity</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-primary">
                        {totalGB.toFixed(2)} GB
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 💰 Upgrade Tab */}
        <TabsContent value="upgrade" className="space-y-6">
          <Card className="border-2 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Upgrade Your Storage</CardTitle>
              <CardDescription className="text-base">
                Choose the perfect plan to scale your storage needs
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* 📦 Storage Plans */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {storagePlans.map(({ gb, price, popular }) => (
                  <Card 
                    key={gb}
                    className={`relative cursor-pointer transition-all duration-300 hover:scale-105 ${
                      selectedPlan === gb 
                        ? "border-2 border-primary shadow-lg bg-primary/5" 
                        : "border-2 border-muted hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedPlan(gb)}
                  >
                    {popular && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white px-3 py-1">
                          <Crown className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-6 text-center">
                      <CloudUpload className={`w-10 h-10 mx-auto mb-4 ${
                        selectedPlan === gb ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <p className="text-3xl font-bold mb-2">{gb}GB</p>
                      <p className="text-lg text-muted-foreground mb-4">
                        ${price}/month
                      </p>
                      
                      {selectedPlan === gb ? (
                        <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                          <CheckCircle2 className="w-5 h-5" />
                          Selected
                        </div>
                      ) : (
                        <Button variant="outline" className="w-full">
                          Select Plan
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 🧮 Plan Summary */}
              <Card className="bg-gradient-to-br from-primary/5 to-blue-50 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <span className="text-muted-foreground">Selected Plan</span>
                      <span className="font-bold text-lg">{selectedPlan} GB</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <span className="text-muted-foreground">Monthly Cost</span>
                      <span className="font-bold text-lg">
                        ${storagePlans.find(p => p.gb === selectedPlan)?.price}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/30">
                      <div>
                        <p className="font-bold">New Total Storage</p>
                        <p className="text-sm text-primary/80">After upgrade</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {(totalGB + selectedPlan).toFixed(0)} GB
                        </p>
                        <p className="text-sm text-primary/80">
                          +{selectedPlan}GB added
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 🎯 CTA Button */}
              <div className="space-y-4">
                <Button
                  onClick={handlePurchase}
                  disabled={isPurchasing || !vendorId}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                  size="lg"
                >
                  {isPurchasing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                      Processing Your Order...
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-6 h-6 mr-3" />
                      Upgrade to {selectedPlan}GB - $
                      {storagePlans.find(p => p.gb === selectedPlan)?.price}/month
                    </>
                  )}
                </Button>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    💳 Storage is activated immediately • 🔄 Monthly billing • ⚡ Instant upgrade
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Need a custom plan? <a href="#" className="text-primary hover:underline">Contact sales</a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}