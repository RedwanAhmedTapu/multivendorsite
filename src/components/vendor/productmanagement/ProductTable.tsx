import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  MoreVertical,
  AlertCircle,
  Package,
  Tag,
  Trash2,
  Lock,
  Warehouse,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
  // FIX: stock editing removed entirely — real stock now lives
  // per-warehouse/rack/row/shelf (WarehouseStock), so a single "stock"
  // number here can't be meaningfully edited. We only link out to the
  // Stock Inventory page (adjust `stockInventoryPath` below to match your
  // actual route).
  onResetPriceOverride: (productId: string, variantId: string) => void;
  isResettingPriceOverride?: boolean;
  onDeleteProduct?: (productId: string) => void;
  contentSummary?: {
    products: Array<{
      productId: string;
      needsImprovement: boolean;
      issues: string[];
    }>;
  };
}

// Adjust to match your actual Stock Inventory route.
const stockInventoryPath = "/vendor-dashboard/stock-inventory";
const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e2e8f0'/%3E%3Ctext x='50' y='55' font-size='12' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif'%3ENo Image%3C/text%3E%3C/svg%3E";
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.dataset.fallbackApplied === "true") return;
  img.dataset.fallbackApplied = "true";
  img.src = FALLBACK_IMAGE; 
};
const ProductTable: React.FC<ProductTableProps> = ({
  products,
  isLoading,
  selectedProducts,
  onSelectAll,
  onSelectProduct,
  onEditPrice,
  onEditSpecialPrice,
  onResetPriceOverride,
  isResettingPriceOverride,
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
    router.push(`/vendor-dashboard/products/${productId}/edit`);
  };

  const handleViewStock = (sku: string) => {
    router.push(`${stockInventoryPath}?q=${encodeURIComponent(sku)}`);
  };

  const handleDeleteClick = (productId: string) => {
    setDeleteDialogOpen((prev) => ({ ...prev, [productId]: true }));
  };

  const handleConfirmDelete = (productId: string) => {
    if (onDeleteProduct) onDeleteProduct(productId);
    setDeleteDialogOpen((prev) => ({ ...prev, [productId]: false }));
  };

  const handleCancelDelete = (productId: string) => {
    setDeleteDialogOpen((prev) => ({ ...prev, [productId]: false }));
  };

  const allSelected =
    products.length > 0 &&
    products.every((product) => selectedProducts[product.id]);

  const getContentInfo = (productId: string) => {
    return contentSummary?.products?.find((p) => p.productId === productId);
  };

  const formatPrice = (price: number) => `৳${price.toLocaleString("en-BD")}`;

  const calculateDiscount = (price: number, specialPrice: number) =>
    Math.round(((price - specialPrice) / price) * 100);

  const truncateText = (text: string, maxLength: number = 25) =>
    text.length <= maxLength ? text : text.substring(0, maxLength) + "...";

  const getProductImage = (product: Product) => {
    const variantImage = product.variants[0]?.images?.[0]?.url;
    const productImage = product.images?.[0]?.url;
    return variantImage || productImage || "/placeholder.png";
  };

  const getVariantImage = (variant: ProductVariant, product: Product) =>
    variant.images?.[0]?.url || getProductImage(product);

  // FIX: status colors aligned with Stock Inventory's badge palette
  // (amber/rose/slate/emerald with matching border tones).
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "DRAFT":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "INACTIVE":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  /** "Manually locked" badge + unlock action — shown wherever a variant's
   * price/specialPrice was hand-edited and is no longer auto-synced from
   * purchase receiving. See resetPriceOverride mutation. */
  const PriceLockBadge = ({ productId, variant }: { productId: string; variant: ProductVariant }) => {
    if (!variant.priceManuallyOverridden) return null;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onResetPriceOverride(productId, variant.id)}
            disabled={isResettingPriceOverride}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            <Lock size={9} /> Locked
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[220px] text-xs">
          Price won't auto-update from future purchase receipts. Click to unlock.
        </TooltipContent>
      </Tooltip>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
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

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 bg-cyan-50 rounded-full flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6 text-cyan-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">No products found</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          Try adjusting your filters or add new products to your store
        </p>
        <Button
          className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-xl shadow-sm shadow-blue-200"
          onClick={() => router.push("/vendor-dashboard/products/new")}
        >
          Add New Product
        </Button>
      </div>
    );
  }

  const tableWidth = Math.max(800, products.length > 0 ? 1000 : 800);

  return (
    <TooltipProvider>
      <div className="relative">
        <div className="md:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent pointer-events-none z-10 flex items-center justify-center">
          <div className="animate-bounce">
            <ChevronRight className="w-5 h-5 text-cyan-500" />
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-hidden" style={{ minWidth: `${tableWidth}px` }}>
          <table className="w-full min-w-full border-separate border-spacing-0">
            <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-20">
              <tr>
                <th className="w-12 px-4 py-3.5 sticky left-0 bg-slate-50/80 z-30">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                    className="border-cyan-300 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                  />
                </th>
                <th className="w-12 px-4 py-3.5">
                  <span className="sr-only">Expand</span>
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-widest min-w-[280px]">
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" />
                    <span>Product</span>
                  </div>
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-widest min-w-[190px]">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Price</span>
                  </div>
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-widest min-w-[130px]">
                  Stock
                </th>
                <th className="px-4 py-3.5 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-widest min-w-[120px]">
                  Status
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-widest min-w-[140px]">
                  Content
                </th>
                <th className="px-4 py-3.5 text-right text-[10px] font-extrabold text-slate-500 uppercase tracking-widest min-w-[120px] sticky right-0 bg-slate-50/80 z-30">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isExpanded = expandedProducts[product.id];
                const contentInfo = getContentInfo(product.id);
                const hasMultipleVariants = product.variants.length > 1;
                const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
                const minPrice = Math.min(...product.variants.map((v) => v.price));
                const maxPrice = Math.max(...product.variants.map((v) => v.price));
                const hasSpecialPrice = product.variants.some((v) => v.specialPrice);
                const rowCell = "px-4 py-3.5 border-y border-x-0 border-slate-100";

                return (
                  <React.Fragment key={product.id}>
                    {/* Main Product Row */}
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className={`${rowCell} sticky left-0 bg-white z-10`}>
                        <Checkbox
                          checked={selectedProducts[product.id] || false}
                          onCheckedChange={(checked) => onSelectProduct(product.id, checked as boolean)}
                          className="border-cyan-300 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                        />
                      </td>
                      <td className={rowCell}>
                        {hasMultipleVariants && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(product.id)}
                            className="h-8 w-8 p-0 hover:bg-cyan-50 rounded-xl"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-cyan-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-cyan-600" />
                            )}
                          </Button>
                        )}
                      </td>
                      <td className={`${rowCell} min-w-[280px]`}>
                        <div className="flex items-center gap-2.5">
                          <div className="relative flex-shrink-0">
                            <img
                              src={getProductImage(product)}
                              alt={product.name}
                              className="w-9 h-9 object-cover rounded-xl border border-slate-200"
                             onError={handleImageError}
                            />
                            {hasMultipleVariants && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                                {product.variants.length}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-xs font-bold text-slate-700 truncate cursor-help">
                                  {truncateText(product.name)}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="font-medium">{product.name}</p>
                                <p className="text-xs text-slate-400 mt-1">ID: {product.id}</p>
                              </TooltipContent>
                            </Tooltip>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-cyan-600 font-semibold">
                                ID: {product.id.slice(0, 8)}...
                              </span>
                              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${getStatusColor(product.approvalStatus)}`}>
                                {product.approvalStatus}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`${rowCell} min-w-[190px]`}>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-slate-800">
                            {hasMultipleVariants ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-cyan-700 cursor-help">
                                    {formatPrice(minPrice)} - {formatPrice(maxPrice)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Price range across {product.variants.length} variants</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono">{formatPrice(product.variants[0].price)}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditPrice(product.id, product.variants[0], product.name)}
                                  className="h-6 w-6 p-0 hover:bg-cyan-50 rounded-lg"
                                >
                                  <Edit2 className="h-3.5 w-3.5 text-cyan-600" />
                                </Button>
                                <PriceLockBadge productId={product.id} variant={product.variants[0]} />
                              </div>
                            )}
                          </div>
                          {hasSpecialPrice && (
                            <span className="text-[10px] text-cyan-600">Special prices available</span>
                          )}
                        </div>
                      </td>
                      <td className={`${rowCell} min-w-[130px]`}>
                        {/* Read-only aggregate stock — actual adjustments happen
                            on the Stock Inventory page (warehouse/rack-aware). */}
                        <div className="flex items-center gap-2">
                          {hasMultipleVariants ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <span className="text-xs font-bold text-slate-700">{totalStock} total</span>
                                  <span className="text-[10px] text-cyan-600 ml-1">
                                    ({product.variants.length})
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Total stock across all variants</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs font-bold text-slate-700">{product.variants[0].stock}</span>
                          )}
                          {!hasMultipleVariants && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleViewStock(product.variants[0].sku)}
                                  className="h-6 w-6 flex items-center justify-center hover:bg-cyan-50 rounded-lg text-cyan-600"
                                >
                                  <Warehouse className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Manage in Stock Inventory</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      <td className={`${rowCell} min-w-[120px]`}>
                        <div className="flex justify-center">
                          <Switch
                            checked={product.approvalStatus === "ACTIVE"}
                            className="data-[state=checked]:bg-cyan-600"
                          />
                        </div>
                      </td>
                      <td className={`${rowCell} min-w-[140px]`}>
                        {contentInfo?.needsImprovement ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 cursor-help">
                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                <span className="text-[11px] text-amber-700">Needs improvement</span>
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
                            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                            <span className="text-[11px] text-emerald-700">Good</span>
                          </div>
                        )}
                      </td>
                      <td className={`${rowCell} min-w-[120px] sticky right-0 bg-white z-10`}>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem className="cursor-pointer text-cyan-700" onClick={() => handleEditProduct(product.id)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit Product
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-cyan-700"
                                onClick={() => handleViewStock(product.variants[0]?.sku)}
                              >
                                <Warehouse className="mr-2 h-4 w-4" />
                                View in Stock Inventory
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <AlertDialog
                                open={deleteDialogOpen[product.id] || false}
                                onOpenChange={() => handleCancelDelete(product.id)}
                              >
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50"
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
                                      className="bg-rose-600 hover:bg-rose-700"
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
                          <tr key={variant.id} className="bg-cyan-50/30 hover:bg-cyan-50/50 transition-colors">
                            <td className={`${rowCell} sticky left-0 bg-cyan-50/30 z-10`} />
                            <td className={rowCell} />
                            <td className={`${rowCell} min-w-[280px]`}>
                              <div className="flex items-center gap-2.5 pl-9">
                                <img
                                  src={getVariantImage(variant, product)}
                                  alt={variant.sku}
                                  className="w-8 h-8 object-cover rounded-lg border border-slate-200"
                                 onError={handleImageError}
                                />
                                <div className="min-w-0 flex-1">
                                  {variant.name ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <p className="text-xs font-semibold text-slate-700 truncate cursor-help">
                                          {truncateText(variant.name)}
                                        </p>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs">
                                        <p>{variant.name}</p>
                                        <p className="text-xs text-slate-400 mt-1">SKU: {variant.sku}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <p className="text-xs font-semibold text-slate-700">Default Variant</p>
                                  )}
                                  <p className="text-[10px] text-cyan-600 mt-0.5 font-mono">{variant.sku}</p>
                                </div>
                              </div>
                            </td>
                            <td className={`${rowCell} min-w-[190px]`}>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-slate-800 font-mono">{formatPrice(variant.price)}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEditPrice(product.id, variant, product.name)}
                                    className="h-6 w-6 p-0 hover:bg-cyan-100 rounded-lg"
                                  >
                                    <Edit2 className="h-3.5 w-3.5 text-cyan-600" />
                                  </Button>
                                  <PriceLockBadge productId={product.id} variant={variant} />
                                </div>
                                {variant.specialPrice ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-semibold text-cyan-600 font-mono">
                                      {formatPrice(variant.specialPrice)}
                                    </span>
                                    <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[9px] px-1.5 py-0">
                                      {calculateDiscount(variant.price, variant.specialPrice)}% OFF
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onEditSpecialPrice(product.id, variant, product.name)}
                                      className="h-6 w-6 p-0 hover:bg-cyan-100 rounded-lg"
                                    >
                                      <Edit2 className="h-3.5 w-3.5 text-cyan-600" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => onEditSpecialPrice(product.id, variant, product.name)}
                                    className="h-6 px-0 text-[11px] text-cyan-600 hover:text-cyan-700"
                                  >
                                    + Add special price
                                  </Button>
                                )}
                              </div>
                            </td>
                            <td className={`${rowCell} min-w-[130px]`}>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-700">{variant.stock}</span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleViewStock(variant.sku)}
                                      className="h-6 w-6 flex items-center justify-center hover:bg-cyan-100 rounded-lg text-cyan-600"
                                    >
                                      <Warehouse className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Manage in Stock Inventory</TooltipContent>
                                </Tooltip>
                              </div>
                            </td>
                            <td className={`${rowCell} min-w-[120px]`}>
                              <div className="flex justify-center">
                                <Switch
                                  checked={variant.availability === true}
                                  className="data-[state=checked]:bg-cyan-600"
                                />
                              </div>
                            </td>
                            <td className={`${rowCell} min-w-[140px]`} colSpan={2} />
                            <td className={`${rowCell} sticky right-0 bg-cyan-50/30 z-10`} />
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

        <div className="md:hidden mt-2 px-4">
          <div className="flex items-center justify-center gap-2 text-xs text-cyan-600">
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