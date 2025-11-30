// components/admin/products/ProductsTable.tsx
'use client';

import { useState, useMemo } from 'react';
import { 
  useGetProductsQuery, 
  useUpdateProductStatusMutation, 
  useDeleteProductMutation 
} from '@/features/productApi';
import type { Product } from '@/types/product';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Search, 
  Eye, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Check,
  Clock,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

type ProductStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';

export function ProductsTable() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'ALL'>('ALL');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const itemsPerPage = 10;

  const { data: products, isLoading, error, refetch } = useGetProductsQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateProductStatusMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  // Filter and search products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product) => {
      const matchesSearch = searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.vendor?.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || product.approvalStatus === statusFilter;

      const minPriceNum = minPrice ? parseFloat(minPrice) : 0;
      const maxPriceNum = maxPrice ? parseFloat(maxPrice) : Infinity;
      const productPrice = product.variants[0]?.price || 0;
      const matchesPrice = productPrice >= minPriceNum && productPrice <= maxPriceNum;

      return matchesSearch && matchesStatus && matchesPrice;
    });
  }, [products, searchTerm, statusFilter, minPrice, maxPrice]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Handle status update
  const handleStatusUpdate = async (productId: string, status: ProductStatus) => {
    try {
      await updateStatus({ id: productId, status }).unwrap();
      toast.success(`Product status updated to ${status}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update product status');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteProductId) return;

    try {
      await deleteProduct(deleteProductId).unwrap();
      toast.success('Product deleted successfully');
      setDeleteProductId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete product');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
  };

  const getStatusIcon = (status: ProductStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Check className="h-3 w-3" />;
      case 'PENDING':
        return <Clock className="h-3 w-3" />;
      case 'REJECTED':
        return <X className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusDisplay = (status: ProductStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'PENDING':
        return 'Pending';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'ALL') count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    return count;
  }, [searchTerm, statusFilter, minPrice, maxPrice]);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Failed to load products</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Products</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredProducts.length} products found
              </p>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Min price (৳)"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min="0"
            />

            <Input
              type="number"
              placeholder="Max price (৳)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min="0"
            />
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <p className="text-muted-foreground">No products found</p>
                      {activeFiltersCount > 0 && (
                        <Button variant="link" onClick={clearFilters} className="mt-2">
                          Clear filters
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product) => {
                    const status = product.approvalStatus as ProductStatus;
                    const price = product.variants[0]?.price || 0;
                    const stock = product.variants.reduce((sum, v) => sum + v.stock, 0);

                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <img
                            src={product.images[0]?.url || '/placeholder.png'}
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.vendor?.storeName || 'N/A'}</TableCell>
                        <TableCell>{product.category?.name || 'N/A'}</TableCell>
                        <TableCell className="font-semibold">৳{price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={stock > 0 ? 'default' : 'destructive'}>
                            {stock}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2"
                                disabled={isUpdating}
                              >
                                {getStatusIcon(status)}
                                <span>{getStatusDisplay(status)}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(product.id, 'ACTIVE')}
                                disabled={status === 'ACTIVE'}
                              >
                                <Check className="h-4 w-4 mr-2 text-green-600" />
                                <span>Active</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(product.id, 'PENDING')}
                                disabled={status === 'PENDING'}
                              >
                                <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                                <span>Pending</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(product.id, 'REJECTED')}
                                disabled={status === 'REJECTED'}
                              >
                                <X className="h-4 w-4 mr-2 text-red-600" />
                                <span>Rejected</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin-dashboard/products/${product.id}`)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteProductId(product.id)}
                              disabled={isDeleting}
                              title="Delete Product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProductId} onOpenChange={(open) => !open && setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product and all its variants. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}