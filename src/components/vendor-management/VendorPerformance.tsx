// components/vendor-management/VendorPerformance.tsx
'use client';

import { useState } from 'react';
import { useGetVendorsQuery } from '@/features/vendorManageApi';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import VendorPerformanceManager from './VendorPerformanceManager';

export default function VendorPerformance() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    search: '',
  });

  const { data, isLoading, error, refetch } = useGetVendorsQuery({
    page,
    limit,
    ...filters,
  });

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    const statusValue = value === 'all' ? undefined : value;
    setFilters({ ...filters, status: statusValue });
    setPage(1);
  };

  const handleManageVendor = (vendorId: string) => {
    setSelectedVendorId(vendorId);
  };

  const handleBackToList = () => {
    setSelectedVendorId(null);
  };

  if (selectedVendorId) {
    return (
      <VendorPerformanceManager
        vendorId={selectedVendorId}
        onBackToList={handleBackToList}
      />
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium">Failed to load vendors</h3>
          <p className="text-muted-foreground mb-4">
            Please try again later or check your connection.
          </p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Performance</CardTitle>
        <CardDescription>
          View and manage vendor performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search vendors..."
              className="pl-8"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Select onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Sales</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-24 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No vendors found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {vendor.avatar && (
                          <img
                            src={vendor.avatar}
                            alt={vendor.storeName}
                            className="h-8 w-8 rounded-full"
                          />
                        )}
                        <div>{vendor.storeName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          vendor.status === 'ACTIVE'
                            ? 'default'
                            : vendor.status === 'PENDING'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {vendor.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      ${vendor.performance?.totalSales?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell>{vendor.performance?.totalOrders || 0}</TableCell>
                    <TableCell>
                      {vendor.performance?.avgRating?.toFixed(1) || '0.0'}/5
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleManageVendor(vendor.id)}
                      >
                        View Performance
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {data?.pagination && data.pagination.pages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={
                    page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                  }
                />
              </PaginationItem>
              {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={pageNum === page}
                      onClick={() => setPage(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setPage(Math.min(data.pagination.pages, page + 1))
                  }
                  className={
                    page === data.pagination.pages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
}