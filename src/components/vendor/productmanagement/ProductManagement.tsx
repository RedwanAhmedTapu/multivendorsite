"use client"

import React, { useState, useMemo } from "react";
import {
  useGetMyProductsQuery,
  useGetVendorProductsContentSummaryQuery,
  useUpdateProductPriceMutation,
  useUpdateProductSpecialPriceMutation,
  useResetPriceOverrideMutation,
} from "@/features/productapi/vendorProductApi";
import type { ProductVariant } from "@/features/productapi/types";
import type { SortBy } from "@/features/productapi/types";
import ProductFilters from "./ProductFilters";
import ProductTable from "./ProductTable";
import PriceEditModal from "./PriceEditModal";
import ExportModal from "./ExportModal";
import { exportToExcel, exportToCSV } from "@/utils/ProductsExport";
import { toast } from "sonner";
import { AlertCircle, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

type StatusTab = "ALL" | "PENDING" | "ACTIVE" | "REJECTED" | "DRAFT";

interface SelectedProducts {
  [productId: string]: boolean;
}

// FIX: shape now matches VendorProductFilter exactly —
// - `categoryId` (an actual category ID, not a free-text name)
// - `sortBy` is a single SortBy enum value; there's no separate sortOrder,
//   direction is baked into the value itself (e.g. "price_asc"/"price_desc")
// - `rackId`/`rowNumber`/`shelfNumber` added alongside `warehouseId`
interface ProductFilterState {
  search: string;
  categoryId: string;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  sortBy: SortBy;
  warehouseId: string;
  rackId: string;
  rowNumber: number | undefined;
  shelfNumber: number | undefined;
  page: number;
  limit: number;
}

const ProductManagement: React.FC = () => {
  const [activeStatus, setActiveStatus] = useState<StatusTab>("ALL");

  const [filters, setFilters] = useState<ProductFilterState>({
    search: "",
    categoryId: "",
    minPrice: undefined,
    maxPrice: undefined,
    sortBy: "newest",
    warehouseId: "",
    rackId: "",
    rowNumber: undefined,
    shelfNumber: undefined,
    page: 1,
    limit: 10,
  });

  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [specialPriceModalOpen, setSpecialPriceModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState<{
    productId: string;
    variant: ProductVariant;
    productName: string;
  } | null>(null);

  const [selectedProducts, setSelectedProducts] = useState<SelectedProducts>({});

  // FIX: `status` renamed to `approvalStatus` to match VendorProductFilter;
  // "ALL" tab omits the field entirely so the backend returns every status.
  const { data, isLoading, isFetching, refetch } = useGetMyProductsQuery({
    approvalStatus: activeStatus === "ALL" ? undefined : activeStatus,
    ...filters,
  });

  const { data: contentSummary } = useGetVendorProductsContentSummaryQuery();

  const [updatePrice] = useUpdateProductPriceMutation();
  const [updateSpecialPrice] = useUpdateProductSpecialPriceMutation();
  const [resetPriceOverride, { isLoading: isResettingPriceOverride }] =
    useResetPriceOverrideMutation();

  const statusTabs: { key: StatusTab; label: string; count?: number }[] = [
    { key: "ALL", label: "All Products" },
    { key: "ACTIVE", label: "Active" },
    { key: "PENDING", label: "Pending" },
    { key: "DRAFT", label: "Drafts" },
    { key: "REJECTED", label: "Rejected" },
  ];

  const activeTab = statusTabs.find((tab) => tab.key === activeStatus);

  const handleFilterChange = (newFilters: Partial<ProductFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // FIX: `data.products` -> `data.items` (OffsetPage<Product> shape)
  const products = data?.items ?? [];
  const pagination = data?.pagination;

  const handleSelectAll = (checked: boolean) => {
    if (checked && products.length) {
      const newSelection: SelectedProducts = {};
      products.forEach((product) => {
        newSelection[product.id] = true;
      });
      setSelectedProducts(newSelection);
    } else {
      setSelectedProducts({});
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts((prev) => ({ ...prev, [productId]: checked }));
  };

  const selectedProductsData = useMemo(
    () => products.filter((product) => selectedProducts[product.id]),
    [products, selectedProducts],
  );

  const selectedCount = Object.values(selectedProducts).filter(Boolean).length;

  const handleEditPrice = (
    productId: string,
    variant: ProductVariant,
    productName: string,
  ) => {
    setSelectedVariant({ productId, variant, productName });
    setPriceModalOpen(true);
  };

  const handleEditSpecialPrice = (
    productId: string,
    variant: ProductVariant,
    productName: string,
  ) => {
    setSelectedVariant({ productId, variant, productName });
    setSpecialPriceModalOpen(true);
  };

  const handlePriceUpdate = async (
    price: number | null,
    autoCalculateDiscount: boolean,
  ) => {
    if (!selectedVariant) return;

    const updatePromise = updatePrice({
      productId: selectedVariant.productId,
      variantId: selectedVariant.variant.id,
      price: price as number,
      autoCalculateDiscount,
    }).unwrap();

    toast.promise(updatePromise, {
      loading: "Updating price...",
      success: () => {
        setPriceModalOpen(false);
        setSelectedVariant(null);
        return "Price updated successfully";
      },
      error: (error: any) => error?.data?.message || "Failed to update price",
    });
  };

  const handleSpecialPriceUpdate = async (
    specialPrice: number | null,
    autoCalculateDiscount: boolean,
  ) => {
    if (!selectedVariant) return;

    const updatePromise = updateSpecialPrice({
      productId: selectedVariant.productId,
      variantId: selectedVariant.variant.id,
      specialPrice,
      autoCalculateDiscount,
    }).unwrap();

    toast.promise(updatePromise, {
      loading: "Updating special price...",
      success: () => {
        setSpecialPriceModalOpen(false);
        setSelectedVariant(null);
        return "Special price updated successfully";
      },
      error: (error: any) => error?.data?.message || "Failed to update special price",
    });
  };

  const handleResetPriceOverride = async (productId: string, variantId: string) => {
    const resetPromise = resetPriceOverride({ productId, variantId }).unwrap();

    toast.promise(resetPromise, {
      loading: "Unlocking price...",
      success: "Price will now auto-sync from future purchases",
      error: (error: any) => error?.data?.message || "Failed to unlock price",
    });
  };

  const handleExport = async (format: "excel" | "csv") => {
    const productsToExport = selectedCount > 0 ? selectedProductsData : products;

    if (productsToExport.length === 0) {
      toast.error("No products to export");
      return;
    }

    const exportPromise = Promise.resolve(
      format === "excel" ? exportToExcel(productsToExport) : exportToCSV(productsToExport),
    );

    toast.promise(exportPromise, {
      loading: `Exporting ${productsToExport.length} products...`,
      success: () => {
        setExportModalOpen(false);
        return `Exported ${productsToExport.length} products to ${format.toUpperCase()}`;
      },
      error: (error: any) => {
        console.error(error);
        return "Failed to export products";
      },
    });
  };

  // FIX: pagination fields renamed to match OffsetPagination
  // (currentPage/totalPages/totalItems/hasNext/hasPrevious).
  const renderPaginationItems = () => {
    if (!pagination) return null;

    const { currentPage: page, totalPages } = pagination;
    const items = [];
    const maxVisible = 5;

    items.push(
      <PaginationItem key={1}>
        <PaginationLink isActive={page === 1} onClick={() => handlePageChange(1)}>
          1
        </PaginationLink>
      </PaginationItem>,
    );

    let start = Math.max(2, page - 1);
    let end = Math.min(totalPages - 1, page + 1);

    if (page <= 3) end = Math.min(totalPages - 1, maxVisible - 1);
    if (page >= totalPages - 2) start = Math.max(2, totalPages - maxVisible + 2);

    if (start > 2) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>,
      );
    }

    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={page === i} onClick={() => handlePageChange(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    if (end < totalPages - 1) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>,
      );
    }

    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink isActive={page === totalPages} onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return items;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 font-sans">
      {/* ── Header ── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-30 shadow-sm shadow-blue-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                Product Management
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your products, variants, and pricing
              </p>
            </div>
            {contentSummary && contentSummary.needsImprovement > 0 && (
              <Alert className="bg-amber-50 border-amber-200 sm:max-w-xs shrink-0 rounded-xl">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs sm:text-sm text-amber-800">
                  <span className="font-semibold">{contentSummary.needsImprovement}</span>{" "}
                  products need improvement
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>

      {/* Status Tabs - Desktop */}
      <div className="hidden md:block bg-white/70 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveStatus(tab.key)}
                className={`relative px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                  activeStatus === tab.key ? "text-cyan-600" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  {tab.count !== undefined && (
                    <Badge variant={activeStatus === tab.key ? "default" : "secondary"} className="text-xs">
                      {tab.count}
                    </Badge>
                  )}
                </span>
                {activeStatus === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status Tabs - Mobile Dropdown */}
      <div className="md:hidden bg-white/70 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between rounded-xl border-cyan-200">
                <span className="flex items-center gap-2">
                  {activeTab?.label}
                  {activeTab?.count !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      {activeTab.count}
                    </Badge>
                  )}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[calc(100vw-2rem)]">
              {statusTabs.map((tab) => (
                <DropdownMenuItem
                  key={tab.key}
                  onClick={() => setActiveStatus(tab.key)}
                  className={activeStatus === tab.key ? "bg-cyan-50" : ""}
                >
                  <span>{tab.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 mb-4 sm:mb-6 overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-blue-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-slate-500">
              <span className="font-bold text-slate-700">{selectedCount}</span> products selected
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportModalOpen(true)}
              className="w-full sm:w-auto border-cyan-200 text-cyan-700 hover:bg-cyan-50 rounded-xl"
            >
              Export ▼
            </Button>
          </div>
          <ProductFilters filters={filters} onFilterChange={handleFilterChange} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <ProductTable
              products={products}
              isLoading={isLoading || isFetching}
              selectedProducts={selectedProducts}
              onSelectAll={handleSelectAll}
              onSelectProduct={handleSelectProduct}
              onEditPrice={handleEditPrice}
              onEditSpecialPrice={handleEditSpecialPrice}
              onResetPriceOverride={handleResetPriceOverride}
              isResettingPriceOverride={isResettingPriceOverride}
              contentSummary={contentSummary}
            />
          </div>
        </div>

        {/* FIX: pagination summary + controls use currentPage/totalItems/limit/hasNext/hasPrevious */}
        {pagination && (
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
              Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of{" "}
              {pagination.totalItems} products
            </div>

            <Pagination>
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    className={`h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3 ${
                      !pagination.hasPrevious ? "opacity-50 pointer-events-none" : "cursor-pointer"
                    }`}
                  />
                </PaginationItem>

                <div className="hidden sm:contents">{renderPaginationItems()}</div>

                <div className="sm:hidden flex items-center px-2">
                  <span className="text-xs text-slate-400">
                    {pagination.currentPage} / {pagination.totalPages}
                  </span>
                </div>

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    className={`h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3 ${
                      !pagination.hasNext ? "opacity-50 pointer-events-none" : "cursor-pointer"
                    }`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Modals */}
      <Dialog open={priceModalOpen} onOpenChange={setPriceModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Price</DialogTitle>
          </DialogHeader>
          {selectedVariant && (
            <PriceEditModal
              productName={selectedVariant.productName}
              variant={selectedVariant.variant}
              onClose={() => {
                setPriceModalOpen(false);
                setSelectedVariant(null);
              }}
              onSave={handlePriceUpdate}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={specialPriceModalOpen} onOpenChange={setSpecialPriceModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Special Price</DialogTitle>
          </DialogHeader>
          {selectedVariant && (
            <PriceEditModal
              productName={selectedVariant.productName}
              variant={selectedVariant.variant}
              isSpecialPrice
              onClose={() => {
                setSpecialPriceModalOpen(false);
                setSelectedVariant(null);
              }}
              onSave={handleSpecialPriceUpdate}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export Products</DialogTitle>
          </DialogHeader>
          <ExportModal
            selectedCount={selectedCount}
            totalCount={products.length}
            onClose={() => setExportModalOpen(false)}
            onExport={handleExport}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;