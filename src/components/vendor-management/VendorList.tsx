// components/vendor-management/VendorList.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetVendorsQuery,
  useUpdateVendorStatusMutation,
} from '@/features/vendorManageApi';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, Search, Plus } from 'lucide-react';
import { toast } from 'sonner';

type VendorStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

interface VendorListProps {
  onManageVendor: (vendorId: string) => void;
}

export default function VendorList({ onManageVendor }: VendorListProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState({
    status: undefined as VendorStatus | undefined,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
  });

  const { data, isLoading, error, refetch } = useGetVendorsQuery({
    page,
    limit,
    ...filters,
  });

  const [updateVendorStatus] = useUpdateVendorStatusMutation();

  const handleStatusChange = async (vendorId: string, newStatus: VendorStatus) => {
    try {
      await updateVendorStatus({ id: vendorId, status: newStatus }).unwrap();
      toast.success(`Vendor status updated to ${newStatus}`);
      refetch();
    } catch (error) {
      toast.error('Failed to update vendor status');
    }
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    const statusValue = value === 'all' ? undefined : (value as VendorStatus);
    setFilters({ ...filters, status: statusValue });
    setPage(1);
  };

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Vendor Management</CardTitle>
            <CardDescription>Manage all vendors in the system</CardDescription>
          </div>
          <Button onClick={() => router.push('/vendors/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Vendor
          </Button>
        </div>
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
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                : data?.data.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      No vendors found.
                    </TableCell>
                  </TableRow>
                )
                : data?.data.map((vendor) => (
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
                        <div>
                          <div>{vendor.storeName}</div>
                          {vendor.user?.email && (
                            <div className="text-sm text-muted-foreground">
                              {vendor.user.email}
                            </div>
                          )}
                        </div>
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
                      {vendor.currentCommissionRate
                        ? `${vendor.currentCommissionRate}%`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{vendor._count?.products || 0}</TableCell>
                    <TableCell>{new Date(vendor.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => onManageVendor(vendor.id)}>Manage</Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onManageVendor(vendor.id)}>View Profile</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {vendor.status !== 'ACTIVE' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(vendor.id, 'ACTIVE')}>Activate</DropdownMenuItem>
                            )}
                            {vendor.status !== 'SUSPENDED' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(vendor.id, 'SUSPENDED')}>Suspend</DropdownMenuItem>
                            )}
                            {vendor.status !== 'DEACTIVATED' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(vendor.id, 'DEACTIVATED')}>Deactivate</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        {data?.pagination && data.pagination.pages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    isActive={pageNum === page}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(Math.min(data.pagination.pages, page + 1))}
                  className={page === data.pagination.pages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
}
