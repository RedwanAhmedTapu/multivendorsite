"use client"
// components/admin/offers/create-offer-page.tsx
import { useState, useEffect } from "react";
import { useCreateOfferMutation } from "@/features/offerApi";
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
import { CalendarIcon, Plus, Trash2, Info, Upload, X, Package, Tag, DollarSign, Percent, Clock, Users, Shield, Zap, Check, GiftIcon, TruckIcon, SunIcon, AwardIcon, TicketIcon, ArrowLeft, Save } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OfferProductSelector } from "./offer-product-selector";
import type { 
  CreateOfferRequest, 
  OfferType, 
  DiscountType,
  CountdownOfferConfig,
  VoucherOfferConfig,
  BuyXGetYOfferConfig,
  OfferStackRuleConfig 
} from "@/features/offerApi";

interface CreateOfferPageProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

type OfferConfig = {
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
};

const OFFER_TYPE_CONFIG: Record<OfferType, OfferConfig> = {
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

const OFFER_CATEGORIES = [
  "GENERAL", "ELECTRONICS", "FASHION", "HOME_GARDEN", "SPORTS", 
  "BEAUTY", "FOOD_BEVERAGE", "BOOKS", "TOYS", "AUTOMOTIVE", 
  "HEALTH", "PETS"
];

// Helper functions to create default config objects
const createDefaultCountdownConfig = (): CountdownOfferConfig => ({
  countdownEnds: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  showCountdown: true,
  urgencyText: "Hurry! Limited time offer",
  scarcityText: "Selling fast!",
});

const createDefaultVoucherConfig = (): VoucherOfferConfig => ({
  code: "",
  requiresCode: true,
  isPublic: true,
  firstTimeOnly: false,
  isAutoGenerated: false,
});

const createDefaultBuyXGetYConfig = (): BuyXGetYOfferConfig => ({
  buyProductId: "",
  getProductId: "",
  buyQuantity: 1,
  getQuantity: 1,
});

const createDefaultStackRuleConfig = (): OfferStackRuleConfig => ({
  canCombineWithOtherOffers: false,
  maxStackCount: 1,
});

// Additional icons
const Ticket = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
    <path d="M13 5v2M13 11v2M13 17v2"/>
  </svg>
);

const Gift = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
    <line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
);

const Truck = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

const Sun = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const Award = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
  </svg>
);

export function CreateOfferPage({ onCancel, onSuccess }: CreateOfferPageProps) {
  const [createOffer, { isLoading }] = useCreateOfferMutation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [targetProductIds, setTargetProductIds] = useState<string[]>([]);
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string>("");

  const [offerData, setOfferData] = useState<CreateOfferRequest>({
    title: "",
    description: "",
    type: "REGULAR_DISCOUNT",
    category: "GENERAL",
    discountType: "PERCENTAGE",
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

  const currentConfig = OFFER_TYPE_CONFIG[offerData.type];

  useEffect(() => {
    // Reset dependent fields when offer type changes
    if (!currentConfig.discountTypes.includes(offerData.discountType)) {
      setOfferData(prev => ({ ...prev, discountType: currentConfig.discountTypes[0] }));
    }

    // Initialize config objects when switching to offer types that need them
    if (currentConfig.showCountdownConfig && !offerData.countdownConfig) {
      setOfferData(prev => ({ ...prev, countdownConfig: createDefaultCountdownConfig() }));
    } else if (!currentConfig.showCountdownConfig && offerData.countdownConfig) {
      setOfferData(prev => ({ ...prev, countdownConfig: undefined }));
    }

    if (currentConfig.showVoucherConfig && !offerData.voucherConfig) {
      setOfferData(prev => ({ ...prev, voucherConfig: createDefaultVoucherConfig() }));
    } else if (!currentConfig.showVoucherConfig && offerData.voucherConfig) {
      setOfferData(prev => ({ ...prev, voucherConfig: undefined }));
    }

    if (currentConfig.showBuyXGetYConfig && !offerData.buyXGetYConfig) {
      setOfferData(prev => ({ ...prev, buyXGetYConfig: createDefaultBuyXGetYConfig() }));
    } else if (!currentConfig.showBuyXGetYConfig && offerData.buyXGetYConfig) {
      setOfferData(prev => ({ ...prev, buyXGetYConfig: undefined }));
    }

    if (currentConfig.showStackRules && !offerData.stackRuleConfig) {
      setOfferData(prev => ({ ...prev, stackRuleConfig: createDefaultStackRuleConfig() }));
    } else if (!currentConfig.showStackRules && offerData.stackRuleConfig) {
      setOfferData(prev => ({ ...prev, stackRuleConfig: undefined }));
    }
  }, [offerData.type, currentConfig]);

  // Handle banner image file selection
  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, WebP, GIF)');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setBannerImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove banner image
  const removeBannerImage = () => {
    setBannerImageFile(null);
    setBannerImagePreview("");
    setOfferData(prev => ({ ...prev, bannerImage: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    // Create FormData object
    const submitFormData = new FormData();
    
    // Append all form fields from offerData
    submitFormData.append('title', offerData.title);
    submitFormData.append('type', offerData.type);
    submitFormData.append('description', offerData.description || '');
    submitFormData.append('category', offerData.category || 'GENERAL');
    submitFormData.append('discountType', offerData.discountType);
    submitFormData.append('discountValue', offerData.discountValue.toString());
    submitFormData.append('minOrderAmount', (offerData.minOrderAmount || 0).toString());
    submitFormData.append('validFrom', typeof offerData.validFrom === 'string' ? offerData.validFrom : offerData.validFrom.toISOString());
    submitFormData.append('priority', (offerData.priority || 1).toString());
    submitFormData.append('status', offerData.status || 'ACTIVE');
    submitFormData.append('isPublic', (offerData.isPublic !== false).toString());
    submitFormData.append('applicableToAll', (offerData.applicableToAll !== false).toString());
    submitFormData.append('userUsageLimit', (offerData.userUsageLimit || 1).toString());
    
    // Append optional fields
    if (offerData.maxDiscountAmount) {
      submitFormData.append('maxDiscountAmount', offerData.maxDiscountAmount.toString());
    }
    if (offerData.validTo) {
      // validTo may be a string or a Date; ensure we append a string
      submitFormData.append(
        'validTo',
        typeof offerData.validTo === 'string' ? offerData.validTo : offerData.validTo.toISOString()
      );
    }
    if (offerData.totalUsageLimit) {
      submitFormData.append('totalUsageLimit', offerData.totalUsageLimit.toString());
    }
    if (offerData.termsAndConditions) {
      submitFormData.append('termsAndConditions', offerData.termsAndConditions);
    }
    
    // Append arrays as JSON strings - FIXED: Ensure they're properly stringified
    submitFormData.append('targetProductIds', JSON.stringify(offerData.applicableToAll ? [] : targetProductIds));
    submitFormData.append('targetCategoryIds', JSON.stringify(offerData.targetCategoryIds || []));
    submitFormData.append('targetVendorIds', JSON.stringify(offerData.targetVendorIds || []));
    submitFormData.append('targetUserIds', JSON.stringify(offerData.targetUserIds || []));
    
    // Append config objects as JSON strings
    if (offerData.countdownConfig) {
      submitFormData.append('countdownConfig', JSON.stringify(offerData.countdownConfig));
    }
    if (offerData.voucherConfig) {
      submitFormData.append('voucherConfig', JSON.stringify(offerData.voucherConfig));
    }
    if (offerData.buyXGetYConfig) {
      submitFormData.append('buyXGetYConfig', JSON.stringify(offerData.buyXGetYConfig));
    }
    if (offerData.stackRuleConfig) {
      submitFormData.append('stackRuleConfig', JSON.stringify(offerData.stackRuleConfig));
    }
    
    // Append banner image file if it exists
    if (bannerImageFile) {
      submitFormData.append('bannerImage', bannerImageFile);
    }

    // Create the offer with submitFormData
    await createOffer(submitFormData).unwrap();
    
    toast.success("Offer created successfully");
    if (onSuccess) {
      onSuccess();
    } else {
      router.push('/admin/offers');
    }
    resetForm();
  } catch (error) {
    toast.error("Failed to create offer");
    console.error("Create offer error:", error);
  }
};
  const resetForm = () => {
    setOfferData({
      title: "",
      description: "",
      type: "REGULAR_DISCOUNT",
      category: "GENERAL",
      discountType: "PERCENTAGE",
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
    setTargetProductIds([]);
    setBannerImageFile(null);
    setBannerImagePreview("");
    setActiveTab("basic");
  };

  const getOfferTypeDescription = (type: OfferType) => {
    const descriptions = {
      REGULAR_DISCOUNT: "Standard discount applied to products or categories",
      VOUCHER: "Code-based discount requiring customer input at checkout",
      COUNTDOWN_DEAL: "Time-limited deal with visible countdown timer",
      FLASH_SALE: "Short-term sale with limited quantities and high urgency",
      BUY_X_GET_Y: "Buy certain quantity and get products for free or discounted",
      FREE_SHIPPING: "Waive shipping fees on qualifying orders",
      BUNDLE_DEAL: "Special pricing for product bundles or packages",
      SEASONAL_SALE: "Seasonal or holiday-themed promotions",
      LOYALTY_REWARD: "Exclusive discounts for loyal customers",
      REFERRAL_BONUS: "Discounts for customers who refer new users",
    };
    return descriptions[type];
  };

  // Safe config getters with fallbacks
  const getCountdownConfig = (): CountdownOfferConfig => {
    return offerData.countdownConfig || createDefaultCountdownConfig();
  };

  const getVoucherConfig = (): VoucherOfferConfig => {
    return offerData.voucherConfig || createDefaultVoucherConfig();
  };

  const getBuyXGetYConfig = (): BuyXGetYOfferConfig => {
    return offerData.buyXGetYConfig || createDefaultBuyXGetYConfig();
  };

  const getStackRuleConfig = (): OfferStackRuleConfig => {
    return offerData.stackRuleConfig || createDefaultStackRuleConfig();
  };

  const calculateDiscountPreview = () => {
    if (offerData.discountType === "PERCENTAGE") {
      return `${offerData.discountValue}% off`;
    } else if (offerData.discountType === "FIXED_AMOUNT") {
      return `₹${offerData.discountValue} off`;
    } else if (offerData.discountType === "FREE_SHIPPING") {
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
          
        </div>
        
        {/* Offer Type Badge */}
        <Badge 
          variant="outline" 
          className={cn("text-lg px-4 py-2", currentConfig.color)}
        >
          <span className="flex items-center gap-2">
            {currentConfig.icon}
            {offerData.type.replace(/_/g, ' ')}
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
          <TabsList className="grid grid-cols-4 mb-8 w-full max-w-2xl mx-auto h-auto">
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
                        <Label htmlFor="title" className="flex items-center gap-2">
                          Offer Title *
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </Label>
                        <Input
                          id="title"
                          value={offerData.title}
                          onChange={(e) =>
                            setOfferData({ ...offerData, title: e.target.value })
                          }
                          placeholder="Summer Sale 2024"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Offer Type *</Label>
                        <Select
                          value={offerData.type}
                          onValueChange={(value: OfferType) =>
                            setOfferData({ ...offerData, type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="REGULAR_DISCOUNT" className="flex items-center gap-2">
                              <Tag className="h-4 w-4" />
                              Regular Discount
                            </SelectItem>
                            <SelectItem value="VOUCHER" className="flex items-center gap-2">
                              <Ticket className="h-4 w-4" />
                              Voucher
                            </SelectItem>
                            <SelectItem value="COUNTDOWN_DEAL" className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Countdown Deal
                            </SelectItem>
                            <SelectItem value="FLASH_SALE" className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Flash Sale
                            </SelectItem>
                            <SelectItem value="BUY_X_GET_Y" className="flex items-center gap-2">
                              <Gift className="h-4 w-4" />
                              Buy X Get Y
                            </SelectItem>
                            <SelectItem value="FREE_SHIPPING" className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              Free Shipping
                            </SelectItem>
                            <SelectItem value="BUNDLE_DEAL" className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Bundle Deal
                            </SelectItem>
                            <SelectItem value="SEASONAL_SALE" className="flex items-center gap-2">
                              <Sun className="h-4 w-4" />
                              Seasonal Sale
                            </SelectItem>
                            <SelectItem value="LOYALTY_REWARD" className="flex items-center gap-2">
                              <Award className="h-4 w-4" />
                              Loyalty Reward
                            </SelectItem>
                            <SelectItem value="REFERRAL_BONUS" className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Referral Bonus
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={offerData.description}
                        onChange={(e) =>
                          setOfferData({ ...offerData, description: e.target.value })
                        }
                        placeholder="Describe the offer details, benefits, and any important information for customers..."
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={offerData.category}
                          onValueChange={(value: any) =>
                            setOfferData({ ...offerData, category: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OFFER_CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>
                                {category.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="priority"
                            type="number"
                            min="1"
                            max="10"
                            value={offerData.priority}
                            onChange={(e) =>
                              setOfferData({ ...offerData, priority: parseInt(e.target.value) })
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
                                style={{ width: `${((offerData.priority ?? 1) / 10) * 100}%` }}
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
                          <Label htmlFor="voucherCode">Voucher Code</Label>
                          <Input
                            id="voucherCode"
                            value={getVoucherConfig().code || ""}
                            onChange={(e) =>
                              setOfferData({
                                ...offerData,
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
                              <Label htmlFor="isPublic" className="text-sm">Public Voucher</Label>
                              <Switch
                                id="isPublic"
                                checked={getVoucherConfig().isPublic ?? true}
                                onCheckedChange={(checked) =>
                                  setOfferData({
                                    ...offerData,
                                    voucherConfig: {
                                      ...getVoucherConfig(),
                                      isPublic: checked,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="firstTimeOnly" className="text-sm">First-time customers only</Label>
                              <Switch
                                id="firstTimeOnly"
                                checked={getVoucherConfig().firstTimeOnly ?? false}
                                onCheckedChange={(checked) =>
                                  setOfferData({
                                    ...offerData,
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
                          <Label htmlFor="countdownEnds">Countdown End *</Label>
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
                                  setOfferData({
                                    ...offerData,
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
                          <Label htmlFor="quantityLimit">Quantity Limit</Label>
                          <Input
                            id="quantityLimit"
                            type="number"
                            min="1"
                            value={getCountdownConfig().quantityLimit || ""}
                            onChange={(e) =>
                              setOfferData({
                                ...offerData,
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
                          <Label htmlFor="urgencyText">Urgency Text</Label>
                          <Input
                            id="urgencyText"
                            value={getCountdownConfig().urgencyText || ""}
                            onChange={(e) =>
                              setOfferData({
                                ...offerData,
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
                          <Label htmlFor="scarcityText">Scarcity Text</Label>
                          <Input
                            id="scarcityText"
                            value={getCountdownConfig().scarcityText || ""}
                            onChange={(e) =>
                              setOfferData({
                                ...offerData,
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
                      Add a banner to make your offer stand out
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
                            id="banner-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleBannerImageChange}
                            className="hidden"
                          />
                          <label htmlFor="banner-upload" className="cursor-pointer">
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
                    {offerData.discountValue > 0 && (
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">
                            {calculateDiscountPreview()}
                          </div>
                          {(offerData.minOrderAmount ?? 0) > 0 && (
                            <div className="text-sm text-muted-foreground mt-2">
                              on orders above ₹{offerData.minOrderAmount ?? 0}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="discountType">Discount Type *</Label>
                        <Select
                          value={offerData.discountType}
                          onValueChange={(value: DiscountType) =>
                            setOfferData({ ...offerData, discountType: value })
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
                                  {type === "FREE_SHIPPING" && <Truck className="h-4 w-4" />}
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
                        <Label htmlFor="discountValue">
                          {offerData.discountType === "PERCENTAGE" 
                            ? "Discount Percentage *" 
                            : offerData.discountType === "FIXED_AMOUNT"
                            ? "Discount Amount *"
                            : "Discount Value"}
                        </Label>
                        <div className="relative">
                          {offerData.discountType === "PERCENTAGE" ? (
                            <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          ) : (
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          )}
                          <Input
                            id="discountValue"
                            type="number"
                            min="0"
                            step={offerData.discountType === "PERCENTAGE" ? "1" : "0.01"}
                            value={offerData.discountValue}
                            onChange={(e) =>
                              setOfferData({ ...offerData, discountValue: parseFloat(e.target.value) || 0 })
                            }
                            className="pl-10"
                            required={offerData.discountType !== "BUY_X_GET_Y"}
                          />
                        </div>
                        {offerData.discountType === "PERCENTAGE" && offerData.discountValue > 100 && (
                          <p className="text-xs text-destructive">
                            Discount percentage cannot exceed 100%
                          </p>
                        )}
                      </div>
                    </div>

                    {currentConfig.showMaxDiscount && offerData.discountType === "PERCENTAGE" && (
                      <div className="space-y-2">
                        <Label htmlFor="maxDiscountAmount">Maximum Discount Amount</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            id="maxDiscountAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={offerData.maxDiscountAmount || ""}
                            onChange={(e) =>
                              setOfferData({ 
                                ...offerData, 
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
                      <Label htmlFor="minOrderAmount">Minimum Order Amount</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="minOrderAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={offerData.minOrderAmount}
                          onChange={(e) =>
                            setOfferData({ ...offerData, minOrderAmount: parseFloat(e.target.value) || 0 })
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
                          <Label htmlFor="buyProductId">Buy Product ID *</Label>
                          <Input
                            id="buyProductId"
                            value={getBuyXGetYConfig().buyProductId}
                            onChange={(e) =>
                              setOfferData({
                                ...offerData,
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
                          <Label htmlFor="buyQuantity">Buy Quantity *</Label>
                          <Input
                            id="buyQuantity"
                            type="number"
                            min="1"
                            value={getBuyXGetYConfig().buyQuantity}
                            onChange={(e) =>
                              setOfferData({
                                ...offerData,
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
                          <Label htmlFor="getProductId">Get Product ID *</Label>
                          <Input
                            id="getProductId"
                            value={getBuyXGetYConfig().getProductId}
                            onChange={(e) =>
                              setOfferData({
                                ...offerData,
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
                          <Label htmlFor="getQuantity">Get Quantity *</Label>
                          <Input
                            id="getQuantity"
                            type="number"
                            min="1"
                            value={getBuyXGetYConfig().getQuantity}
                            onChange={(e) =>
                              setOfferData({
                                ...offerData,
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
                      <Truck className="h-4 w-4 text-purple-500 mt-0.5" />
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
                                !offerData.validFrom && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {offerData.validFrom ? (
                                format(new Date(offerData.validFrom), "PPP p")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={new Date(offerData.validFrom)}
                              onSelect={(date) =>
                                setOfferData({ ...offerData, validFrom: date?.toISOString() || new Date().toISOString() })
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
                                !offerData.validTo && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {offerData.validTo ? (
                                format(new Date(offerData.validTo), "PPP p")
                              ) : (
                                <span>No expiry</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={offerData.validTo ? new Date(offerData.validTo) : undefined}
                              onSelect={(date) =>
                                setOfferData({ ...offerData, validTo: date?.toISOString() })
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    {offerData.validTo && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Offer will be active for {Math.ceil((new Date(offerData.validTo).getTime() - new Date(offerData.validFrom).getTime()) / (1000 * 60 * 60 * 24))} days
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
                          <Label htmlFor="totalUsageLimit">Total Usage Limit</Label>
                          <Input
                            id="totalUsageLimit"
                            type="number"
                            min="0"
                            value={offerData.totalUsageLimit || ""}
                            onChange={(e) =>
                              setOfferData({
                                ...offerData,
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
                          <Label htmlFor="userUsageLimit">Usage Limit Per User *</Label>
                          <Input
                            id="userUsageLimit"
                            type="number"
                            min="1"
                            value={offerData.userUsageLimit}
                            onChange={(e) =>
                              setOfferData({ ...offerData, userUsageLimit: parseInt(e.target.value) || 1 })
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
                          <Label htmlFor="canCombine" className="text-base">
                            Can combine with other offers
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Allow this offer to be used together with other active offers
                          </p>
                        </div>
                        <Switch
                          id="canCombine"
                          checked={getStackRuleConfig().canCombineWithOtherOffers}
                          onCheckedChange={(checked) =>
                            setOfferData({
                              ...offerData,
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
                          <Label htmlFor="maxStackCount">Maximum Stack Count</Label>
                          <Input
                            id="maxStackCount"
                            type="number"
                            min="1"
                            max="10"
                            value={getStackRuleConfig().maxStackCount}
                            onChange={(e) =>
                              setOfferData({
                                ...offerData,
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
                        <Label htmlFor="applicableToAll" className="text-base">
                          Applicable to All Products
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Apply this offer to all products in your store
                        </p>
                      </div>
                      <Switch
                        id="applicableToAll"
                        checked={offerData.applicableToAll}
                        onCheckedChange={(checked) =>
                          setOfferData({ ...offerData, applicableToAll: checked })
                        }
                      />
                    </div>

                    {!offerData.applicableToAll && (
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
                        <Label htmlFor="isPublic" className="text-base">
                          Public Offer
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Make this offer visible to all customers
                        </p>
                      </div>
                      <Switch
                        id="isPublic"
                        checked={offerData.isPublic}
                        onCheckedChange={(checked) =>
                          setOfferData({ ...offerData, isPublic: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Offer Status</Label>
                      <Select
                        value={offerData.status}
                        onValueChange={(value: any) =>
                          setOfferData({ ...offerData, status: value })
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
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Set the initial status for this offer
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
                      <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
                      <Textarea
                        id="termsAndConditions"
                        value={offerData.termsAndConditions || ""}
                        onChange={(e) =>
                          setOfferData({ ...offerData, termsAndConditions: e.target.value })
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
                        <span className="text-sm font-medium">{offerData.type.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Discount</span>
                        <span className="text-sm font-medium">{calculateDiscountPreview()}</span>
                      </div>
                      {(offerData.minOrderAmount ?? 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Min. Order</span>
                          <span className="text-sm font-medium">₹{offerData.minOrderAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Validity</span>
                        <span className="text-sm font-medium">
                          {offerData.validTo 
                            ? `${Math.ceil((new Date(offerData.validTo).getTime() - new Date(offerData.validFrom).getTime()) / (1000 * 60 * 60 * 24))} days`
                            : 'No expiry'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Products</span>
                        <span className="text-sm font-medium">
                          {offerData.applicableToAll ? 'All Products' : `${targetProductIds.length} selected`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ready to Create</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {!offerData.title && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <X className="h-4 w-4" />
                          <span>Offer title is required</span>
                        </div>
                      )}
                      {!offerData.discountValue && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <X className="h-4 w-4" />
                          <span>Discount value is required</span>
                        </div>
                      )}
                      {offerData.title && offerData.discountValue && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Check className="h-4 w-4" />
                          <span>All requirements met</span>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={isLoading || !offerData.title || !offerData.discountValue}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Creating Offer...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Create Offer
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