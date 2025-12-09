// components/admin/products/ProductDetailDialog.tsx
'use client';

import type { Product, ProductAttribute } from '@/types/product';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Store, 
  Tag, 
  DollarSign, 
  Box,
  Image as ImageIcon,
  Video,
  Info,
  Calendar,
  Shield,
  Truck,
  Scale,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Eye,
  Settings,
  Layers
} from 'lucide-react';

interface ProductDetailDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailDialog({ product, open, onOpenChange }: ProductDetailDialogProps) {
  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
  const avgPrice = product.variants?.length 
    ? product.variants.reduce((sum, v) => sum + v.price, 0) / product.variants.length 
    : 0;

  // Safe array accessors
  const images = product.images || [];
  const variants = product.variants || [];
  const attributes = product.attributes || [];

  // Separate attributes by type
  const specifications = attributes.filter(attr => !attr.isForVariant);
  const variantAttributes = attributes.filter(attr => attr.isForVariant);

  // Helper function to get attribute display value
  const getAttributeDisplayValue = (attr: ProductAttribute) => {
    if (attr.valueString) return attr.valueString;
    if (attr.valueNumber !== undefined && attr.valueNumber !== null) {
      const unit = attr.attribute?.unit ? ` ${attr.attribute.unit}` : '';
      return `${attr.valueNumber}${unit}`;
    }
    if (attr.valueBoolean !== undefined && attr.valueBoolean !== null) 
      return attr.valueBoolean ? 'Yes' : 'No';
    if (attr.attributeValue) return attr.attributeValue.value;
    return 'N/A';
  };

  // Format warranty duration
  const formatWarranty = (warranty: any) => {
    if (!warranty) return 'No warranty';
    const unitMap: Record<string, string> = {
      'DAYS': 'day',
      'MONTHS': 'month',
      'YEARS': 'year'
    };
    return `${warranty.duration} ${unitMap[warranty.unit] || warranty.unit.toLowerCase()}${warranty.duration > 1 ? 's' : ''} ${warranty.type.toLowerCase()} warranty`;
  };

  // Get status badge configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-3.5 w-3.5 mr-1.5" />,
          text: 'Active'
        };
      case 'PENDING':
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-3.5 w-3.5 mr-1.5" />,
          text: 'Pending'
        };
      case 'REJECTED':
        return {
          variant: 'destructive' as const,
          icon: <X className="h-3.5 w-3.5 mr-1.5" />,
          text: 'Rejected'
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-3.5 w-3.5 mr-1.5" />,
          text: status || 'Pending'
        };
    }
  };

  const statusConfig = getStatusConfig(product.approvalStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Fixed Header - Compact */}
        <DialogHeader className="px-5 pt-5 pb-4 space-y-2 border-b bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              {product.name}
            </DialogTitle>
            <Badge 
              variant={statusConfig.variant}
              className="px-3 py-1.5 text-xs font-semibold flex items-center"
            >
              {statusConfig.icon}
              {statusConfig.text}
            </Badge>
          </div>
          <DialogDescription className="text-sm text-gray-600">
            Complete product information and details
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 h-full">
          <div className="px-5 py-5 space-y-5 pb-8">
            {/* Quick Stats - Compact */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-white/90 mb-2">
                    <Box className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Total Stock</span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-0.5">{totalStock}</p>
                  <p className="text-xs text-white/80">units available</p>
                </div>
              </div>
              
              <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-white/90 mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Avg Price</span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-0.5">৳{avgPrice.toFixed(2)}</p>
                  <p className="text-xs text-white/80">per unit</p>
                </div>
              </div>
              
              <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-white/90 mb-2">
                    <Package className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Variants</span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-0.5">{variants.length}</p>
                  <p className="text-xs text-white/80">configurations</p>
                </div>
              </div>
              
              <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-white/90 mb-2">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Images</span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-0.5">{images.length}</p>
                  <p className="text-xs text-white/80">media files</p>
                </div>
              </div>
            </div>

            {/* Basic Information - Compact */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Product ID</p>
                  <p className="font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 font-medium text-gray-700">
                    {product.id}
                  </p>
                </div>
                
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Slug</p>
                  <p className="font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 font-medium text-gray-700">
                    {product.slug}
                  </p>
                </div>
                
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-green-600" />
                    Vendor
                  </p>
                  <div className="text-sm bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                    <p className="font-semibold text-green-900">{product.vendor?.storeName || 'N/A'}</p>
                    {product.vendor?.id && (
                      <p className="text-xs text-green-700 mt-0.5">ID: {product.vendor.id}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-orange-600" />
                    Category
                  </p>
                  <div className="text-sm bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                    <p className="font-semibold text-orange-900">{product.category?.name || 'N/A'}</p>
                    {product.category?.parent && (
                      <p className="text-xs text-orange-700 mt-0.5">Parent: {product.category.parent.name}</p>
                    )}
                  </div>
                </div>
                
                <div className="lg:col-span-2 space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</p>
                  <div 
                    className="prose prose-sm prose-gray max-w-none bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 min-h-[80px]"
                    dangerouslySetInnerHTML={{ __html: product.description || '<p class="text-gray-500 italic text-sm">No description provided</p>' }}
                  />
                </div>

                {product.videoUrl && (
                  <div className="lg:col-span-2 space-y-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5 text-red-600" />
                      Video URL
                    </p>
                    <a 
                      href={product.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 block break-all transition-all duration-200"
                    >
                      {product.videoUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Warranty & Shipping Information */}
            {product.warranty && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Warranty & Shipping</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-green-600" />
                      Warranty
                    </p>
                    <p className="text-sm font-semibold bg-green-50 px-3 py-2 rounded-lg border border-green-200 text-green-900">
                      {formatWarranty(product.warranty)}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-blue-600" />
                      Package Dimensions
                    </p>
                    <p className="text-sm font-semibold bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 text-blue-900">
                      {product.warranty.packageLength} × {product.warranty.packageWidth} × {product.warranty.packageHeight} cm
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-purple-600" />
                      Package Weight
                    </p>
                    <p className="text-sm font-semibold bg-purple-50 px-3 py-2 rounded-lg border border-purple-200 text-purple-900">
                      {product.warranty.packageWeightValue} {product.warranty.packageWeightUnit.toLowerCase()}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                      Dangerous Goods
                    </p>
                    <Badge 
                      variant={product.warranty.dangerousGoods === 'CONTAINS' ? 'destructive' : 'secondary'}
                      className="text-xs px-3 py-1 font-semibold"
                    >
                      {product.warranty.dangerousGoods === 'CONTAINS' ? 'Contains hazardous materials' : 'None'}
                    </Badge>
                  </div>

                  {product.warranty.policy && (
                    <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Warranty Policy</p>
                      <div 
                        className="prose prose-sm prose-gray max-w-none bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 text-sm"
                        dangerouslySetInnerHTML={{ 
                          __html: product.warranty.policy || '<p class="text-gray-500 italic text-sm">No policy details</p>' 
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tabs for detailed sections - Compact */}
            <Tabs defaultValue="variants" className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-auto p-1.5 bg-gray-100 rounded-lg">
                <TabsTrigger 
                  value="variants" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow py-2.5 text-sm font-semibold transition-all duration-200 rounded-md"
                >
                  Variants
                </TabsTrigger>
                <TabsTrigger 
                  value="images" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow py-2.5 text-sm font-semibold transition-all duration-200 rounded-md"
                >
                  Images
                </TabsTrigger>
                <TabsTrigger 
                  value="specs" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow py-2.5 text-sm font-semibold transition-all duration-200 rounded-md"
                >
                  Specifications
                </TabsTrigger>
                <TabsTrigger 
                  value="variant-attrs" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow py-2.5 text-sm font-semibold transition-all duration-200 rounded-md"
                >
                  Variant Attributes
                </TabsTrigger>
              </TabsList>

              {/* Variants Tab */}
              <TabsContent value="variants" className="space-y-4 mt-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-gray-900">Product Variants</h4>
                  <Badge variant="secondary" className="text-xs px-3 py-1 font-semibold">
                    {variants.length} {variants.length === 1 ? 'variant' : 'variants'}
                  </Badge>
                </div>
                {variants.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No variants available</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {variants.map((variant, index) => (
                      <div key={variant.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-all duration-300">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-bold text-white bg-blue-500 px-2 py-1 rounded-md">#{index + 1}</span>
                              <h5 className="font-bold text-base text-gray-900">{variant.name || `Variant ${index + 1}`}</h5>
                            </div>
                            <p className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded inline-block border border-gray-200">
                              SKU: {variant.sku}
                            </p>
                          </div>
                          <Badge 
                            variant={variant.stock > 0 ? 'default' : 'destructive'} 
                            className="text-xs px-3 py-1 font-semibold"
                          >
                            {variant.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <p className="text-xs text-green-700 font-semibold uppercase tracking-wide mb-1">Price</p>
                            <p className="text-xl font-bold text-green-700">৳{variant.price.toFixed(2)}</p>
                          </div>
                          
                          {variant.specialPrice && (
                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                              <p className="text-xs text-yellow-700 font-semibold uppercase tracking-wide mb-1">Special Price</p>
                              <div>
                                <p className="text-xl font-bold text-yellow-700">৳{variant.specialPrice.toFixed(2)}</p>
                                <p className="text-xs text-yellow-600 line-through">৳{variant.price.toFixed(2)}</p>
                              </div>
                            </div>
                          )}

                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide mb-1">Stock</p>
                            <p className="text-xl font-bold text-blue-700">{variant.stock}</p>
                          </div>
                          
                          {variant.weight && (
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                              <p className="text-xs text-purple-700 font-semibold uppercase tracking-wide mb-1">Weight</p>
                              <p className="text-xl font-bold text-purple-700">{variant.weight}kg</p>
                            </div>
                          )}

                          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                            <p className="text-xs text-orange-700 font-semibold uppercase tracking-wide mb-1">Images</p>
                            <p className="text-xl font-bold text-orange-700">{variant.images?.length || 0}</p>
                          </div>
                        </div>

                        {variant.attributes && variant.attributes.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Variant Attributes
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {variant.attributes.map((attr) => (
                                <Badge key={attr.id} variant="secondary" className="text-xs px-2.5 py-0.5 font-medium">
                                  {attr.attributeValue?.attribute?.name}: {attr.attributeValue?.value || 'N/A'}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Variant Images */}
                        {variant.images && variant.images.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Variant Images ({variant.images.length})
                            </p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {variant.images.map((img, imgIdx) => (
                                <div key={img.id || imgIdx} className="flex-shrink-0">
                                  <img
                                    src={img.url}
                                    alt={img.altText || `Variant image ${imgIdx + 1}`}
                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="space-y-4 mt-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-gray-900">Product Images</h4>
                  <Badge variant="secondary" className="text-xs px-3 py-1 font-semibold">
                    {images.length} {images.length === 1 ? 'image' : 'images'}
                  </Badge>
                </div>
                {images.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No images available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
                    {images.map((image, index) => (
                      <div key={image.id} className="group space-y-2">
                        <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-400">
                          <img
                            src={image.url}
                            alt={image.altText || `Product image ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded-full text-xs font-bold shadow">
                            #{index + 1}
                          </div>
                          {image.sortOrder !== undefined && image.sortOrder !== null && (
                            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                              Order: {image.sortOrder}
                            </div>
                          )}
                        </div>
                        {image.altText && (
                          <p className="text-xs text-gray-700 font-medium truncate px-1">
                            {image.altText}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Specifications Tab (Unified Attributes with isForVariant: false) */}
              <TabsContent value="specs" className="space-y-4 mt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-gray-900">Specifications</h4>
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      <Settings className="h-3 w-3 mr-1" />
                      isForVariant: false
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="text-xs px-3 py-1 font-semibold">
                    {specifications.length} {specifications.length === 1 ? 'specification' : 'specifications'}
                  </Badge>
                </div>
                {specifications.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Layers className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No specifications available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {specifications.map((spec, index) => (
                      <div key={spec.id} className="bg-blue-50 rounded-xl border border-blue-200 p-4 hover:border-blue-400 hover:shadow-sm transition-all duration-300">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold text-white bg-blue-500 px-2 py-0.5 rounded-md">#{index + 1}</span>
                              <div>
                                <p className="font-semibold text-sm text-gray-900">
                                  {spec.attribute?.name || 'Unknown Attribute'}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Type: {spec.attribute?.type} • Required: {spec.attribute?.isRequired ? 'Yes' : 'No'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-2 p-3 bg-white rounded-lg border border-blue-100">
                              <p className="text-sm font-semibold text-gray-800">
                                {getAttributeDisplayValue(spec)}
                              </p>
                              {spec.attributeValue && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Selected from: {spec.attribute?.values?.length || 0} options
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Variant Attributes Tab (Unified Attributes with isForVariant: true) */}
              <TabsContent value="variant-attrs" className="space-y-4 mt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-gray-900">Variant Attributes</h4>
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      <Eye className="h-3 w-3 mr-1" />
                      isForVariant: true
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="text-xs px-3 py-1 font-semibold">
                    {variantAttributes.length} {variantAttributes.length === 1 ? 'attribute' : 'attributes'}
                  </Badge>
                </div>
                {variantAttributes.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No variant attributes configured</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {variantAttributes.map((attr, index) => (
                      <div key={attr.id} className="border border-purple-200 rounded-xl p-4 bg-purple-50 hover:border-purple-400 hover:shadow-sm transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-white bg-purple-500 px-2 py-1 rounded-md">#{index + 1}</span>
                            <div>
                              <h5 className="font-semibold text-sm text-gray-900">{attr.attribute?.name}</h5>
                              <p className="text-xs text-gray-600 mt-0.5">
                                Type: {attr.attribute?.type} • ID: {attr.attributeId}
                              </p>
                            </div>
                          </div>
                          <Badge variant="default" className="text-xs px-3 py-1 font-semibold">
                            Used for Variants
                          </Badge>
                        </div>

                        {/* Attribute Value */}
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Selected Value</p>
                          <div className="p-3 bg-white rounded-lg border border-purple-100">
                            <p className="text-sm font-semibold text-gray-800">
                              {getAttributeDisplayValue(attr)}
                            </p>
                          </div>
                        </div>

                        {/* Available Values (if SELECT type) */}
                        {attr.attribute?.type === 'SELECT' && attr.attribute.values && attr.attribute.values.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Available Values ({attr.attribute.values.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {attr.attribute.values.map(value => (
                                <Badge 
                                  key={value.id} 
                                  variant={value.id === attr.attributeValueId ? "default" : "outline"}
                                  className="text-xs px-2 py-0.5 font-medium"
                                >
                                  {value.value}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Timestamps & Admin Info */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created At</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(product.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Updated At</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(product.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {product.approvedBy && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Approved By</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {product.approvedBy.name}
                      </p>
                      <p className="text-xs text-gray-500">{product.approvedBy.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}