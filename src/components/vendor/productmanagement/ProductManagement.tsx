"use client"

import React, { useState, useMemo } from "react";
import {
  useGetMyProductsQuery,
  useGetVendorProductsContentSummaryQuery,
  useUpdateProductStockMutation,
  useUpdateProductPriceMutation,
  useUpdateProductSpecialPriceMutation,
} from "@/features/productApi";
import { ProductVariant } from "@/types/product";
import ProductFilters from "./ProductFilters";
import ProductTable from "./ProductTable";
import PriceEditModal from "./PriceEditModal";
import StockEditModal from "./StockEditModal";
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

const ProductManagement: React.FC = () => {
  // Tab state
  const [activeStatus, setActiveStatus] = useState<StatusTab>("ALL");

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    sortBy: "createdAt",
    sortOrder: "desc" as "asc" | "desc",
    page: 1,
    limit: 10,
  });

  // Modal states
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [specialPriceModalOpen, setSpecialPriceModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Selected variant for editing
  const [selectedVariant, setSelectedVariant] = useState<{
    productId: string;
    variant: ProductVariant;
    productName: string;
  } | null>(null);

  // Selected products for export
  const [selectedProducts, setSelectedProducts] = useState<SelectedProducts>(
    {}
  );

  // Fetch products
  const { data, isLoading, isFetching, refetch } = useGetMyProductsQuery({
    status: activeStatus === "ALL" ? undefined : activeStatus,
    ...filters,
  });

  // Fetch content summary
  const { data: contentSummary } = useGetVendorProductsContentSummaryQuery();

  // Mutations
  const [updateStock] = useUpdateProductStockMutation();
  const [updatePrice] = useUpdateProductPriceMutation();
  const [updateSpecialPrice] = useUpdateProductSpecialPriceMutation();

  // Status tabs configuration
  const statusTabs: { key: StatusTab; label: string; count?: number }[] = [
    { key: "ALL", label: "All Products" },
    { key: "ACTIVE", label: "Active" },
    { key: "PENDING", label: "Pending" },
    { key: "DRAFT", label: "Drafts" },
    { key: "REJECTED", label: "Rejected" },
  ];

  // Get active tab data
  const activeTab = statusTabs.find(tab => tab.key === activeStatus);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.products) {
      const newSelection: SelectedProducts = {};
      data.products.forEach((product) => {
        newSelection[product.id] = true;
      });
      setSelectedProducts(newSelection);
    } else {
      setSelectedProducts({});
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: checked,
    }));
  };

  // Get selected products data
  const selectedProductsData = useMemo(() => {
    if (!data?.products) return [];
    return data.products.filter((product) => selectedProducts[product.id]);
  }, [data?.products, selectedProducts]);

  const selectedCount = Object.values(selectedProducts).filter(Boolean).length;

  // Handle price edit
  const handleEditPrice = (
    productId: string,
    variant: ProductVariant,
    productName: string
  ) => {
    setSelectedVariant({ productId, variant, productName });
    setPriceModalOpen(true);
  };

  // Handle special price edit
  const handleEditSpecialPrice = (
    productId: string,
    variant: ProductVariant,
    productName: string
  ) => {
    setSelectedVariant({ productId, variant, productName });
    setSpecialPriceModalOpen(true);
  };

  // Handle stock edit
  const handleEditStock = (
    productId: string,
    variant: ProductVariant,
    productName: string
  ) => {
    setSelectedVariant({ productId, variant, productName });
    setStockModalOpen(true);
  };

  // Handle price update
  const handlePriceUpdate = async (
    price: number | null,
    autoCalculateDiscount: boolean
  ) => {
    if (!selectedVariant) return;

    const updatePromise = updatePrice({
      productId: selectedVariant.productId,
      variantId: selectedVariant.variant.id,
      price: price as number,
      autoCalculateDiscount,
    }).unwrap();

    toast.promise(updatePromise, {
      loading: 'Updating price...',
      success: () => {
        setPriceModalOpen(false);
        setSelectedVariant(null);
        return 'Price updated successfully';
      },
      error: (error: any) => {
        return error?.data?.message || 'Failed to update price';
      },
    });
  };

  // Handle special price update
  const handleSpecialPriceUpdate = async (
    specialPrice: number | null,
    autoCalculateDiscount: boolean
  ) => {
    if (!selectedVariant) return;

    const updatePromise = updateSpecialPrice({
      productId: selectedVariant.productId,
      variantId: selectedVariant.variant.id,
      specialPrice,
      autoCalculateDiscount,
    }).unwrap();

    toast.promise(updatePromise, {
      loading: 'Updating special price...',
      success: () => {
        setSpecialPriceModalOpen(false);
        setSelectedVariant(null);
        return 'Special price updated successfully';
      },
      error: (error: any) => {
        return error?.data?.message || 'Failed to update special price';
      },
    });
  };

  // Handle stock update
  const handleStockUpdate = async (stock: number) => {
    if (!selectedVariant) return;

    const updatePromise = updateStock({
      productId: selectedVariant.productId,
      variantId: selectedVariant.variant.id,
      stock,
    }).unwrap();

    toast.promise(updatePromise, {
      loading: 'Updating stock...',
      success: () => {
        setStockModalOpen(false);
        setSelectedVariant(null);
        return 'Stock updated successfully';
      },
      error: (error: any) => {
        return error?.data?.message || 'Failed to update stock';
      },
    });
  };

  // Handle export
  const handleExport = async (format: "excel" | "csv") => {
    const productsToExport =
      selectedCount > 0
        ? selectedProductsData
        : data?.products || [];

    if (productsToExport.length === 0) {
      toast.error("No products to export");
      return;
    }

    const exportPromise = Promise.resolve(
      format === "excel" 
        ? exportToExcel(productsToExport)
        : exportToCSV(productsToExport)
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

  // Generate pagination items
  const renderPaginationItems = () => {
    if (!data?.pagination) return null;
    
    const { page, totalPages } = data.pagination;
    const items = [];
    const maxVisible = 5;
    
    // Always show first page
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          isActive={page === 1}
          onClick={() => handlePageChange(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Calculate range
    let start = Math.max(2, page - 1);
    let end = Math.min(totalPages - 1, page + 1);

    // Adjust if we're near the beginning
    if (page <= 3) {
      end = Math.min(totalPages - 1, maxVisible - 1);
    }

    // Adjust if we're near the end
    if (page >= totalPages - 2) {
      start = Math.max(2, totalPages - maxVisible + 2);
    }

    // Add ellipsis after first page if needed
    if (start > 2) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={page === i}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Add ellipsis before last page if needed
    if (end < totalPages - 1) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            isActive={page === totalPages}
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  Product Management
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Manage your products, variants, pricing, and inventory
                </p>
              </div>
              {contentSummary && contentSummary.needsImprovement > 0 && (
                <Alert className="bg-yellow-50 border-yellow-200 sm:max-w-xs shrink-0">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-xs sm:text-sm text-yellow-800">
                    <span className="font-semibold">
                      {contentSummary.needsImprovement}
                    </span>{" "}
                    products need improvement
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Tabs - Desktop */}
      <div className="hidden md:block bg-card border-b">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveStatus(tab.key)}
                className={`
                  relative px-4 py-3 text-sm font-medium whitespace-nowrap
                  transition-colors duration-200
                  ${activeStatus === tab.key
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  {tab.count !== undefined && (
                    <Badge 
                      variant={activeStatus === tab.key ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {tab.count}
                    </Badge>
                  )}
                </span>
                {activeStatus === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status Tabs - Mobile Dropdown */}
      <div className="md:hidden bg-card border-b">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between"
              >
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
                  className={`
                    flex items-center justify-between
                    ${activeStatus === tab.key ? 'bg-accent' : ''}
                  `}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <Badge 
                      variant={activeStatus === tab.key ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {tab.count}
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Filters and Export */}
        <div className="bg-card rounded-lg border mb-4 sm:mb-6">
          <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-medium">{selectedCount}</span> products
              selected
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportModalOpen(true)}
              className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10"
            >
              Export ▼
            </Button>
          </div>
          <ProductFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Product Table */}
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <ProductTable
              products={data?.products || []}
              isLoading={isLoading || isFetching}
              selectedProducts={selectedProducts}
              onSelectAll={handleSelectAll}
              onSelectProduct={handleSelectProduct}
              onEditPrice={handleEditPrice}
              onEditSpecialPrice={handleEditSpecialPrice}
              onEditStock={handleEditStock}
              contentSummary={contentSummary}
            />
          </div>
        </div>

        {/* Pagination */}
        {data?.pagination && (
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{" "}
              {Math.min(
                data.pagination.page * data.pagination.limit,
                data.pagination.total
              )}{" "}
              of {data.pagination.total} products
            </div>
            
            <Pagination>
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(data.pagination.page - 1)}
                    className={`
                      h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3
                      ${!data.pagination.hasPrev ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
                    `}
                  />
                </PaginationItem>
                
                <div className="hidden sm:contents">
                  {renderPaginationItems()}
                </div>
                
                <div className="sm:hidden flex items-center px-2">
                  <span className="text-xs text-muted-foreground">
                    {data.pagination.page} / {data.pagination.totalPages}
                  </span>
                </div>
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(data.pagination.page + 1)}
                    className={`
                      h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3
                      ${!data.pagination.hasNext ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
                    `}
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

      <Dialog open={stockModalOpen} onOpenChange={setStockModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
          </DialogHeader>
          {selectedVariant && (
            <StockEditModal
              productName={selectedVariant.productName}
              variant={selectedVariant.variant}
              onClose={() => {
                setStockModalOpen(false);
                setSelectedVariant(null);
              }}
              onSave={handleStockUpdate}
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
            totalCount={data?.products?.length || 0}
            onClose={() => setExportModalOpen(false)}
            onExport={handleExport}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;