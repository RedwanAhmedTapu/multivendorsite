// components/vendor-management/VendorPerformanceManager.tsx
'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetVendorByIdQuery } from '@/features/vendorManageApi';

interface VendorPerformanceManagerProps {
  vendorId: string;
  onBackToList: () => void;
}

export default function VendorPerformanceManager({ 
  vendorId, 
  onBackToList 
}: VendorPerformanceManagerProps) {
  const { data: vendorResp, isLoading, error, refetch } = useGetVendorByIdQuery(vendorId);
const vendor = vendorResp;
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={onBackToList} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
        </Button>
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={onBackToList}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
        </Button>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium">Failed to load vendor data</h3>
            <Button className="mt-4" onClick={() => refetch()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBackToList}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
        </Button>
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={vendor.avatar} />
              <AvatarFallback>{vendor.storeName?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{vendor.storeName}</h1>
              <Badge variant={ vendor.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {vendor.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {vendor.performance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${vendor.performance.totalSales?.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendor.performance.totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Fulfillment Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendor.performance.fulfillmentRatePct?.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendor.performance.avgRating?.toFixed(1)}/5</div>
            </CardContent>
          </Card>
        </div>
      )}

      {vendor._count && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{vendor._count.products}</p>
                <p className="text-sm text-muted-foreground">Products</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{vendor._count.orders}</p>
                <p className="text-sm text-muted-foreground">Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{vendor._count.flags}</p>
                <p className="text-sm text-muted-foreground">Flags</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}