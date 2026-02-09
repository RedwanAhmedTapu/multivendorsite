import React, { useState } from "react";
import { 
  Package, 
  Truck, 
  CheckCircle,
  XCircle,
  Eye,
  Printer,
  MessageSquare,
  MoreVertical
} from "lucide-react";
import { Order, OrderStatus, PaymentStatus, ShippingStatus } from "@/types/order";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface VendorOrderTableProps {
  orders: Order[];
  vendorId: string;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateShippingStatus: (orderId: string, status: ShippingStatus) => void;
}

const VendorOrderTable: React.FC<VendorOrderTableProps> = ({
  orders,
  vendorId,
  onUpdateOrderStatus,
  onUpdateShippingStatus,
}) => {
  const [activeTab, setActiveTab] = useState("all");

  // Filter orders that belong to this vendor
  const vendorOrders = orders.filter(order => 
    order.items.some(item => item.vendorId === vendorId)
  );

  // Filter by status
  const filteredOrders = vendorOrders.filter(order => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return order.orderStatus === OrderStatus.PENDING;
    if (activeTab === "processing") return order.orderStatus === OrderStatus.PROCESSING;
    if (activeTab === "shipped") return order.orderStatus === OrderStatus.SHIPPED;
    return true;
  });

  // Calculate vendor-specific totals
  const getVendorItems = (order: Order) => {
    return order.items.filter(item => item.vendorId === vendorId);
  };

  const getVendorTotal = (order: Order) => {
    return getVendorItems(order).reduce((sum, item) => sum + item.total, 0);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const config = {
      [OrderStatus.PENDING]: "bg-yellow-100 text-yellow-800",
      [OrderStatus.CONFIRMED]: "bg-blue-100 text-blue-800",
      [OrderStatus.PROCESSING]: "bg-purple-100 text-purple-800",
      [OrderStatus.SHIPPED]: "bg-indigo-100 text-indigo-800",
      [OrderStatus.DELIVERED]: "bg-green-100 text-green-800",
      [OrderStatus.CANCELLED]: "bg-red-100 text-red-800",
    };
    return (
      <Badge variant="outline" className={`${config[status]} border-0 text-xs`}>
        {status}
      </Badge>
    );
  };

  const stats = {
    total: vendorOrders.length,
    pending: vendorOrders.filter(o => o.orderStatus === OrderStatus.PENDING).length,
    processing: vendorOrders.filter(o => o.orderStatus === OrderStatus.PROCESSING).length,
    revenue: vendorOrders
      .filter(o => o.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, order) => sum + getVendorTotal(order), 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Orders</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            <div className="text-sm text-gray-500">Processing</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              ৳{stats.revenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Revenue</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="shipped">Shipped</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No orders found
            </div>
          ) : (
            filteredOrders.map((order) => {
              const vendorItems = getVendorItems(order);
              const vendorTotal = getVendorTotal(order);

              return (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Order Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{order.orderNumber}</h3>
                            {getStatusBadge(order.orderStatus)}
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">৳{vendorTotal.toLocaleString()}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Printer className="mr-2 h-4 w-4" />
                                Print Packing Slip
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Message Customer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Customer</div>
                          <div>{order.customerName}</div>
                          <div className="text-gray-500">{order.customerEmail}</div>
                        </div>
                        <div>
                          <div className="font-medium">Shipping</div>
                          <div>{order.shippingAddress.city}</div>
                          <div className="text-gray-500">{order.shippingStatus}</div>
                        </div>
                        <div>
                          <div className="font-medium">Payment</div>
                          <div>{order.paymentMethod}</div>
                          <Badge variant={
                            order.paymentStatus === PaymentStatus.PAID ? "default" : 
                            order.paymentStatus === PaymentStatus.PENDING ? "secondary" : "destructive"
                          } className="mt-1">
                            {order.paymentStatus}
                          </Badge>
                        </div>
                      </div>

                      <Separator />

                      {/* Order Items */}
                      <div>
                        <h4 className="font-medium mb-2">Items</h4>
                        <div className="space-y-3">
                          {vendorItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt={item.productName}
                                className="w-12 h-12 rounded object-cover"
                              />
                              <div className="flex-1">
                                <div className="font-medium">{item.productName}</div>
                                {item.variantName && (
                                  <div className="text-sm text-gray-500">{item.variantName}</div>
                                )}
                                <div className="text-sm text-gray-500">
                                  Qty: {item.quantity} × ৳{item.price.toLocaleString()}
                                </div>
                              </div>
                              <div className="font-semibold">
                                ৳{item.total.toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-4">
                        {order.orderStatus === OrderStatus.PENDING && (
                          <Button
                            size="sm"
                            onClick={() => onUpdateOrderStatus(order.id, OrderStatus.CONFIRMED)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirm Order
                          </Button>
                        )}
                        {order.orderStatus === OrderStatus.CONFIRMED && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateOrderStatus(order.id, OrderStatus.PROCESSING)}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Start Processing
                          </Button>
                        )}
                        {order.orderStatus === OrderStatus.PROCESSING && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onUpdateOrderStatus(order.id, OrderStatus.SHIPPED);
                              onUpdateShippingStatus(order.id, ShippingStatus.IN_TRANSIT);
                            }}
                          >
                            <Truck className="mr-2 h-4 w-4" />
                            Mark as Shipped
                          </Button>
                        )}
                        {order.orderStatus !== OrderStatus.CANCELLED && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onUpdateOrderStatus(order.id, OrderStatus.CANCELLED)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Order
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorOrderTable;