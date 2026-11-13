// components/vendor-management/VendorPerformanceManager.tsx
'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sk } from '@/components/admin/ui/AdminSkeletons';
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
      <div aria-busy="true" aria-label="Loading vendor performance" className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
          </Button>
          <Sk className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Sk className="h-6 w-48" />
            <Sk className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Sk soft className="h-3 w-24" />
              </CardHeader>
              <CardContent>
                <Sk className="h-7 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Sk className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Sk className="h-7 w-12" />
                  <Sk soft className="h-3 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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

      {(() => {
        // Create-time defaults (0 sales, 100% fulfilment, never calculated) are
        // not real metrics — showing them made fresh vendors look perfect.
        const perf = vendor.performance;
        const hasData =
          !!perf &&
          !!perf.lastCalculatedAt &&
          (perf.totalOrders ?? 0) > 0;

        if (!hasData) {
          return (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <CardDescription>
                  No data yet — metrics appear after the vendor&apos;s first completed orders are calculated.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">No data</div>
              </CardContent>
            </Card>
          );
        }

        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${perf.totalSales?.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{perf.totalOrders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Fulfillment Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{perf.fulfillmentRatePct?.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{perf.avgRating?.toFixed(1)}/5</div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

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