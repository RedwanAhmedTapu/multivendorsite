'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  MoreHorizontal,
  Download,
  CheckCircle,
  XCircle,
  PauseCircle,
  AlertCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';

// ✅ Import generated hooks
import {
  useGetVendorsQuery,
  useUpdateVendorStatusMutation,
  useExportVendorsMutation,
} from '@/features/vendorManageApi';

// Use the correct status values from Prisma schema
type VendorStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

interface Vendor {
  id: string;
  storeName: string;
  avatar?: string;
  status: VendorStatus;
  currentCommissionRate?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    isVerified: boolean;
  };
  performance?: {
    totalSales: number;
    totalOrders: number;
    fulfillmentRatePct: number;
    avgRating: number;
  };
  _count?: {
    products: number;
    orders: number;
    flags: number;
  };
}

const ApprovalVendor: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VendorStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [actionDialog, setActionDialog] = useState<'approve' | 'suspend' | 'deactivate' | null>(null);

  // ✅ Use generated hooks
  const {
    data,
    isLoading: vendorsLoading,
    refetch,
  } = useGetVendorsQuery({
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit: 10,
  });

  const [updateVendorStatus] = useUpdateVendorStatusMutation();
  const [exportVendors] = useExportVendorsMutation();

  const handleStatusUpdate = async (status: VendorStatus) => {
    if (!selectedVendor) return;

    try {
      await updateVendorStatus({
        id: selectedVendor.id,
        status: status?.toLocaleLowerCase(),
      }).unwrap();

      refetch();
      setActionDialog(null);
      setSelectedVendor(null);
    } catch (error) {
      console.error('Failed to update vendor status:', error);
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportVendors({
        filters: {
          search: searchTerm,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
        fields: [
          'storeName',
          'email',
          'phone',
          'status',
          'commissionRate',
          'totalSales',
          'createdAt',
        ],
      }).unwrap();

      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendors-export-${new Date()
        .toISOString()
        .split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export vendors:', error);
    }
  };

  const getStatusBadge = (status: VendorStatus) => {
    const statusConfig = {
      PENDING: {
        variant: 'secondary' as const,
        text: 'Pending',
        icon: <AlertCircle className="h-3 w-3" />,
      },
      ACTIVE: {
        variant: 'default' as const,
        text: 'Active',
        icon: <CheckCircle className="h-3 w-3" />,
      },
      SUSPENDED: {
        variant: 'destructive' as const,
        text: 'Suspended',
        icon: <PauseCircle className="h-3 w-3" />,
      },
      DEACTIVATED: {
        variant: 'outline' as const,
        text: 'Deactivated',
        icon: <XCircle className="h-3 w-3" />,
      },
    };

    const config = statusConfig[status];
    
    // Add a fallback for unknown status values
    if (!config) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Unknown
        </Badge>
      );
    }

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Vendor Management</CardTitle>
              <CardDescription>
                Approve, suspend, or deactivate vendors. Manage vendor status and
                review details.
              </CardDescription>
            </div>
            <Button onClick={handleExport} disabled={vendorsLoading}>
              <Download className="h-4 w-4 mr-2" />
              Export Vendors
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as VendorStatus | 'all')
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {vendorsLoading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : data?.data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No vendors found matching your criteria.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {vendor.storeName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{vendor.user?.email}</span>
                          <span className="text-sm text-muted-foreground">
                            {vendor.user?.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                      <TableCell>{vendor.currentCommissionRate || 0}%</TableCell>
                      <TableCell>
                        $
                        {vendor.performance?.totalSales?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell>
                        {new Date(vendor.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {vendor.status !== 'ACTIVE' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedVendor(vendor);
                                  setActionDialog('approve');
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {vendor.status !== 'SUSPENDED' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedVendor(vendor);
                                  setActionDialog('suspend');
                                }}
                              >
                                <PauseCircle className="h-4 w-4 mr-2 text-amber-600" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            {vendor.status !== 'DEACTIVATED' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedVendor(vendor);
                                  setActionDialog('deactivate');
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                Deactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {data && data.pagination.pages > 1 && (
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {data.data.length} of {data.pagination.total} vendors
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page >= data.pagination.pages}
                onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Action Confirmation Dialogs */}
      <Dialog
        open={!!actionDialog}
        onOpenChange={(open) => !open && setActionDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog === 'approve' && 'Approve Vendor'}
              {actionDialog === 'suspend' && 'Suspend Vendor'}
              {actionDialog === 'deactivate' && 'Deactivate Vendor'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog === 'approve' &&
                `Are you sure you want to approve ${selectedVendor?.storeName}? This will allow them to start selling on the platform.`}
              {actionDialog === 'suspend' &&
                `Are you sure you want to suspend ${selectedVendor?.storeName}? This will temporarily prevent them from selling.`}
              {actionDialog === 'deactivate' &&
                `Are you sure you want to deactivate ${selectedVendor?.storeName}? This will permanently remove them from the platform.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (actionDialog === 'approve') handleStatusUpdate('ACTIVE');
                if (actionDialog === 'suspend') handleStatusUpdate('SUSPENDED');
                if (actionDialog === 'deactivate')
                  handleStatusUpdate('DEACTIVATED');
              }}
              disabled={vendorsLoading}
              variant={
                actionDialog === 'approve'
                  ? 'default'
                  : actionDialog === 'suspend'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {vendorsLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : actionDialog === 'approve' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : actionDialog === 'suspend' ? (
                <PauseCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalVendor;