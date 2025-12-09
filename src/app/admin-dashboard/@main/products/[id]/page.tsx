// app/admin/products/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetProductByIdQuery } from '@/features/productApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  Package, 
  Store, 
  Tag, 
  DollarSign, 
  Box,
  Image as ImageIcon,
  Video,
  Info,
  Calendar,
  Check,
  Clock,
  X,
  Shield,
  Truck,
  Scale,
  AlertTriangle
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { data: product, isLoading, error } = useGetProductByIdQuery(productId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Not Found</h2>
          <Button onClick={() => router.back()} variant="outline">Go Back</Button>
        </div>
      </div>
    );
  }

  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
  const avgPrice = product.variants?.length 
    ? product.variants.reduce((sum, v) => sum + v.price, 0) / product.variants.length 
    : 0;

  const images = product.images || [];
  const variants = product.variants || [];
  
  // Get specifications (attributes with isForVariant: false)
  const specifications = product.attributes?.filter(attr => !attr.isForVariant) || [];
  
  // Get variant attribute settings (attributes with isForVariant: true)
  const variantAttributes = product.attributes?.filter(attr => attr.isForVariant) || [];

  // Helper function to get attribute display value
  const getAttributeDisplayValue = (attr: any) => {
    if (attr.valueString) return attr.valueString;
    if (attr.valueNumber !== undefined && attr.valueNumber !== null) return attr.valueNumber;
    if (attr.valueBoolean !== undefined && attr.valueBoolean !== null) 
      return attr.valueBoolean ? 'Yes' : 'No';
    if (attr.attributeValue) return attr.attributeValue.value;
    return 'N/A';
  };

  // Helper function to get attribute unit
  const getAttributeUnit = (attr: any) => {
    return attr.attribute?.unit || '';
  };

  const getStatusVariant = (status: string | undefined) => {
    if (status === 'ACTIVE') return 'default';
    if (status === 'PENDING') return 'secondary';
    if (status === 'REJECTED') return 'destructive';
    return 'secondary';
  };

  const getStatusIcon = (status: string | undefined) => {
    if (status === 'ACTIVE') return <Check className="h-3.5 w-3.5 mr-1.5" />;
    if (status === 'PENDING') return <Clock className="h-3.5 w-3.5 mr-1.5" />;
    if (status === 'REJECTED') return <X className="h-3.5 w-3.5 mr-1.5" />;
    return null;
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{product.name}</h1>
                <p className="text-xs text-gray-500 mt-0.5">ID: {product.id}</p>
              </div>
            </div>
            
            <Badge 
              variant={getStatusVariant(product.approvalStatus)}
              className="px-3 py-1 text-xs font-medium"
            >
              {getStatusIcon(product.approvalStatus)}
              {product.approvalStatus || 'PENDING'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Box className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total Stock</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalStock}</p>
              <p className="text-xs text-gray-500 mt-1">units available</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Avg Price</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">৳{avgPrice.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">per unit</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Package className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Variants</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{variants.length}</p>
              <p className="text-xs text-gray-500 mt-1">configurations</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <ImageIcon className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Images</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{images.length}</p>
              <p className="text-xs text-gray-500 mt-1">media files</p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Product ID</p>
                <p className="font-mono text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200 text-gray-700">
                  {product.id}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Slug</p>
                <p className="font-mono text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200 text-gray-700">
                  {product.slug}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5" />
                  Vendor
                </p>
                <div className="text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  <p className="font-medium text-gray-900">{product.vendor?.storeName || 'N/A'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">ID: {product.vendor?.id}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Category
                </p>
                <div className="text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  <p className="font-medium text-gray-900">{product.category?.name || 'N/A'}</p>
                  {product.category?.parent && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Parent: {product.category.parent.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</p>
                <div 
                  className="prose prose-sm max-w-none bg-gray-50 px-4 py-3 rounded border border-gray-200 min-h-[80px] text-sm"
                  dangerouslySetInnerHTML={{ 
                    __html: product.description || '<p class="text-gray-400 italic">No description provided</p>' 
                  }}
                />
              </div>

              {product.videoUrl && (
                <div className="md:col-span-2 space-y-1.5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5" />
                    Video URL
                  </p>
                  <a 
                    href={product.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 px-3 py-2 rounded border border-blue-200 block break-all transition-colors"
                  >
                    {product.videoUrl}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Warranty & Shipping Information */}
          {product.warranty && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Warranty & Shipping</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    Warranty
                  </p>
                  <p className="text-sm font-medium bg-gray-50 px-3 py-2 rounded border border-gray-200 text-gray-900">
                    {formatWarranty(product.warranty)}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" />
                    Package Dimensions
                  </p>
                  <p className="text-sm font-medium bg-gray-50 px-3 py-2 rounded border border-gray-200 text-gray-900">
                    {product.warranty.packageLength} × {product.warranty.packageWidth} × {product.warranty.packageHeight} cm
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5" />
                    Package Weight
                  </p>
                  <p className="text-sm font-medium bg-gray-50 px-3 py-2 rounded border border-gray-200 text-gray-900">
                    {product.warranty.packageWeightValue} {product.warranty.packageWeightUnit.toLowerCase()}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Dangerous Goods
                  </p>
                  <Badge 
                    variant={product.warranty.dangerousGoods === 'CONTAINS' ? 'destructive' : 'secondary'}
                    className="text-xs px-2.5 py-0.5 font-medium"
                  >
                    {product.warranty.dangerousGoods === 'CONTAINS' ? 'Contains hazardous materials' : 'None'}
                  </Badge>
                </div>

                {product.warranty.policy && (
                  <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Warranty Policy</p>
                    <div 
                      className="prose prose-sm max-w-none bg-gray-50 px-4 py-3 rounded border border-gray-200 text-sm"
                      dangerouslySetInnerHTML={{ 
                        __html: product.warranty.policy || '<p class="text-gray-400 italic">No policy details</p>' 
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="variants" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-white rounded-lg border border-gray-200">
              <TabsTrigger 
                value="variants" 
                className="data-[state=active]:bg-gray-100 py-2.5 text-sm font-medium transition-colors rounded-md"
              >
                Variants ({variants.length})
              </TabsTrigger>
              <TabsTrigger 
                value="images" 
                className="data-[state=active]:bg-gray-100 py-2.5 text-sm font-medium transition-colors rounded-md"
              >
                Images ({images.length})
              </TabsTrigger>
              <TabsTrigger 
                value="specs" 
                className="data-[state=active]:bg-gray-100 py-2.5 text-sm font-medium transition-colors rounded-md"
              >
                Specs ({specifications.length})
              </TabsTrigger>
              <TabsTrigger 
                value="attributes" 
                className="data-[state=active]:bg-gray-100 py-2.5 text-sm font-medium transition-colors rounded-md"
              >
                Variant Attributes ({variantAttributes.length})
              </TabsTrigger>
            </TabsList>

            {/* Variants Tab */}
            <TabsContent value="variants" className="mt-5">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Product Variants</h3>
                {variants.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Package className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No variants available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {variants.map((variant, index) => (
                      <div key={variant.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-medium text-white bg-gray-700 px-2 py-0.5 rounded">
                                #{index + 1}
                              </span>
                              <h4 className="font-semibold text-base text-gray-900">{variant.name || `Variant ${index + 1}`}</h4>
                            </div>
                            <p className="text-xs text-gray-600 font-mono bg-white px-2 py-1 rounded inline-block border border-gray-200">
                              SKU: {variant.sku}
                            </p>
                          </div>
                          <Badge 
                            variant={variant.stock > 0 ? 'default' : 'destructive'} 
                            className="text-xs px-2.5 py-0.5 font-medium"
                          >
                            {variant.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">Price</p>
                            <p className="text-lg font-semibold text-gray-900">৳{variant.price.toFixed(2)}</p>
                          </div>
                          
                          {variant.specialPrice && (
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <p className="text-xs text-gray-500 font-medium uppercase mb-1">Special Price</p>
                              <div>
                                <p className="text-lg font-semibold text-green-600">৳{variant.specialPrice.toFixed(2)}</p>
                                <p className="text-xs text-gray-500 line-through">৳{variant.price.toFixed(2)}</p>
                              </div>
                            </div>
                          )}

                          <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">Stock</p>
                            <p className="text-lg font-semibold text-gray-900">{variant.stock}</p>
                          </div>
                          
                          {variant.weight && (
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <p className="text-xs text-gray-500 font-medium uppercase mb-1">Weight</p>
                              <p className="text-lg font-semibold text-gray-900">{variant.weight}kg</p>
                            </div>
                          )}

                          <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">Images</p>
                            <p className="text-lg font-semibold text-gray-900">{variant.images?.length || 0}</p>
                          </div>
                        </div>

                        {variant.attributes && variant.attributes.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Variant Attributes</p>
                            <div className="flex flex-wrap gap-1.5">
                              {variant.attributes.map((attr) => (
                                <Badge key={attr.id} variant="secondary" className="text-xs px-2 py-0.5">
                                  {attr.attributeValue?.attribute?.name}: {attr.attributeValue?.value || 'N/A'}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Variant Images */}
                        {variant.images && variant.images.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Variant Images ({variant.images.length})</p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {variant.images.map((img, imgIdx) => (
                                <div key={img.id || imgIdx} className="flex-shrink-0">
                                  <img
                                    src={img.url}
                                    alt={img.altText || `Variant image ${imgIdx + 1}`}
                                    className="w-20 h-20 object-cover rounded border"
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
              </div>
            </TabsContent>

            {/* Images Tab */}
            <TabsContent value="images" className="mt-5">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Product Images</h3>
                {images.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No images available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {images.map((image, index) => (
                      <div key={image.id} className="group">
                        <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors">
                          <img
                            src={image.url}
                            alt={image.altText || `Product image ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded text-xs font-medium shadow">
                            #{index + 1}
                          </div>
                          {image.sortOrder !== undefined && image.sortOrder !== null && (
                            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                              Order: {image.sortOrder}
                            </div>
                          )}
                        </div>
                        {image.altText && (
                          <p className="text-xs text-gray-600 truncate mt-1.5">{image.altText}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Specifications Tab */}
            <TabsContent value="specs" className="mt-5">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Product Specifications</h3>
                {specifications.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Info className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No specifications available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {specifications.map((spec, index) => (
                      <div key={spec.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-white bg-gray-700 px-2 py-0.5 rounded">
                                #{index + 1}
                              </span>
                              <div>
                                <p className="font-medium text-sm text-gray-900">{spec.attribute?.name || 'Unknown Attribute'}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Type: {spec.attribute?.type} • Required: {spec.attribute?.isRequired ? 'Yes' : 'No'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                              <p className="text-sm font-semibold text-gray-800">
                                {getAttributeDisplayValue(spec)}
                                {getAttributeUnit(spec) && <span className="text-gray-500 ml-1">{getAttributeUnit(spec)}</span>}
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
              </div>
            </TabsContent>

            {/* Variant Attributes Tab */}
            <TabsContent value="attributes" className="mt-5">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Variant Attribute Settings</h3>
                {variantAttributes.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Tag className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No variant attributes configured</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {variantAttributes.map((attr, index) => (
                      <div key={attr.id} className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-white bg-blue-600 px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            <div>
                              <h4 className="font-semibold text-sm text-gray-900">{attr.attribute?.name}</h4>
                              <p className="text-xs text-gray-600 mt-0.5">
                                Type: {attr.attribute?.type} • ID: {attr.attributeId}
                              </p>
                            </div>
                          </div>
                          <Badge variant="default" className="text-xs px-2.5 py-0.5 font-medium">
                            Used for Variants
                          </Badge>
                        </div>

                        {attr.attribute?.values && attr.attribute.values.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Available Values ({attr.attribute.values.length})</p>
                            <div className="flex flex-wrap gap-1.5">
                              {attr.attribute.values.map(value => (
                                <Badge 
                                  key={value.id} 
                                  variant="outline"
                                  className="text-xs px-2 py-0.5"
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
              </div>
            </TabsContent>
          </Tabs>

          {/* Reviews Section */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Customer Reviews ({product.reviews.length})</h2>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  Avg. Rating: {(product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)}/5
                </div>
              </div>

              <div className="space-y-4">
                {product.reviews.slice(0, 5).map(review => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{review.user?.name || 'Anonymous'}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps & Admin Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Created At</p>
                  <p className="text-sm font-medium text-gray-900">{new Date(product.createdAt).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Updated At</p>
                  <p className="text-sm font-medium text-gray-900">{new Date(product.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              {product.approvedBy && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Approved By</p>
                    <p className="text-sm font-medium text-gray-900">{product.approvedBy.name}</p>
                    <p className="text-xs text-gray-500">{product.approvedBy.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}