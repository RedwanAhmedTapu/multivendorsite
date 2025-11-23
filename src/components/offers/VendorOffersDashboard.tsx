// components/offers/VendorOffersDashboard.tsx
import React, { useState } from 'react';
import { 
  useGetVendorOffersQuery, 
  useGetVendorPermissionsInfoQuery, // FIXED: Use the correct hook for vendor permissions
  useDeactivateVendorOfferMutation,
  type Offer,
  type VendorPermissions,
  type OfferFilters // FIXED: Import the correct type
} from '@/features/offerApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Plus, 
  RefreshCw, 
  Edit, 
  Power, 
  Eye,
  TrendingUp,
  Tag,
  AlertCircle
} from 'lucide-react';

export const VendorOffersDashboard: React.FC = () => {
  // FIXED: Use OfferFilters type from API instead of custom interface
  const [filters, setFilters] = useState<OfferFilters>({
    page: 1,
    limit: 20,
  });

  // FIXED: Use useGetVendorPermissionsInfoQuery which doesn't require vendorId
  const { data: offers, isLoading, refetch } = useGetVendorOffersQuery(filters);
  const { data: permissions } = useGetVendorPermissionsInfoQuery();
  const [deactivateOffer, { isLoading: isDeactivating }] = useDeactivateVendorOfferMutation();

  const handleDeactivate = async (offerId: string) => {
    try {
      await deactivateOffer(offerId).unwrap();
      toast.success('Offer deactivated successfully');
      refetch();
    } catch (error: any) {
      console.error('Failed to deactivate offer:', error);
      toast.error(error?.data?.message || 'Failed to deactivate offer');
    }
  };

  const getStatusBadgeVariant = (isActive: boolean): "default" | "secondary" => 
    isActive ? 'default' : 'secondary';

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      REGULAR_DISCOUNT: 'blue',
      VOUCHER: 'green',
      COUNTDOWN_DEAL: 'orange',
      FLASH_SALE: 'red',
      BUY_X_GET_Y: 'purple',
      FREE_SHIPPING: 'cyan',
      BUNDLE_DEAL: 'indigo',
      SEASONAL_SALE: 'pink',
    };
    return colors[type] || 'gray';
  };

  const formatOfferType = (type: string): string => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const activeOffersCount = offers?.data?.filter(o => o.isActive).length || 0;
  const permissionsData = permissions?.data;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Offers</h1>
          <p className="text-gray-600 mt-1">Manage and track your promotional offers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Offer
          </Button>
        </div>
      </div>

      {/* Permissions Card */}
      {permissionsData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Vendor Permissions & Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-600">Max Discount</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-base">
                    {permissionsData.maxDiscountPercent}%
                  </Badge>
                  <span className="text-xs text-gray-500">
                    or ${permissionsData.maxDiscountAmount}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-600">Active Offers</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={activeOffersCount >= permissionsData.maxActiveOffers ? "destructive" : "default"}
                    className="text-base"
                  >
                    {activeOffersCount} / {permissionsData.maxActiveOffers}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-600">Approval Status</span>
                <Badge 
                  variant={permissionsData.requiresApproval ? "secondary" : "default"}
                  className="mt-1 w-fit"
                >
                  {permissionsData.requiresApproval ? 'Requires Approval' : 'Auto-Approved'}
                </Badge>
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-600">Allowed Offer Types</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {permissionsData.canCreateRegular && (
                    <Badge variant="outline" className="text-xs">Regular</Badge>
                  )}
                  {permissionsData.canCreateVoucher && (
                    <Badge variant="outline" className="text-xs">Voucher</Badge>
                  )}
                  {permissionsData.canCreateFlashSale && (
                    <Badge variant="outline" className="text-xs">Flash</Badge>
                  )}
                  {permissionsData.canCreateCountdown && (
                    <Badge variant="outline" className="text-xs">Countdown</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Offers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {offers?.data?.length || 0}
                </p>
              </div>
              <Tag className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeOffersCount}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {offers?.data?.filter(o => o.status === 'PENDING').length || 0}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold text-purple-600">
                  {offers?.data?.reduce((sum, o) => sum + o.currentUsageCount, 0) || 0}
                </p>
              </div>
              <Eye className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Offer Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : offers?.data && offers.data.length > 0 ? (
                offers.data.map((offer: Offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-medium">{offer.title}</p>
                        {offer.description && (
                          <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                            {offer.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatOfferType(offer.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {offer.discountType === 'PERCENTAGE' 
                          ? `${offer.discountValue}%` 
                          : `$${offer.discountValue}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={getStatusBadgeVariant(offer.isActive)}>
                          {offer.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {offer.status === 'PENDING' && (
                          <Badge variant="secondary" className="text-xs">
                            Awaiting Approval
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {offer.currentUsageCount}
                        </span>
                        {offer.totalUsageLimit && (
                          <span className="text-xs text-gray-500">
                            / {offer.totalUsageLimit} limit
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {offer.validTo ? (
                        <span className="text-sm">
                          {new Date(offer.validTo).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">No expiry</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        {offer.isActive && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeactivate(offer.id)}
                            disabled={isDeactivating}
                          >
                            <Power className="w-3 h-3 mr-1" />
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Tag className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-500 font-medium">No offers found</p>
                      <p className="text-sm text-gray-400">
                        Create your first offer to get started
                      </p>
                      <Button className="mt-2">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Offer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {offers?.pagination && offers.pagination.total > filters.limit! && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Showing {((filters.page! - 1) * filters.limit!) + 1} to{' '}
                {Math.min(filters.page! * filters.limit!, offers.pagination.total)} of{' '}
                {offers.pagination.total} offers
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === 1}
                  onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page! * filters.limit! >= offers.pagination.total}
                  onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};