// components/admin/offers/offer-product-selector.tsx
import { useState, useEffect } from "react";
import { useGetProductsQuery } from "@/features/productApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, Check, X, Package, Tag, Filter, Star, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfferProductSelectorProps {
  selectedProductIds: string[];
  onSelectionChange: (productIds: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProductDetailsModalProps {
  product: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper functions to safely access product data
const getProductPrice = (product: any): number => {
  // Check various possible locations for price
  if (product.price) return product.price;
  if (product.variants && product.variants[0]?.price) return product.variants[0].price;
  if (product.warranty?.price) return product.warranty.price;
  return 0;
};

const getProductStock = (product: any): number => {
  // Check various possible locations for stock
  if (product.stockQuantity !== undefined) return product.stockQuantity;
  if (product.inventory?.quantity) return product.inventory.quantity;
  if (product.warranty?.stockQuantity) return product.warranty.stockQuantity;
  return 0;
};

const getProductStatus = (product: any): string => {
  return product.approvalStatus || product.status || 'UNKNOWN';
};

const getProductImages = (product: any): string[] => {
  if (product.images && Array.isArray(product.images)) {
    return product.images.map((img: any) => img.url || '').filter(Boolean);
  }
  if (product.image) return [product.image];
  return [];
};

const getProductCategory = (product: any): string => {
  return product.category?.name || product.categoryId || 'N/A';
};

// Product Details Modal Component
function ProductDetailsModal({ product, open, onOpenChange }: ProductDetailsModalProps) {
  if (!product) return null;

  const price = getProductPrice(product);
  const stock = getProductStock(product);
  const status = getProductStatus(product);
  const images = getProductImages(product);
  const category = getProductCategory(product);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Package className="h-6 w-6" />
            Product Details
          </DialogTitle>
          <DialogDescription className="text-base">
            Complete information about <strong>{product.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Header */}
          <div className="flex gap-6">
            {images.length > 0 ? (
              <img
                src={images[0]}
                alt={product.name}
                className="h-32 w-32 object-cover rounded-lg border-2"
              />
            ) : (
              <div className="h-32 w-32 bg-muted rounded-lg border-2 flex items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-2xl font-bold">{product.name}</h2>
                {product.sku && (
                  <p className="text-muted-foreground">SKU: {product.sku}</p>
                )}
                {product.id && (
                  <p className="text-muted-foreground text-sm">ID: {product.id}</p>
                )}
              </div>
              <div className="flex gap-4 flex-wrap">
                <Badge 
                  variant={status === "ACTIVE" ? "default" : "secondary"}
                  className="text-sm px-3 py-1"
                >
                  {status}
                </Badge>
                <div className="text-2xl font-bold text-green-600">
                  ₹{price.toLocaleString()}
                </div>
                {product.vendor?.storeName && (
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    Vendor: {product.vendor.storeName}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                <div className="space-y-2">
                  <span className="text-muted-foreground block">Category:</span>
                  <p className="font-medium">{category}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-muted-foreground block">Stock Quantity:</span>
                  <Badge 
                    variant={
                      stock > 10 ? "default" :
                      stock > 0 ? "secondary" : "destructive"
                    }
                  >
                    {stock} units
                  </Badge>
                </div>
                <div className="space-y-2">
                  <span className="text-muted-foreground block">Status:</span>
                  <Badge 
                    variant={status === "ACTIVE" ? "default" : "secondary"}
                    className={
                      status === "ACTIVE" ? "bg-green-500" :
                      status === "INACTIVE" ? "bg-gray-500" : "bg-yellow-500"
                    }
                  >
                    {status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <span className="text-muted-foreground block">Price:</span>
                  <p className="font-medium text-lg">₹{price.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {product.description && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-lg mb-3">Description</h4>
                <div 
                  className="text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </CardContent>
            </Card>
          )}

          {/* Product Images */}
          {images.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-lg mb-4">Product Images</h4>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-32 w-32 object-cover rounded-lg border-2 hover:scale-105 transition-transform cursor-pointer"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vendor Information */}
          {product.vendor && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-lg mb-4">Vendor Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <span className="text-muted-foreground block">Store Name:</span>
                    <p className="font-medium">{product.vendor.storeName || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-muted-foreground block">Status:</span>
                    <Badge variant={product.vendor.status === "ACTIVE" ? "default" : "secondary"}>
                      {product.vendor.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <span className="text-muted-foreground block">Verification:</span>
                    <Badge variant={product.vendor.verificationStatus === "VERIFIED" ? "default" : "secondary"}>
                      {product.vendor.verificationStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-lg mb-4">Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {product.specifications.map((spec: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-muted-foreground capitalize font-medium">
                        {spec.key || 'Specification'}:
                      </span>
                      <span className="font-medium text-right">{spec.value || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-lg mb-4">Product Variants</h4>
                <div className="space-y-3">
                  {product.variants.map((variant: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">{variant.name || `Variant ${index + 1}`}</span>
                        {variant.sku && (
                          <span className="text-muted-foreground text-sm ml-2">SKU: {variant.sku}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">₹{(variant.price || 0).toLocaleString()}</div>
                        <Badge variant={variant.stockQuantity > 0 ? "default" : "destructive"} className="text-xs">
                          {variant.stockQuantity || 0} in stock
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OfferProductSelector({
  selectedProductIds,
  onSelectionChange,
  open,
  onOpenChange,
}: OfferProductSelectorProps) {
  const { data: products = [], isLoading, error } = useGetProductsQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [priceRangeFilter, setPriceRangeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  console.log("Products data:", products); // Debug log

  // Filter products based on filters
  const filteredProducts = products.filter((product: any) => {
    if (!product) return false;
    
    const productName = product.name || '';
    const productSku = product.sku || '';
    const productDescription = product.description || '';
    
    const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         productSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         productDescription.toLowerCase().includes(searchTerm.toLowerCase());
    
    const category = getProductCategory(product);
    const matchesCategory = categoryFilter === "all" || category === categoryFilter;
    
    const status = getProductStatus(product);
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    
    // Price range filtering with safe access
    const price = getProductPrice(product);
    let matchesPriceRange = true;
    if (priceRangeFilter !== "all") {
      switch (priceRangeFilter) {
        case "under-500":
          matchesPriceRange = price < 500;
          break;
        case "500-1000":
          matchesPriceRange = price >= 500 && price <= 1000;
          break;
        case "1000-5000":
          matchesPriceRange = price > 1000 && price <= 5000;
          break;
        case "above-5000":
          matchesPriceRange = price > 5000;
          break;
      }
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesPriceRange;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      case "price-low":
        return getProductPrice(a) - getProductPrice(b);
      case "price-high":
        return getProductPrice(b) - getProductPrice(a);
      case "stock":
        return getProductStock(b) - getProductStock(a);
      default:
        return 0;
    }
  });

  // Get unique categories from products
  const categories = Array.from(
    new Set(products.map(product => getProductCategory(product)).filter(Boolean))
  ) as string[];

  const toggleProductSelection = (productId: string) => {
    const newSelection = selectedProductIds.includes(productId)
      ? selectedProductIds.filter(id => id !== productId)
      : [...selectedProductIds, productId];
    onSelectionChange(newSelection);
  };

  const selectAllFiltered = () => {
    const filteredIds = sortedProducts.map(p => p.id).filter(Boolean);
    const newSelection = Array.from(new Set([...selectedProductIds, ...filteredIds]));
    onSelectionChange(newSelection);
  };

  const clearAllFiltered = () => {
    const filteredIds = sortedProducts.map(p => p.id).filter(Boolean);
    const newSelection = selectedProductIds.filter(id => !filteredIds.includes(id));
    onSelectionChange(newSelection);
  };

  const clearAllSelections = () => {
    onSelectionChange([]);
  };

  const viewProductDetails = (product: any) => {
    setSelectedProduct(product);
    setDetailsModalOpen(true);
  };

  // Reset filters when dialog opens
  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setCategoryFilter("all");
      setStatusFilter("ACTIVE");
      setPriceRangeFilter("all");
      setSortBy("name");
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <Package className="h-6 w-6" />
              Select Products for Offer
            </DialogTitle>
            <DialogDescription className="text-base">
              Choose products to apply this offer to. Use filters and search to find specific products quickly.
            </DialogDescription>
          </DialogHeader>

          {/* Debug Info - Remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="px-6 py-2 bg-yellow-50 border-b">
              <div className="flex items-center gap-2 text-sm text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <span>Debug: Loaded {products.length} products</span>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col p-6 pt-4 gap-4">
            {/* Filters and Search */}
            <div className="space-y-4">
              {/* Search and Bulk Actions */}
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="Search products by name, SKU, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-12 text-lg"
                  />
                </div>
                
                {/* Bulk Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="lg" onClick={selectAllFiltered} className="gap-2">
                    <Check className="h-5 w-5" />
                    Select All
                  </Button>
                  <Button variant="outline" size="lg" onClick={clearAllFiltered} className="gap-2">
                    <X className="h-5 w-5" />
                    Clear Filtered
                  </Button>
                  {selectedProductIds.length > 0 && (
                    <Button variant="outline" size="lg" onClick={clearAllSelections} className="gap-2">
                      <X className="h-5 w-5" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              {/* Filter and Sort Row */}
              <div className="flex gap-4 items-center">
                <div className="flex gap-3 flex-1">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48 h-11">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 h-11">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priceRangeFilter} onValueChange={setPriceRangeFilter}>
                    <SelectTrigger className="w-48 h-11">
                      <SelectValue placeholder="Price Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="under-500">Under ₹500</SelectItem>
                      <SelectItem value="500-1000">₹500 - ₹1,000</SelectItem>
                      <SelectItem value="1000-5000">₹1,000 - ₹5,000</SelectItem>
                      <SelectItem value="above-5000">Above ₹5,000</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48 h-11">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="price-low">Price (Low to High)</SelectItem>
                      <SelectItem value="price-high">Price (High to Low)</SelectItem>
                      <SelectItem value="stock">Stock (High to Low)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Active Filters Badges */}
                <div className="flex items-center gap-2">
                  {(categoryFilter !== "all" || statusFilter !== "all" || priceRangeFilter !== "all" || searchTerm) && (
                    <>
                      <Filter className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Active filters:</span>
                      {categoryFilter !== "all" && (
                        <Badge variant="secondary" className="flex items-center gap-1 py-1">
                          Category: {categoryFilter}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                            onClick={() => setCategoryFilter("all")}
                          />
                        </Badge>
                      )}
                      {statusFilter !== "all" && (
                        <Badge variant="secondary" className="flex items-center gap-1 py-1">
                          Status: {statusFilter}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                            onClick={() => setStatusFilter("all")}
                          />
                        </Badge>
                      )}
                      {priceRangeFilter !== "all" && (
                        <Badge variant="secondary" className="flex items-center gap-1 py-1">
                          Price: {priceRangeFilter.replace(/-/g, ' - ').replace('under', 'Under ').replace('above', 'Above ')}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                            onClick={() => setPriceRangeFilter("all")}
                          />
                        </Badge>
                      )}
                      {searchTerm && (
                        <Badge variant="secondary" className="flex items-center gap-1 py-1">
                          Search: {searchTerm}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                            onClick={() => setSearchTerm("")}
                          />
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Selection Info */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
              <div className="text-lg">
                <span className="font-bold text-blue-600">{selectedProductIds.length}</span> products selected
                {sortedProducts.length > 0 && (
                  <span className="text-muted-foreground"> • Showing {sortedProducts.length} of {products.length} total products</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {sortedProducts.length} products found
                </Badge>
                {selectedProductIds.length > 0 && (
                  <Badge variant="default" className="bg-blue-600 text-white text-sm px-3 py-1">
                    {selectedProductIds.length} selected
                  </Badge>
                )}
              </div>
            </div>

            {/* Products Table */}
            <div className="flex-1 overflow-auto border-2 rounded-xl">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg text-muted-foreground">Loading products...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <Package className="h-16 w-16 mx-auto mb-4 text-destructive opacity-50" />
                  <h3 className="text-xl font-semibold text-destructive mb-2">Failed to load products</h3>
                  <p className="text-muted-foreground mb-4">Please check your connection and try again.</p>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : sortedProducts.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold text-muted-foreground mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-4">Try adjusting your search criteria or filters.</p>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter("all");
                      setStatusFilter("all");
                      setPriceRangeFilter("all");
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <TableRow>
                      <TableHead className="w-16 text-center">Select</TableHead>
                      <TableHead className="text-lg font-semibold">Product</TableHead>
                      <TableHead className="text-lg font-semibold">Category</TableHead>
                      <TableHead className="text-lg font-semibold text-right">Price</TableHead>
                      <TableHead className="text-lg font-semibold text-center">Stock</TableHead>
                      <TableHead className="text-lg font-semibold">Status</TableHead>
                      <TableHead className="w-24 text-center text-lg font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProducts.map((product) => {
                      const price = getProductPrice(product);
                      const stock = getProductStock(product);
                      const status = getProductStatus(product);
                      const images = getProductImages(product);
                      const category = getProductCategory(product);

                      return (
                        <TableRow 
                          key={product.id}
                          className={cn(
                            "cursor-pointer transition-all duration-200 border-b hover:shadow-md",
                            selectedProductIds.includes(product.id) 
                              ? "bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500" 
                              : "hover:bg-gray-50"
                          )}
                          onClick={() => toggleProductSelection(product.id)}
                        >
                          <TableCell>
                            <div className="flex items-center justify-center">
                              <div
                                className={cn(
                                  "h-6 w-6 rounded border-2 flex items-center justify-center transition-all duration-200",
                                  selectedProductIds.includes(product.id)
                                    ? "bg-blue-600 border-blue-600 text-white shadow-md"
                                    : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                                )}
                              >
                                {selectedProductIds.includes(product.id) && (
                                  <Check className="h-4 w-4" />
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-4">
                              {images.length > 0 ? (
                                <img
                                  src={images[0]}
                                  alt={product.name}
                                  className="h-16 w-16 object-cover rounded-xl border-2"
                                />
                              ) : (
                                <div className="h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 flex items-center justify-center">
                                  <Package className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-lg truncate">{product.name || "Unnamed Product"}</div>
                                {(product as any).sku && (
                                  <div className="text-sm text-muted-foreground truncate">
                                    SKU: {(product as any).sku}
                                  </div>
                                )}
                                {product.id && (
                                  <div className="text-xs text-muted-foreground truncate mt-1">
                                    ID: {product.id}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-sm px-3 py-1 max-w-32 truncate bg-white">
                              {category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="space-y-1">
                              <div className="font-bold text-lg text-green-600">
                                ₹{price.toLocaleString()}
                              </div>
                              {price > 1000 && (
                                <Badge variant="secondary" className="text-xs">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Premium
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={
                                stock > 10 ? "default" :
                                stock > 0 ? "secondary" : "destructive"
                              }
                              className="text-sm px-3 py-1 min-w-16"
                            >
                              {stock}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                status === "ACTIVE" ? "default" :
                                status === "INACTIVE" ? "secondary" : "outline"
                              }
                              className={cn(
                                "text-sm px-3 py-1",
                                status === "ACTIVE" && "bg-green-500 hover:bg-green-600",
                                status === "INACTIVE" && "bg-gray-500 hover:bg-gray-600",
                                status === "PENDING" && "bg-yellow-500 hover:bg-yellow-600"
                              )}
                            >
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewProductDetails(product);
                                }}
                                className="h-10 w-10 p-0 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors"
                              >
                                <Eye className="h-5 w-5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center p-6 border-t bg-gray-50 rounded-b-lg">
            <div className="text-lg">
              <span className="font-semibold">{selectedProductIds.length}</span> products selected for offer
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                size="lg"
                className="px-8"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => onOpenChange(false)}
                disabled={selectedProductIds.length === 0}
                size="lg"
                className="px-8 bg-green-600 hover:bg-green-700"
              >
                Confirm Selection ({selectedProductIds.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />
    </>
  );
}