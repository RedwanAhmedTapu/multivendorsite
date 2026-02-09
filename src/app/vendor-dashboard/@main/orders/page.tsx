// app/vendor/orders/courier/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  CheckCircle,
  Clock,
  Truck,
  Download,
  MoreVertical,
  Search,
  Filter,
  MapPin,
  Phone,
  Calendar,
  Printer,
} from "lucide-react";
import {
  useGetVendorCourierOrdersQuery,
  useVendorMarkReadyForPickupMutation,
  useLazyGetShippingLabelQuery,
  type CourierOrder,
} from "@/features/courierApi";

export default function VendorCourierOrdersPage() {
  const vendorId = "vendor-123"; // Get from auth context
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<CourierOrder | null>(null);

  const { data: ordersData, isLoading } = useGetVendorCourierOrdersQuery({
    vendorId,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page: 1,
    limit: 20,
  });

  const orders = ordersData?.data || [];

  const stats = [
    {
      label: "Pending Pickup",
      value: orders.filter((o) => o.status === "PENDING_PICKUP").length,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      label: "Ready for Pickup",
      value: orders.filter((o) => o.status === "READY_FOR_PICKUP").length,
      icon: Package,
      color: "text-blue-600",
    },
    {
      label: "In Transit",
      value: orders.filter((o) => o.status === "IN_TRANSIT").length,
      icon: Truck,
      color: "text-purple-600",
    },
    {
      label: "Delivered",
      value: orders.filter((o) => o.status === "DELIVERED").length,
      icon: CheckCircle,
      color: "text-green-600",
    },
  ];

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.courierTrackingId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.courierOrderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.recipientName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courier Orders</h1>
          <p className="text-muted-foreground">
            Manage your shipments and track deliveries
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>View and manage your courier shipments</CardDescription>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 pt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by tracking ID, order ID, or customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="PENDING_PICKUP">Pending</TabsTrigger>
                <TabsTrigger value="READY_FOR_PICKUP">Ready</TabsTrigger>
                <TabsTrigger value="IN_TRANSIT">In Transit</TabsTrigger>
                <TabsTrigger value="DELIVERED">Delivered</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Details</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>COD Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Loading orders...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">#{order.courierOrderId}</p>
                          <p className="text-sm text-muted-foreground">
                            Track: {order.courierTrackingId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.itemQuantity} items • {order.itemWeight}kg
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{order.recipientName}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {order.recipientPhone}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {order.deliveryLocationId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {order.courier_providers?.name || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ৳{order.codAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <OrderActions order={order} vendorId={vendorId} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

// ==================== STATUS BADGE ====================
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: any }> = {
    PENDING_PICKUP: { label: "Pending Pickup", variant: "secondary" },
    READY_FOR_PICKUP: { label: "Ready for Pickup", variant: "default" },
    PICKED_UP: { label: "Picked Up", variant: "default" },
    IN_TRANSIT: { label: "In Transit", variant: "default" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", variant: "default" },
    DELIVERED: { label: "Delivered", variant: "default" },
    RETURNED: { label: "Returned", variant: "destructive" },
    CANCELLED: { label: "Cancelled", variant: "destructive" },
  };

  const config = statusConfig[status] || { label: status, variant: "secondary" };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ==================== ORDER ACTIONS ====================
function OrderActions({ order, vendorId }: { order: CourierOrder; vendorId: string }) {
  const [markReady, { isLoading: isMarking }] = useVendorMarkReadyForPickupMutation();
  const [getLabel, { isLoading: isDownloading }] = useLazyGetShippingLabelQuery();

  const handleMarkReady = async () => {
    try {
      await markReady({
        orderId: order.orderId,
        vendorId,
      }).unwrap();
      alert("Order marked as ready for pickup!");
    } catch (error) {
      alert("Failed to mark order as ready. Please try again.");
    }
  };

  const handleDownloadLabel = async () => {
    try {
      const result = await getLabel({
        orderId: order.orderId,
        vendorId,
      }).unwrap();

      // Generate and download label (you'd implement actual label generation)
      console.log("Label data:", result.data);
      alert("Label downloaded successfully!");
    } catch (error) {
      alert("Failed to download label. Please try again.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {order.status === "PENDING_PICKUP" && (
          <DropdownMenuItem onClick={handleMarkReady} disabled={isMarking}>
            <CheckCircle className="w-4 h-4 mr-2" />
            {isMarking ? "Marking..." : "Mark Ready for Pickup"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleDownloadLabel} disabled={isDownloading}>
          <Printer className="w-4 h-4 mr-2" />
          {isDownloading ? "Downloading..." : "Print Shipping Label"}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Package className="w-4 h-4 mr-2" />
          View Details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ==================== ORDER DETAILS MODAL ====================
function OrderDetailsModal({
  order,
  open,
  onClose,
}: {
  order: CourierOrder;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            Tracking ID: {order.courierTrackingId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-2">
            <h3 className="font-semibold">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{order.recipientName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{order.recipientPhone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Address</p>
                <p className="font-medium">{order.recipientAddress}</p>
              </div>
            </div>
          </div>

          {/* Shipment Details */}
          <div className="space-y-2">
            <h3 className="font-semibold">Shipment Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Weight</p>
                <p className="font-medium">{order.itemWeight} kg</p>
              </div>
              <div>
                <p className="text-muted-foreground">Quantity</p>
                <p className="font-medium">{order.itemQuantity} items</p>
              </div>
              <div>
                <p className="text-muted-foreground">COD Amount</p>
                <p className="font-medium">৳{order.codAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Delivery Charge</p>
                <p className="font-medium">৳{order.deliveryCharge.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Tracking History */}
          <div className="space-y-2">
            <h3 className="font-semibold">Tracking History</h3>
            <div className="space-y-2">
              {order.courier_tracking_history?.length > 0 ? (
                order.courier_tracking_history.map((history, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    <div>
                      <p className="font-medium">{history.messageEn}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(history.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No tracking updates yet</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}