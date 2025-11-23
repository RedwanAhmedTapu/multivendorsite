"use client";

import { useState, useEffect, useMemo } from "react";
import { useUpdateOfferMutation } from "@/features/offerApi";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarIcon, 
  Plus, 
  Trash2, 
  Info, 
  Upload, 
  X, 
  Package, 
  Tag, 
  DollarSign, 
  Percent, 
  Clock, 
  Users, 
  Shield, 
  Zap, 
  Check, 
  GiftIcon, 
  TruckIcon, 
  SunIcon, 
  AwardIcon, 
  TicketIcon, 
  Save,
  Edit,
  ArrowLeft,
  Folder
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { OfferProductSelector } from "./offer-product-selector";
import CategoryTreeSelector from "@/components/vendor-management/CategoryTreeSelector";
import type { 
  Offer, 
  CreateOfferRequest, 
  OfferType, 
  DiscountType,
  CountdownOfferConfig,
  VoucherOfferConfig,
  BuyXGetYOfferConfig,
  OfferStackRuleConfig 
} from "@/features/offerApi";

// Offer type configuration
const OFFER_TYPE_CONFIG: Record<OfferType, {
  discountTypes: DiscountType[];
  showMaxDiscount: boolean;
  showUsageLimits: boolean;
  showTargeting: boolean;
  showPriority: boolean;
  showCountdownConfig: boolean;
  showVoucherConfig: boolean;
  showBuyXGetYConfig: boolean;
  showStackRules: boolean;
  icon: React.ReactNode;
  color: string;
}> = {
  REGULAR_DISCOUNT: {
    discountTypes: ["PERCENTAGE", "FIXED_AMOUNT"],
    showMaxDiscount: true,
    showUsageLimits: true,
    showTargeting: true,
    showPriority: true,
    showCountdownConfig: false,
    showVoucherConfig: false,
    showBuyXGetYConfig: false,
    showStackRules: true,
    icon: <Tag className="h-4 w-4" />,
    color: "bg-blue-500"
  },
  VOUCHER: {
    discountTypes: ["PERCENTAGE", "FIXED_AMOUNT"],
    showMaxDiscount: true,
    showUsageLimits: true,
    showTargeting: true,
    showPriority: true,
    showCountdownConfig: false,
    showVoucherConfig: true,
    showBuyXGetYConfig: false,
    showStackRules: true,
    icon: <TicketIcon className="h-4 w-4" />,
    color: "bg-purple-500"
  },
  COUNTDOWN_DEAL: {
    discountTypes: ["PERCENTAGE", "FIXED_AMOUNT"],
    showMaxDiscount: true,
    showUsageLimits: true,
    showTargeting: true,
    showPriority: true,
    showCountdownConfig: true,
    showVoucherConfig: false,
    showBuyXGetYConfig: false,
    showStackRules: false,
    icon: <Clock className="h-4 w-4" />,
    color: "bg-orange-500"
  },
  FLASH_SALE: {
    discountTypes: ["PERCENTAGE", "FIXED_AMOUNT"],
    showMaxDiscount: true,
    showUsageLimits: true,
    showTargeting: true,
    showPriority: true,
    showCountdownConfig: true,
    showVoucherConfig: false,
    showBuyXGetYConfig: false,
    showStackRules: false,
    icon: <Zap className="h-4 w-4" />,
    color: "bg-red-500"
  },
  BUY_X_GET_Y: {
    discountTypes: ["PERCENTAGE", "FIXED_AMOUNT"],
    showMaxDiscount: false,
    showUsageLimits: true,
    showTargeting: true,
    showPriority: true,
    showCountdownConfig: false,
    showVoucherConfig: false,
    showBuyXGetYConfig: true,
    showStackRules: false,
    icon: <GiftIcon className="h-4 w-4" />,
    color: "bg-green-500"
  },
  FREE_SHIPPING: {
    discountTypes: ["FREE_SHIPPING"],
    showMaxDiscount: false,
    showUsageLimits: true,
    showTargeting: true,
    showPriority: true,
    showCountdownConfig: false,
    showVoucherConfig: false,
    showBuyXGetYConfig: false,
    showStackRules: true,
    icon: <TruckIcon className="h-4 w-4" />,
    color: "bg-indigo-500"
  },
  BUNDLE_DEAL: {
    discountTypes: ["PERCENTAGE", "FIXED_AMOUNT"],
    showMaxDiscount: true,
    showUsageLimits: true,
    showTargeting: true,
    showPriority: true,
    showCountdownConfig: false,
    showVoucherConfig: false,
    showBuyXGetYConfig: false,
    showStackRules: true,
    icon: <Package className="h-4 w-4" />,
    color: "bg-yellow-500"
  },
  SEASONAL_SALE: {
    discountTypes: ["PERCENTAGE", "FIXED_AMOUNT"],
    showMaxDiscount: true,
    showUsageLimits: true,
    showTargeting: true,
    showPriority: true,
    showCountdownConfig: false,
    showVoucherConfig: false,
    showBuyXGetYConfig: false,
    showStackRules: true,
    icon: <SunIcon className="h-4 w-4" />,
    color: "bg-pink-500"
  },
  LOYALTY_REWARD: {
    discountTypes: ["PERCENTAGE", "FIXED_AMOUNT"],
    showMaxDiscount: true,
    showUsageLimits: true,
    showTargeting: true,
    showPriority: true,
    showCountdownConfig: false,
    showVoucherConfig: false,
    showBuyXGetYConfig: false,
    showStackRules: true,
    icon: <AwardIcon className="h-4 w-4" />,
    color: "bg-amber-500"
  },
  REFERRAL_BONUS: {
    discountTypes: ["PERCENTAGE", "FIXED_AMOUNT"],
    showMaxDiscount: true,
    showUsageLimits: true,
    showTargeting: true,
    showPriority: true,
    showCountdownConfig: false,
    showVoucherConfig: false,
    showBuyXGetYConfig: false,
    showStackRules: true,
    icon: <Users className="h-4 w-4" />,
    color: "bg-cyan-500"
  },
};

interface EditOfferPageProps {
  offer: Offer;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditOfferPage({ offer, onSuccess, onCancel }: EditOfferPageProps) {
  const [updateOffer, { isLoading }] = useUpdateOfferMutation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [targetProductIds, setTargetProductIds] = useState<string[]>([]);
  const [targetCategoryIds, setTargetCategoryIds] = useState<string[]>([]);
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [categorySelectorOpen, setCategorySelectorOpen] = useState(false);
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<string>("");
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string>("");

  const [formData, setFormData] = useState<CreateOfferRequest>({
    title: "",
    description: "",
    type: "REGULAR_DISCOUNT" as OfferType,
    category: "GENERAL",
    discountType: "PERCENTAGE" as DiscountType,
    discountValue: 0,
    maxDiscountAmount: undefined,
    minOrderAmount: 0,
    validFrom: new Date().toISOString(),
    validTo: undefined,
    totalUsageLimit: undefined,
    userUsageLimit: 1,
    isPublic: true,
    applicableToAll: true,
    bannerImage: "",
    termsAndConditions: "",
    priority: 1,
    status: "ACTIVE",
    targetProductIds: [],
    targetCategoryIds: [],
    targetVendorIds: [],
    targetUserIds: [],
    countdownConfig: undefined,
    voucherConfig: undefined,
    buyXGetYConfig: undefined,
    stackRuleConfig: undefined,
  });

  // Initialize form data when offer changes
  useEffect(() => {
    if (offer) {
      const offerType = (offer.type || "REGULAR_DISCOUNT") as OfferType;
      const offerDiscountType = (offer.discountType || "PERCENTAGE") as DiscountType;
      
      // Extract product IDs from targetProducts array
      const productIds = offer.targetProducts?.map((tp: any) => tp.productId) || [];
      
      // Extract category IDs from targetCategories array
      const categoryIds = offer.targetCategories?.map((tc: any) => tc.categoryId) || [];
      
      // Extract vendor IDs from targetVendors array
      const vendorIds = offer.targetVendors?.map((tv: any) => tv.vendorId) || [];
      
      // Extract user IDs from targetUsers array
      const userIds = offer.targetUsers?.map((tu: any) => tu.userId) || [];
      
      // Get stack rule config from first element of array
      const stackRule = (offer.offerStackRules && ((offer.offerStackRules as unknown) as any[])[0]) ? {
        canCombineWithOtherOffers: ((offer.offerStackRules as unknown) as any[])[0].canCombineWithOtherOffers,
        maxStackCount: ((offer.offerStackRules as unknown) as any[])[0].maxStackCount,
      } : undefined;
      
      // Set selected category path based on the first category
      let initialCategoryPath = "";
      if (categoryIds.length > 0 && offer.targetCategories?.[0]?.category?.name) {
        initialCategoryPath = offer.targetCategories[0].category.name;
      }
      
      setFormData({
        title: offer.title || "",
        description: offer.description || "",
        type: offerType,
        category: offer.category || "GENERAL",
        discountType: offerDiscountType,
        discountValue: offer.discountValue || 0,
        maxDiscountAmount: offer.maxDiscountAmount,
        minOrderAmount: offer.minOrderAmount || 0,
        validFrom: offer.validFrom || new Date().toISOString(),
        validTo: offer.validTo,
        totalUsageLimit: offer.totalUsageLimit,
        userUsageLimit: offer.userUsageLimit || 1,
        isPublic: offer.isPublic ?? true,
        applicableToAll: offer.applicableToAll ?? true,
        bannerImage: offer.bannerImage || "",
        termsAndConditions: offer.termsAndConditions || "",
        priority: offer.priority || 1,
        status: offer.status || "ACTIVE",
        targetProductIds: productIds,
        targetCategoryIds: categoryIds,
        targetVendorIds: vendorIds,
        targetUserIds: userIds,
        countdownConfig: offer.countdownConfig || undefined,
        voucherConfig: offer.voucherConfig || undefined,
        buyXGetYConfig: offer.buyXGetYOffer || undefined,
        stackRuleConfig: stackRule,
      });

      setTargetProductIds(productIds);
      setBannerImagePreview(offer.bannerImage || "");
      setTargetCategoryIds(categoryIds);
      setSelectedCategoryPath(initialCategoryPath);
    }
  }, [offer]);

  // Use useMemo to compute currentConfig and avoid undefined issues
  const currentConfig = useMemo(() => {
    const config = OFFER_TYPE_CONFIG[formData.type];
    if (!config) {
      console.warn(`No config found for offer type: ${formData.type}, falling back to REGULAR_DISCOUNT`);
      return OFFER_TYPE_CONFIG.REGULAR_DISCOUNT;
    }
    return config;
  }, [formData.type]);

  // Validate and adjust discount type when offer type changes
  useEffect(() => {
    if (currentConfig && !currentConfig.discountTypes.includes(formData.discountType)) {
      setFormData(prev => ({ 
        ...prev, 
        discountType: currentConfig.discountTypes[0] as DiscountType 
      }));
    }
  }, [formData.type, currentConfig, formData.discountType]);

  // Handle banner image file selection
  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, WebP, GIF)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setBannerImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBannerImage = () => {
    setBannerImageFile(null);
    setBannerImagePreview("");
    setFormData(prev => ({ ...prev, bannerImage: "" }));
  };

  // Handle category selection from CategoryTreeSelector
  const handleCategorySelect = (categoryId: string, categoryPath: string, isLeaf: boolean) => {
    if (isLeaf) {
      setTargetCategoryIds([categoryId]);
      setSelectedCategoryPath(categoryPath);
      setCategorySelectorOpen(false);
      setFormData(prev => ({ 
        ...prev, 
        category: categoryId as any,
        targetCategoryIds: [categoryId]
      }));
      toast.success("Category selected successfully");
    } else {
      toast.error("Please select a leaf category (sub-category)");
    }
  };

  // Clear selected category
  const clearSelectedCategory = () => {
    setTargetCategoryIds([]);
    setSelectedCategoryPath("");
    setFormData(prev => ({ 
      ...prev, 
      category: "GENERAL",
      targetCategoryIds: [] 
    }));
    toast.info("Category selection cleared");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer) return;

    // Validate required fields
    if (!formData.title.trim()) {
      toast.error("Offer title is required");
      return;
    }

    if (!formData.type) {
      toast.error("Offer type is required");
      return;
    }

    if (formData.discountValue <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }

    try {
      const submitData: CreateOfferRequest = {
        ...formData,
        targetProductIds: formData.applicableToAll ? [] : targetProductIds,
        targetCategoryIds: targetCategoryIds,
        bannerImage: bannerImagePreview || formData.bannerImage,
        // Ensure type is never empty and is valid
        type: formData.type || "REGULAR_DISCOUNT",
      };

      await updateOffer({
        offerId: offer.id,
        data: submitData,
      }).unwrap();
      
      toast.success("Offer updated successfully");
      if (onSuccess) {
        onSuccess();
      } else {
        // router.push('/admin/offers');
      }
    } catch (error) {
      console.error("Update offer error:", error);
      toast.error("Failed to update offer");
    }
  };

  // Safe config getters with fallbacks
  const getCountdownConfig = (): CountdownOfferConfig => {
    return formData.countdownConfig || {
      countdownEnds: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      showCountdown: true,
      urgencyText: "Hurry! Limited time offer",
      scarcityText: "Selling fast!",
    };
  };

  const getVoucherConfig = (): VoucherOfferConfig => {
    return formData.voucherConfig || {
      requiresCode: true,
      isPublic: true,
      firstTimeOnly: false,
      isAutoGenerated: false,
    };
  };

  const getBuyXGetYConfig = (): BuyXGetYOfferConfig => {
    return formData.buyXGetYConfig || {
      buyProductId: "",
      getProductId: "",
      buyQuantity: 1,
      getQuantity: 1,
    };
  };

  const getStackRuleConfig = (): OfferStackRuleConfig => {
    return formData.stackRuleConfig || {
      canCombineWithOtherOffers: false,
      maxStackCount: 1,
    };
  };

  const calculateDiscountPreview = () => {
    if (formData.discountType === "PERCENTAGE") {
      return `${formData.discountValue}% off`;
    } else if (formData.discountType === "FIXED_AMOUNT") {
      return `₹${formData.discountValue} off`;
    } else if (formData.discountType === "FREE_SHIPPING") {
      return "Free Shipping";
    }
    return "";
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  if (!offer) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Offer Not Found</h1>
          <p className="text-muted-foreground mt-2">The offer you're trying to edit doesn't exist.</p>
          <Button onClick={handleCancel} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Offers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Offer</h1>
            <p className="text-muted-foreground">
              Update the offer details and settings. All changes will be applied immediately.
            </p>
          </div>
        </div>
        
        {/* Offer Type Badge */}
        <Badge 
          variant="outline" 
          className={cn("text-lg px-4 py-2", currentConfig.color)}
        >
          <span className="flex items-center gap-2">
            {currentConfig.icon}
            {formData.type.replace(/_/g, ' ')}
          </span>
        </Badge>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {["Basic Info", "Discount", "Rules", "Advanced"].map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium",
              activeTab === step.toLowerCase().replace(' ', '') 
                ? "bg-primary text-primary-foreground border-primary" 
                : index < ["basic", "discount", "rules", "advanced"].indexOf(activeTab)
                ? "bg-green-500 text-white border-green-500"
                : "border-muted-foreground text-muted-foreground"
            )}>
              {index < ["basic", "discount", "rules", "advanced"].indexOf(activeTab) ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <span className={cn(
              "ml-2 text-sm font-medium",
              activeTab === step.toLowerCase().replace(' ', '') || 
              index < ["basic", "discount", "rules", "advanced"].indexOf(activeTab)
                ? "text-foreground"
                : "text-muted-foreground"
            )}>
              {step}
            </span>
            {index < 3 && (
              <div className={cn(
                "w-16 h-0.5 mx-4",
                index < ["basic", "discount", "rules", "advanced"].indexOf(activeTab)
                  ? "bg-green-500"
                  : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 h-auto mb-8 w-full max-w-2xl mx-auto">
            <TabsTrigger value="basic" className="flex items-center gap-2 py-3">
              <Info className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="discount" className="flex items-center gap-2 py-3">
              <Percent className="h-4 w-4" />
              Discount
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2 py-3">
              <Shield className="h-4 w-4" />
              Rules & Limits
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2 py-3">
              <Users className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Offer Details</CardTitle>
                    <CardDescription>
                      Basic information about your offer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-title" className="flex items-center gap-2">
                          Offer Title *
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </Label>
                        <Input
                          id="edit-title"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          placeholder="Summer Sale 2024"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-type">Offer Type *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: OfferType) =>
                            setFormData({ ...formData, type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(OFFER_TYPE_CONFIG).map((type) => {
                              const typeKey = type as OfferType;
                              const config = OFFER_TYPE_CONFIG[typeKey];
                              return (
                                <SelectItem key={type} value={type}>
                                  <div className="flex items-center gap-2">
                                    {config.icon}
                                    {type.replace(/_/g, ' ')}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Describe the offer details, benefits, and any important information for customers..."
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-category">Category *</Label>
                        <div className="space-y-2">
                          {selectedCategoryPath ? (
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2">
                                <Folder className="h-4 w-4 text-green-600" />
                                <span className="font-medium">{selectedCategoryPath}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearSelectedCategory}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                              onClick={() => setCategorySelectorOpen(true)}
                            >
                              <Folder className="mr-2 h-4 w-4" />
                              Select category
                            </Button>
                          )}
                          {categorySelectorOpen && (
                            <div className="mt-2 p-4 border rounded-lg bg-white shadow-lg max-h-96 overflow-auto">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Select Category</h4>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCategorySelectorOpen(false)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <CategoryTreeSelector
                                onSelect={handleCategorySelect}
                              />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Select the main category for this offer
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-priority">Priority</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="edit-priority"
                            type="number"
                            min="1"
                            max="10"
                            value={formData.priority}
                            onChange={(e) =>
                              setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })
                            }
                            className="w-20"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Low</span>
                              <span>High</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${((formData.priority ?? 1) / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Higher priority offers are applied first when multiple offers are applicable
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Voucher Configuration */}
                {currentConfig.showVoucherConfig && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Voucher Configuration</CardTitle>
                      <CardDescription>
                        Settings for voucher code generation and usage
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-voucherCode">Voucher Code</Label>
                          <Input
                            id="edit-voucherCode"
                            value={getVoucherConfig().code || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                voucherConfig: {
                                  ...getVoucherConfig(),
                                  code: e.target.value,
                                  requiresCode: true,
                                  isAutoGenerated: !e.target.value,
                                },
                              })
                            }
                            placeholder="SUMMER2024"
                          />
                          <p className="text-xs text-muted-foreground">
                            Leave empty to auto-generate a random code
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Voucher Settings</Label>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="edit-voucherIsPublic" className="text-sm">Public Voucher</Label>
                              <Switch
                                id="edit-voucherIsPublic"
                                checked={getVoucherConfig().isPublic ?? true}
                                onCheckedChange={(checked) =>
                                  setFormData({
                                    ...formData,
                                    voucherConfig: {
                                      ...getVoucherConfig(),
                                      isPublic: checked,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="edit-firstTimeOnly" className="text-sm">First-time customers only</Label>
                              <Switch
                                id="edit-firstTimeOnly"
                                checked={getVoucherConfig().firstTimeOnly ?? false}
                                onCheckedChange={(checked) =>
                                  setFormData({
                                    ...formData,
                                    voucherConfig: {
                                      ...getVoucherConfig(),
                                      firstTimeOnly: checked,
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Countdown Configuration */}
                {currentConfig.showCountdownConfig && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Countdown Configuration</CardTitle>
                      <CardDescription>
                        Timer and urgency settings for time-sensitive offers
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-countdownEnds">Countdown End *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !getCountdownConfig().countdownEnds && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {getCountdownConfig().countdownEnds ? (
                                  format(new Date(getCountdownConfig().countdownEnds), "PPP p")
                                ) : (
                                  <span>Pick end date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={getCountdownConfig().countdownEnds ? new Date(getCountdownConfig().countdownEnds) : new Date()}
                                onSelect={(date) =>
                                  setFormData({
                                    ...formData,
                                    countdownConfig: {
                                      ...getCountdownConfig(),
                                      countdownEnds: date?.toISOString() || new Date().toISOString(),
                                      showCountdown: true,
                                    },
                                  })
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-quantityLimit">Quantity Limit</Label>
                          <Input
                            id="edit-quantityLimit"
                            type="number"
                            min="1"
                            value={getCountdownConfig().quantityLimit || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                countdownConfig: {
                                  ...getCountdownConfig(),
                                  quantityLimit: e.target.value ? parseInt(e.target.value) : undefined,
                                },
                              })
                            }
                            placeholder="Limited quantity"
                          />
                          <p className="text-xs text-muted-foreground">
                            Maximum number of items available at this price
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-urgencyText">Urgency Text</Label>
                          <Input
                            id="edit-urgencyText"
                            value={getCountdownConfig().urgencyText || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                countdownConfig: {
                                  ...getCountdownConfig(),
                                  urgencyText: e.target.value,
                                },
                              })
                            }
                            placeholder="Hurry! Limited time offer"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-scarcityText">Scarcity Text</Label>
                          <Input
                            id="edit-scarcityText"
                            value={getCountdownConfig().scarcityText || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                countdownConfig: {
                                  ...getCountdownConfig(),
                                  scarcityText: e.target.value,
                                },
                              })
                            }
                            placeholder="Only a few items left!"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Banner Image Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle>Banner Image</CardTitle>
                    <CardDescription>
                      Update the offer banner image
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {bannerImagePreview ? (
                        <div className="relative">
                          <img
                            src={bannerImagePreview}
                            alt="Banner preview"
                            className="w-full h-40 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={removeBannerImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                          <input
                            id="edit-banner-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleBannerImageChange}
                            className="hidden"
                          />
                          <label htmlFor="edit-banner-upload" className="cursor-pointer">
                            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                            <div className="text-sm text-gray-600">
                              Click to upload banner image
                              <span className="text-xs block text-gray-400 mt-1">
                                PNG, JPG, WebP up to 5MB
                              </span>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recommended size: 1200×400px
                    </p>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setActiveTab("discount")}
                    >
                      <Percent className="h-4 w-4 mr-2" />
                      Set Discount
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setActiveTab("rules")}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Set Validity
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setActiveTab("advanced")}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Target Products
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Discount Tab */}
          <TabsContent value="discount" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Discount Configuration</CardTitle>
                    <CardDescription>
                      Set up the discount value and type
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Discount Preview */}
                    {formData.discountValue > 0 && (
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">
                            {calculateDiscountPreview()}
                          </div>
                          {(formData.minOrderAmount ?? 0) > 0 && (
                            <div className="text-sm text-muted-foreground mt-2">
                              on orders above ₹{formData.minOrderAmount ?? 0}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="edit-discountType">Discount Type *</Label>
                        <Select
                          value={formData.discountType}
                          onValueChange={(value: DiscountType) =>
                            setFormData({ ...formData, discountType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currentConfig.discountTypes.map(type => (
                              <SelectItem key={type} value={type}>
                                <div className="flex items-center gap-2">
                                  {type === "PERCENTAGE" && <Percent className="h-4 w-4" />}
                                  {type === "FIXED_AMOUNT" && <DollarSign className="h-4 w-4" />}
                                  {type === "FREE_SHIPPING" && <TruckIcon className="h-4 w-4" />}
                                  {type === "PERCENTAGE" && "Percentage Discount"}
                                  {type === "FIXED_AMOUNT" && "Fixed Amount"}
                                  {type === "FREE_SHIPPING" && "Free Shipping"}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-discountValue">
                          {formData.discountType === "PERCENTAGE" 
                            ? "Discount Percentage *" 
                            : formData.discountType === "FIXED_AMOUNT"
                            ? "Discount Amount *"
                            : "Discount Value"}
                        </Label>
                        <div className="relative">
                          {formData.discountType === "PERCENTAGE" ? (
                            <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          ) : (
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          )}
                          <Input
                            id="edit-discountValue"
                            type="number"
                            min="0"
                            step={formData.discountType === "PERCENTAGE" ? "1" : "0.01"}
                            value={formData.discountValue}
                            onChange={(e) =>
                              setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })
                            }
                            className="pl-10"
                            required={formData.discountType !== "BUY_X_GET_Y"}
                          />
                        </div>
                        {formData.discountType === "PERCENTAGE" && formData.discountValue > 100 && (
                          <p className="text-xs text-destructive">
                            Discount percentage cannot exceed 100%
                          </p>
                        )}
                      </div>
                    </div>

                    {currentConfig.showMaxDiscount && formData.discountType === "PERCENTAGE" && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-maxDiscountAmount">Maximum Discount Amount</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            id="edit-maxDiscountAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.maxDiscountAmount || ""}
                            onChange={(e) =>
                              setFormData({ 
                                ...formData, 
                                maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                              })
                            }
                            className="pl-10"
                            placeholder="No maximum limit"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Caps the maximum discount amount for percentage-based discounts
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="edit-minOrderAmount">Minimum Order Amount</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="edit-minOrderAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.minOrderAmount}
                          onChange={(e) =>
                            setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })
                          }
                          className="pl-10"
                          placeholder="0"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum cart value required to apply this offer
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Buy X Get Y Configuration */}
                {currentConfig.showBuyXGetYConfig && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Buy X Get Y Configuration</CardTitle>
                      <CardDescription>
                        Set up the buy X get Y free offer details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-buyProductId">Buy Product ID *</Label>
                          <Input
                            id="edit-buyProductId"
                            value={getBuyXGetYConfig().buyProductId}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                buyXGetYConfig: {
                                  ...getBuyXGetYConfig(),
                                  buyProductId: e.target.value,
                                },
                              })
                            }
                            placeholder="PROD_001"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            ID of the product customer needs to purchase
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-buyQuantity">Buy Quantity *</Label>
                          <Input
                            id="edit-buyQuantity"
                            type="number"
                            min="1"
                            value={getBuyXGetYConfig().buyQuantity}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                buyXGetYConfig: {
                                  ...getBuyXGetYConfig(),
                                  buyQuantity: parseInt(e.target.value) || 1,
                                },
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-getProductId">Get Product ID *</Label>
                          <Input
                            id="edit-getProductId"
                            value={getBuyXGetYConfig().getProductId}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                buyXGetYConfig: {
                                  ...getBuyXGetYConfig(),
                                  getProductId: e.target.value,
                                },
                              })
                            }
                            placeholder="PROD_002"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            ID of the product customer gets for free
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-getQuantity">Get Quantity *</Label>
                          <Input
                            id="edit-getQuantity"
                            type="number"
                            min="1"
                            value={getBuyXGetYConfig().getQuantity}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                buyXGetYConfig: {
                                  ...getBuyXGetYConfig(),
                                  getQuantity: parseInt(e.target.value) || 1,
                                },
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Discount Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Percent className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Percentage Discounts</div>
                        <p className="text-muted-foreground">Best for site-wide sales and category discounts</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Fixed Amount</div>
                        <p className="text-muted-foreground">Ideal for cart value discounts and specific products</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <TruckIcon className="h-4 w-4 text-purple-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Free Shipping</div>
                        <p className="text-muted-foreground">Great for increasing average order value</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Rules & Limits Tab */}
          <TabsContent value="rules" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Validity Period</CardTitle>
                    <CardDescription>
                      Set when the offer starts and ends
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Valid From *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.validFrom && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.validFrom ? (
                                format(new Date(formData.validFrom), "PPP p")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={new Date(formData.validFrom)}
                              onSelect={(date) =>
                                setFormData({ ...formData, validFrom: date?.toISOString() || new Date().toISOString() })
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Valid To</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.validTo && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.validTo ? (
                                format(new Date(formData.validTo), "PPP p")
                              ) : (
                                <span>No expiry</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.validTo ? new Date(formData.validTo) : undefined}
                              onSelect={(date) =>
                                setFormData({ ...formData, validTo: date?.toISOString() })
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    {formData.validTo && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Offer will be active for {Math.ceil((new Date(formData.validTo).getTime() - new Date(formData.validFrom).getTime()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {currentConfig.showUsageLimits && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Usage Limits</CardTitle>
                      <CardDescription>
                        Control how many times this offer can be used
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-totalUsageLimit">Total Usage Limit</Label>
                          <Input
                            id="edit-totalUsageLimit"
                            type="number"
                            min="0"
                            value={formData.totalUsageLimit || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                totalUsageLimit: e.target.value ? parseInt(e.target.value) : undefined,
                              })
                            }
                            placeholder="No limit"
                          />
                          <p className="text-xs text-muted-foreground">
                            Maximum total times this offer can be used
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-userUsageLimit">Usage Limit Per User *</Label>
                          <Input
                            id="edit-userUsageLimit"
                            type="number"
                            min="1"
                            value={formData.userUsageLimit}
                            onChange={(e) =>
                              setFormData({ ...formData, userUsageLimit: parseInt(e.target.value) || 1 })
                            }
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Maximum times a single user can use this offer
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Stack Rules */}
                {currentConfig.showStackRules && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Stacking Rules</CardTitle>
                      <CardDescription>
                        Control how this offer interacts with other offers
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="edit-canCombine" className="text-base">
                            Can combine with other offers
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Allow this offer to be used together with other active offers
                          </p>
                        </div>
                        <Switch
                          id="edit-canCombine"
                          checked={getStackRuleConfig().canCombineWithOtherOffers}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              stackRuleConfig: {
                                ...getStackRuleConfig(),
                                canCombineWithOtherOffers: checked,
                              },
                            })
                          }
                        />
                      </div>
                      {getStackRuleConfig().canCombineWithOtherOffers && (
                        <div className="space-y-2">
                          <Label htmlFor="edit-maxStackCount">Maximum Stack Count</Label>
                          <Input
                            id="edit-maxStackCount"
                            type="number"
                            min="1"
                            max="10"
                            value={getStackRuleConfig().maxStackCount}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                stackRuleConfig: {
                                  ...getStackRuleConfig(),
                                  maxStackCount: parseInt(e.target.value) || 1,
                                },
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Maximum number of offers that can be combined together
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Best Practices</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-orange-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Time Limits</div>
                        <p className="text-muted-foreground">Create urgency with shorter validity periods</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Usage Limits</div>
                        <p className="text-muted-foreground">Prevent abuse with reasonable usage limits</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Stacking Rules</div>
                        <p className="text-muted-foreground">Control how offers combine to prevent revenue loss</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Targeting</CardTitle>
                    <CardDescription>
                      Choose which products this offer applies to
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="edit-applicableToAll" className="text-base">
                          Applicable to All Products
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Apply this offer to all products in your store
                        </p>
                      </div>
                      <Switch
                        id="edit-applicableToAll"
                        checked={formData.applicableToAll}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, applicableToAll: checked })
                        }
                      />
                    </div>

                    {!formData.applicableToAll && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label>Selected Products</Label>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setProductSelectorOpen(true)}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Select Products
                          </Button>
                        </div>
                        
                        {targetProductIds.length > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {targetProductIds.length} products selected
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setTargetProductIds([])}
                              >
                                Clear All
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto p-2 border rounded">
                              {targetProductIds.slice(0, 10).map((productId) => (
                                <div key={productId} className="flex items-center justify-between p-2 border rounded text-sm">
                                  <span className="font-mono">ID: {productId}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setTargetProductIds(prev => prev.filter(id => id !== productId))}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              {targetProductIds.length > 10 && (
                                <div className="text-center p-2 text-sm text-muted-foreground">
                                  +{targetProductIds.length - 10} more products
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-4 border-2 border-dashed rounded-lg">
                            <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">No products selected</p>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => setProductSelectorOpen(true)}
                            >
                              Select Products
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Visibility & Status</CardTitle>
                    <CardDescription>
                      Control who can see and use this offer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="edit-isPublic" className="text-base">
                          Public Offer
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Make this offer visible to all customers
                        </p>
                      </div>
                      <Switch
                        id="edit-isPublic"
                        checked={formData.isPublic}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isPublic: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-status">Offer Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE" className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            Active
                          </SelectItem>
                          <SelectItem value="PENDING" className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-yellow-500" />
                            Pending
                          </SelectItem>
                          <SelectItem value="PAUSED" className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-gray-500" />
                            Paused
                          </SelectItem>
                          <SelectItem value="EXPIRED" className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            Expired
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Set the current status for this offer
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Terms & Conditions</CardTitle>
                    <CardDescription>
                      Additional terms and conditions for this offer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="edit-termsAndConditions">Terms & Conditions</Label>
                      <Textarea
                        id="edit-termsAndConditions"
                        value={formData.termsAndConditions || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, termsAndConditions: e.target.value })
                        }
                        placeholder="Enter offer terms and conditions, restrictions, or additional information..."
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        These terms will be displayed to customers when they use this offer
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Offer Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Offer Type</span>
                        <span className="text-sm font-medium">{formData.type.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Discount</span>
                        <span className="text-sm font-medium">{calculateDiscountPreview()}</span>
                      </div>
                      {((formData.minOrderAmount ?? 0) > 0) && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Min. Order</span>
                          <span className="text-sm font-medium">₹{formData.minOrderAmount !== undefined ? formData.minOrderAmount : 0}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Validity</span>
                        <span className="text-sm font-medium">
                          {formData.validTo 
                            ? `${Math.ceil((new Date(formData.validTo).getTime() - new Date(formData.validFrom).getTime()) / (1000 * 60 * 60 * 24))} days`
                            : 'No expiry'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Category</span>
                        <span className="text-sm font-medium">
                          {selectedCategoryPath || 'General'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Products</span>
                        <span className="text-sm font-medium">
                          {formData.applicableToAll ? 'All Products' : `${targetProductIds.length} selected`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <span className="text-sm font-medium">{formData.status}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ready to Update</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {!formData.title && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <X className="h-4 w-4" />
                          <span>Offer title is required</span>
                        </div>
                      )}
                      {!formData.discountValue && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <X className="h-4 w-4" />
                          <span>Discount value is required</span>
                        </div>
                      )}
                      {!selectedCategoryPath && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <X className="h-4 w-4" />
                          <span>Category is required</span>
                        </div>
                      )}
                      {formData.title && formData.discountValue && selectedCategoryPath && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Check className="h-4 w-4" />
                          <span>All requirements met</span>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={isLoading || !formData.title || !formData.discountValue || !selectedCategoryPath}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Updating Offer...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Offer
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </form>

      {/* Product Selector Modal */}
      <OfferProductSelector
        selectedProductIds={targetProductIds}
        onSelectionChange={setTargetProductIds}
        open={productSelectorOpen}
        onOpenChange={setProductSelectorOpen}
      />
    </div>
  );
}