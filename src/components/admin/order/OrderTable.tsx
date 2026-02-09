import React, { useState } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  Eye, 
  Package, 
  Truck, 
  CreditCard,
  MoreVertical,
  Filter,
  Download,
  Printer,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ArrowUpDown
} from "lucide-react";
import { Order, OrderStatus, PaymentStatus, ShippingStatus } from "@/types/order";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrderTableProps {
  orders: Order[];
  isLoading: boolean;
  selectedOrders: { [orderId: string]: boolean };
  onSelectAll: (checked: boolean) => void;
  onSelectOrder: (orderId: string, checked: boolean) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onUpdatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
  onUpdateShippingStatus: (orderId: string, status: ShippingStatus) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  isLoading,
  selectedOrders,
  onSelectAll,
  onSelectOrder,
  onUpdateStatus,
  onUpdatePaymentStatus,
  onUpdateShippingStatus,
}) => {
  const [expandedOrders, setExpandedOrders] = useState<{
    [orderId: string]: boolean;
  }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7days");

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const getStatusBadge = (status: OrderStatus) => {
    const config = {
      [OrderStatus.PENDING]: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      [OrderStatus.CONFIRMED]: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      [OrderStatus.PROCESSING]: { color: "bg-purple-100 text-purple-800", icon: RefreshCw },
      [OrderStatus.SHIPPED]: { color: "bg-indigo-100 text-indigo-800", icon: Truck },
      [OrderStatus.DELIVERED]: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      [OrderStatus.CANCELLED]: { color: "bg-red-100 text-red-800", icon: XCircle },
      [OrderStatus.RETURNED]: { color: "bg-orange-100 text-orange-800", icon: RefreshCw },
      [OrderStatus.REFUNDED]: { color: "bg-gray-100 text-gray-800", icon: CreditCard },
    };
    const { color, icon: Icon } = config[status];
    return (
      <Badge variant="outline" className={`${color} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const config = {
      [PaymentStatus.PENDING]: "bg-yellow-100 text-yellow-800",
      [PaymentStatus.PAID]: "bg-green-100 text-green-800",
      [PaymentStatus.FAILED]: "bg-red-100 text-red-800",
      [PaymentStatus.REFUNDED]: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge variant="outline" className={`${config[status]} border-0 text-xs`}>
        {status}
      </Badge>
    );
  };

  const getShippingStatusBadge = (status: ShippingStatus) => {
    const config = {
      [ShippingStatus.PENDING]: "bg-yellow-100 text-yellow-800",
      [ShippingStatus.IN_TRANSIT]: "bg-blue-100 text-blue-800",
      [ShippingStatus.DELIVERED]: "bg-green-100 text-green-800",
      [ShippingStatus.FAILED]: "bg-red-100 text-red-800",
      [ShippingStatus.RETURNED]: "bg-orange-100 text-orange-800",
    };
    return (
      <Badge variant="outline" className={`${config[status]} border-0 text-xs`}>
        {status}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString("en-BD")}`;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.orderStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.orderStatus === OrderStatus.PENDING).length,
    processing: orders.filter(o => o.orderStatus === OrderStatus.PROCESSING).length,
    shipped: orders.filter(o => o.orderStatus === OrderStatus.SHIPPED).length,
    revenue: orders.filter(o => o.paymentStatus === PaymentStatus.PAID).reduce((sum, o) => sum + o.total, 0),
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading orders...</div>;
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
              <CardDescription>Total Orders</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-yellow-600">{stats.pending}</CardTitle>
              <CardDescription>Pending</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-blue-600">{stats.processing}</CardTitle>
              <CardDescription>Processing</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-green-600">
                {formatCurrency(stats.revenue)}
              </CardTitle>
              <CardDescription>Revenue</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search orders, customers..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.values(OrderStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 p-4">
                  <Checkbox
                    checked={filteredOrders.length > 0 && 
                      filteredOrders.every(order => selectedOrders[order.id])}
                    onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                  />
                </th>
                <th className="p-4 text-left text-sm font-semibold">Order</th>
                <th className="p-4 text-left text-sm font-semibold">Customer</th>
                <th className="p-4 text-left text-sm font-semibold">Date</th>
                <th className="p-4 text-left text-sm font-semibold">Status</th>
                <th className="p-4 text-left text-sm font-semibold">Payment</th>
                <th className="p-4 text-left text-sm font-semibold">Shipping</th>
                <th className="p-4 text-left text-sm font-semibold">Total</th>
                <th className="p-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrders[order.id];
                const vendorGroups = order.items.reduce((groups, item) => {
                  if (!groups[item.vendorId]) {
                    groups[item.vendorId] = {
                      vendorName: item.vendorName,
                      items: [],
                      total: 0
                    };
                  }
                  groups[item.vendorId].items.push(item);
                  groups[item.vendorId].total += item.total;
                  return groups;
                }, {} as Record<string, any>);

                return (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedOrders[order.id] || false}
                          onCheckedChange={(checked) => 
                            onSelectOrder(order.id, checked as boolean)
                          }
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(order.id)}
                            className="h-6 w-6 p-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <div>
                            <div className="font-medium">{order.orderNumber}</div>
                            <div className="text-sm text-gray-500">
                              {order.items.length} item{order.items.length > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-sm text-gray-500">{order.customerEmail}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="p-0 h-auto">
                              {getStatusBadge(order.orderStatus)}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {Object.values(OrderStatus).map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => onUpdateStatus(order.id, status)}
                              >
                                {status}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="p-0 h-auto">
                              {getPaymentStatusBadge(order.paymentStatus)}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {Object.values(PaymentStatus).map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => onUpdatePaymentStatus(order.id, status)}
                              >
                                {status}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="p-0 h-auto">
                              {getShippingStatusBadge(order.shippingStatus)}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {Object.values(ShippingStatus).map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => onUpdateShippingStatus(order.id, status)}
                              >
                                {status}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="p-4 font-medium">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Order Details: {order.orderNumber}</DialogTitle>
                                <DialogDescription>
                                  Placed on {formatDate(order.createdAt)}
                                </DialogDescription>
                              </DialogHeader>
                              <Tabs defaultValue="details">
                                <TabsList>
                                  <TabsTrigger value="details">Details</TabsTrigger>
                                  <TabsTrigger value="items">Items</TabsTrigger>
                                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                                </TabsList>
                                <TabsContent value="details">
                                  {/* Order details content */}
                                </TabsContent>
                              </Tabs>
                            </DialogContent>
                          </Dialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Printer className="mr-2 h-4 w-4" />
                                Print Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Truck className="mr-2 h-4 w-4" />
                                Add Tracking
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Cancel Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="p-4 bg-gray-50">
                          <div className="pl-12">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div>
                                <h4 className="font-medium mb-2">Shipping Address</h4>
                                <p className="text-sm">
                                  {order.shippingAddress.street}<br />
                                  {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                                  {order.shippingAddress.postalCode}<br />
                                  {order.shippingAddress.country}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Payment Information</h4>
                                <p className="text-sm">
                                  Method: {order.paymentMethod}<br />
                                  Status: {order.paymentStatus}<br />
                                  Amount: {formatCurrency(order.total)}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Vendor Breakdown</h4>
                                <div className="space-y-2">
                                  {Object.values(vendorGroups).map((group: any, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span>{group.vendorName}</span>
                                      <span>{formatCurrency(group.total)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <Separator className="my-4" />
                            <h4 className="font-medium mb-2">Order Items</h4>
                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={item.image}
                                      alt={item.productName}
                                      className="w-10 h-10 rounded object-cover"
                                    />
                                    <div>
                                      <div>{item.productName}</div>
                                      {item.variantName && (
                                        <div className="text-gray-500">{item.variantName}</div>
                                      )}
                                      <div className="text-gray-500">
                                        Vendor: {item.vendorName}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div>{item.quantity} × {formatCurrency(item.price)}</div>
                                    <div className="font-medium">
                                      {formatCurrency(item.total)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default OrderTable;