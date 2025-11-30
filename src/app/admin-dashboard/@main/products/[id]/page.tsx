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
  X
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
  const specifications = product.specifications || [];
  const attributeSettings = product.attributeSettings || [];

  // Fix for approval status comparison
  const getStatusVariant = (status: string | undefined) => {
    if (status === 'APPROVED') return 'default';
    if (status === 'PENDING') return 'secondary';
    if (status === 'REJECTED') return 'destructive';
    return 'secondary';
  };

  const getStatusIcon = (status: string | undefined) => {
    if (status === 'APPROVED') return <Check className="h-3.5 w-3.5 mr-1.5" />;
    if (status === 'PENDING') return <Clock className="h-3.5 w-3.5 mr-1.5" />;
    if (status === 'REJECTED') return <X className="h-3.5 w-3.5 mr-1.5" />;
    return null;
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
                <p className="text-sm font-medium bg-gray-50 px-3 py-2 rounded border border-gray-200 text-gray-900">
                  {product.vendor?.storeName || 'N/A'}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Category
                </p>
                <p className="text-sm font-medium bg-gray-50 px-3 py-2 rounded border border-gray-200 text-gray-900">
                  {product.category?.name || 'N/A'}
                </p>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</p>
                <div 
                  className="prose prose-sm max-w-none bg-gray-50 px-4 py-3 rounded border border-gray-200 min-h-[80px] text-sm"
                  dangerouslySetInnerHTML={{ __html: product.description || '<p class="text-gray-400 italic">No description provided</p>' }}
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
                Attributes ({attributeSettings.length})
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
                              <h4 className="font-semibold text-base text-gray-900">{variant.name}</h4>
                            </div>
                            <p className="text-xs text-gray-600 font-mono bg-white px-2 py-1 rounded inline-block border border-gray-200">
                              SKU: {variant.sku}
                            </p>
                          </div>
                          <Badge variant={variant.stock > 0 ? 'default' : 'destructive'} className="text-xs px-2.5 py-0.5 font-medium">
                            {variant.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">Price</p>
                            <p className="text-lg font-semibold text-gray-900">৳{variant.price.toFixed(2)}</p>
                          </div>
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">Stock</p>
                            <p className="text-lg font-semibold text-gray-900">{variant.stock}</p>
                          </div>
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">Weight</p>
                            <p className="text-lg font-semibold text-gray-900">{variant.weight}kg</p>
                          </div>
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">Images</p>
                            <p className="text-lg font-semibold text-gray-900">{variant.images?.length || 0}</p>
                          </div>
                        </div>

                        {variant.attributes && variant.attributes.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Attributes</p>
                            <div className="flex flex-wrap gap-1.5">
                              {variant.attributes.map((attr) => (
                                <Badge key={attr.id} variant="secondary" className="text-xs px-2 py-0.5">
                                  {attr.attributeValue?.value || 'N/A'}
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
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
                <h3 className="text-base font-semibold text-gray-900 mb-4">Specifications</h3>
                {specifications.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Info className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No specifications available</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {specifications.map((spec, index) => (
                      <div key={spec.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-white bg-gray-700 px-2 py-1 rounded">
                            #{index + 1}
                          </span>
                          <span className="font-medium text-sm text-gray-900">{spec.specification?.name || 'Unknown'}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700 bg-white px-4 py-2 rounded border border-gray-200">
                          {spec.valueString || spec.valueNumber || 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Attributes Tab */}
            <TabsContent value="attributes" className="mt-5">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Attribute Settings</h3>
                {attributeSettings.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Tag className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No attribute settings available</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attributeSettings.map((setting, index) => (
                      <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-white bg-gray-700 px-2 py-1 rounded">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{setting.attribute?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {setting.attributeId}</p>
                          </div>
                        </div>
                        <Badge variant={setting.isVariant ? 'default' : 'secondary'} className="text-xs px-2.5 py-0.5 font-medium">
                          {setting.isVariant ? 'Variant' : 'Product'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Timestamps */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}