import React, { useState } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  Edit2, 
  Info, 
  MoreVertical,
  AlertCircle,
  Eye,
  Copy,
  Package,
  Tag,
  Trash2
} from "lucide-react";
import { Product, ProductVariant } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  selectedProducts: { [productId: string]: boolean };
  onSelectAll: (checked: boolean) => void;
  onSelectProduct: (productId: string, checked: boolean) => void;
  onEditPrice: (
    productId: string,
    variant: ProductVariant,
    productName: string
  ) => void;
  onEditSpecialPrice: (
    productId: string,
    variant: ProductVariant,
    productName: string
  ) => void;
  onEditStock: (
    productId: string,
    variant: ProductVariant,
    productName: string
  ) => void;
  onDeleteProduct?: (productId: string) => void;
  contentSummary?: {
    products: Array<{
      productId: string;
      needsImprovement: boolean;
      issues: string[];
    }>;
  };
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  isLoading,
  selectedProducts,
  onSelectAll,
  onSelectProduct,
  onEditPrice,
  onEditSpecialPrice,
  onEditStock,
  onDeleteProduct,
  contentSummary,
}) => {
  const [expandedProducts, setExpandedProducts] = useState<{
    [productId: string]: boolean;
  }>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<{
    [productId: string]: boolean;
  }>({});
  
  const router = useRouter();

  const toggleExpand = (productId: string) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleEditProduct = (productId: string) => {
    // Navigate to edit page
    router.push(`/vendor-dashboard/products/${productId}/edit`);
  };

  const handleDeleteClick = (productId: string) => {
    setDeleteDialogOpen(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  const handleConfirmDelete = (productId: string) => {
    if (onDeleteProduct) {
      onDeleteProduct(productId);
    }
    setDeleteDialogOpen(prev => ({
      ...prev,
      [productId]: false
    }));
  };

  const handleCancelDelete = (productId: string) => {
    setDeleteDialogOpen(prev => ({
      ...prev,
      [productId]: false
    }));
  };

  const allSelected =
    products.length > 0 &&
    products.every((product) => selectedProducts[product.id]);

  const getContentInfo = (productId: string) => {
    return contentSummary?.products?.find((p) => p.productId === productId);
  };

  const formatPrice = (price: number) => {
    return `৳${price.toLocaleString("en-BD")}`;
  };

  const calculateDiscount = (price: number, specialPrice: number) => {
    return Math.round(((price - specialPrice) / price) * 100);
  };

  const truncateText = (text: string, maxLength: number = 25) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getProductImage = (product: Product) => {
    // Try variant images first, then product images
    const variantImage = product.variants[0]?.images?.[0]?.url;
    const productImage = product.images?.[0]?.url;
    return variantImage || productImage || "/placeholder.png";
  };

  const getVariantImage = (variant: ProductVariant, product: Product) => {
    return variant.images?.[0]?.url || getProductImage(product);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800 border-green-200";
      case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "DRAFT": return "bg-gray-100 text-gray-800 border-gray-200";
      case "REJECTED": return "bg-red-100 text-red-800 border-red-200";
      case "INACTIVE": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Try adjusting your filters or add new products to your store
        </p>
        <Button 
          className="mt-4 bg-teal-600 hover:bg-teal-700"
          onClick={() => router.push("/vendor-dashboard/products/new")}
        >
          Add New Product
        </Button>
      </div>
    );
  }

  // Minimum table width for mobile scroll
  const tableWidth = Math.max(800, products.length > 0 ? 1000 : 800);

  return (
    <TooltipProvider>
      <div className="relative">
        {/* Horizontal scroll indicator for mobile */}
        <div className="md:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent pointer-events-none z-10 flex items-center justify-center">
          <div className="animate-bounce">
            <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-hidden" style={{ minWidth: `${tableWidth}px` }}>
          <table className="w-full min-w-full">
            <thead className="bg-teal-50 border-b border-teal-100 sticky top-0 z-20">
              <tr>
                <th className="w-12 px-4 py-4 sticky left-0 bg-teal-50 z-30">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                    className="border-teal-300 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                  />
                </th>
                <th className="w-12 px-4 py-4">
                  <span className="sr-only">Expand</span>
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-teal-700 uppercase tracking-wider min-w-[280px]">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Product</span>
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-teal-700 uppercase tracking-wider min-w-[180px]">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span>Price</span>
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-teal-700 uppercase tracking-wider min-w-[120px]">
                  Stock
                </th>
                <th className="px-4 py-4 text-center text-xs font-medium text-teal-700 uppercase tracking-wider min-w-[120px]">
                  Status
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-teal-700 uppercase tracking-wider min-w-[140px]">
                  Content
                </th>
                <th className="px-4 py-4 text-right text-xs font-medium text-teal-700 uppercase tracking-wider min-w-[120px] sticky right-0 bg-teal-50 z-30">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-50">
              {products.map((product) => {
                const isExpanded = expandedProducts[product.id];
                const contentInfo = getContentInfo(product.id);
                const hasMultipleVariants = product.variants.length > 1;
                const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
                const minPrice = Math.min(...product.variants.map(v => v.price));
                const maxPrice = Math.max(...product.variants.map(v => v.price));
                const hasSpecialPrice = product.variants.some(v => v.specialPrice);

                return (
                  <React.Fragment key={product.id}>
                    {/* Main Product Row */}
                    <tr className="hover:bg-teal-50/50 transition-colors">
                      <td className="px-4 py-4 sticky left-0 bg-white z-20">
                        <Checkbox
                          checked={selectedProducts[product.id] || false}
                          onCheckedChange={(checked) => 
                            onSelectProduct(product.id, checked as boolean)
                          }
                          className="border-teal-300 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                        />
                      </td>
                      <td className="px-4 py-4">
                        {hasMultipleVariants && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(product.id)}
                            className="h-8 w-8 p-0 hover:bg-teal-100"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-teal-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-teal-600" />
                            )}
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-4 min-w-[280px]">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <img
                              src={getProductImage(product)}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg border border-teal-100"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.png";
                              }}
                            />
                            {hasMultipleVariants && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center">
                                {product.variants.length}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-sm font-medium text-gray-900 truncate hover:text-clip cursor-help">
                                  {truncateText(product.name)}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="font-medium">{product.name}</p>
                                <p className="text-xs text-gray-500 mt-1">ID: {product.id}</p>
                              </TooltipContent>
                            </Tooltip>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-teal-600 font-medium">
                                ID: {product.id.slice(0, 8)}...
                              </span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getStatusColor(product.approvalStatus)}`}
                              >
                                {product.approvalStatus}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 min-w-[180px]">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {hasMultipleVariants ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-teal-700 cursor-help">
                                    {formatPrice(minPrice)} - {formatPrice(maxPrice)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Price range across {product.variants.length} variants</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{formatPrice(product.variants[0].price)}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    onEditPrice(
                                      product.id,
                                      product.variants[0],
                                      product.name
                                    )
                                  }
                                  className="h-6 w-6 p-0 hover:bg-teal-100"
                                >
                                  <Edit2 className="h-3.5 w-3.5 text-teal-600" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {hasSpecialPrice && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-teal-600 cursor-help">
                                  Special prices available
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Some variants have special discounted prices</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          {hasMultipleVariants ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <span className="text-sm font-medium text-gray-900">
                                    {totalStock} total
                                  </span>
                                  <span className="text-xs text-teal-600 ml-1">
                                    ({product.variants.length} variants)
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Total stock across all variants</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <>
                              <span className="text-sm font-medium text-gray-900">
                                {product.variants[0].stock}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onEditStock(
                                    product.id,
                                    product.variants[0],
                                    product.name
                                  )
                                }
                                className="h-6 w-6 p-0 hover:bg-teal-100"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-teal-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 min-w-[120px]">
                        <div className="flex justify-center">
                          <Switch
                            checked={product.approvalStatus === "ACTIVE"}
                            className="data-[state=checked]:bg-teal-600"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 min-w-[140px]">
                        {contentInfo?.needsImprovement ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 cursor-help">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                <span className="text-xs text-amber-700">
                                  Needs improvement
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">Content Issues:</p>
                                <ul className="text-sm list-disc list-inside space-y-1">
                                  {contentInfo.issues.map((issue, idx) => (
                                    <li key={idx}>{issue}</li>
                                  ))}
                                </ul>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-teal-500 rounded-full"></div>
                            <span className="text-xs text-teal-700">Good</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 min-w-[120px] sticky right-0 bg-white z-20">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem 
                                className="cursor-pointer text-teal-700"
                                onClick={() => handleEditProduct(product.id)}
                              >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit Product
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              <AlertDialog open={deleteDialogOpen[product.id] || false} onOpenChange={(open) => handleCancelDelete(product.id)}>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      handleDeleteClick(product.id);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Product
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the product "{product.name}" and all its variants.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => handleCancelDelete(product.id)}>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleConfirmDelete(product.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>

                    {/* Variant Rows */}
                    {isExpanded && hasMultipleVariants && (
                      <>
                        {product.variants.map((variant) => (
                          <tr
                            key={variant.id}
                            className="bg-teal-50/30 border-l-4 border-teal-200"
                          >
                            <td className="px-4 py-3 sticky left-0 bg-teal-50/30 z-10"></td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 min-w-[280px]">
                              <div className="flex items-center gap-3 pl-12">
                                <img
                                  src={getVariantImage(variant, product)}
                                  alt={variant.sku}
                                  className="w-10 h-10 object-cover rounded-lg border border-teal-100"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/placeholder.png";
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  {variant.name ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <p className="text-sm font-medium text-gray-700 truncate hover:text-clip cursor-help">
                                          {truncateText(variant.name)}
                                        </p>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs">
                                        <p>{variant.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">SKU: {variant.sku}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <p className="text-sm font-medium text-gray-700">
                                      Default Variant
                                    </p>
                                  )}
                                  <p className="text-xs text-teal-600 mt-0.5">
                                    SKU: {variant.sku}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 min-w-[180px]">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatPrice(variant.price)}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      onEditPrice(product.id, variant, product.name)
                                    }
                                    className="h-6 w-6 p-0 hover:bg-teal-100"
                                  >
                                    <Edit2 className="h-3.5 w-3.5 text-teal-600" />
                                  </Button>
                                </div>
                                {variant.specialPrice ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-teal-600">
                                      {formatPrice(variant.specialPrice)}
                                    </span>
                                    <Badge 
                                      variant="outline" 
                                      className="bg-teal-50 text-teal-700 border-teal-200 text-xs"
                                    >
                                      {calculateDiscount(variant.price, variant.specialPrice)}% OFF
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        onEditSpecialPrice(product.id, variant, product.name)
                                      }
                                      className="h-6 w-6 p-0 hover:bg-teal-100"
                                    >
                                      <Edit2 className="h-3.5 w-3.5 text-teal-600" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() =>
                                      onEditSpecialPrice(product.id, variant, product.name)
                                    }
                                    className="h-6 px-0 text-xs text-teal-600 hover:text-teal-700"
                                  >
                                    + Add special price
                                  </Button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 min-w-[120px]">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {variant.stock}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    onEditStock(product.id, variant, product.name)
                                  }
                                  className="h-6 w-6 p-0 hover:bg-teal-100"
                                >
                                  <Edit2 className="h-3.5 w-3.5 text-teal-600" />
                                </Button>
                              </div>
                            </td>
                            <td className="px-4 py-3 min-w-[120px]">
                              <div className="flex justify-center">
                                <Switch
                                  checked={variant.availability === true}
                                  className="data-[state=checked]:bg-teal-600"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3 min-w-[140px]" colSpan={2}></td>
                            <td className="px-4 py-3 sticky right-0 bg-teal-50/30 z-10"></td>
                          </tr>
                        ))}
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile scroll hint */}
        <div className="md:hidden mt-2 px-4">
          <div className="flex items-center justify-center gap-2 text-xs text-teal-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span>Swipe horizontally to view more columns</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ProductTable;