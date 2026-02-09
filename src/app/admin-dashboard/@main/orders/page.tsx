"use client";

import { useState } from "react";
import { generateOrders } from "@/data/orders";
import { OrderStatus, PaymentStatus, ShippingStatus } from "@/types/order";
import OrderTable from "@/components/admin/order/OrderTable";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState(generateOrders());
  const [selectedOrders, setSelectedOrders] = useState<Record<string, boolean>>({});

  const handleSelectAll = (checked: boolean) => {
    const newSelected: Record<string, boolean> = {};
    if (checked) {
      orders.forEach(order => {
        newSelected[order.id] = true;
      });
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    setSelectedOrders(prev => ({
      ...prev,
      [orderId]: checked
    }));
  };

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, orderStatus: status, updatedAt: new Date() }
        : order
    ));
  };

  const handleUpdatePaymentStatus = (orderId: string, status: PaymentStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, paymentStatus: status, updatedAt: new Date() }
        : order
    ));
  };

  const handleUpdateShippingStatus = (orderId: string, status: ShippingStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, shippingStatus: status, updatedAt: new Date() }
        : order
    ));
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <p className="text-gray-500">Manage and track all customer orders</p>
      </div>
      
      <OrderTable
        orders={orders}
        isLoading={false}
        selectedOrders={selectedOrders}
        onSelectAll={handleSelectAll}
        onSelectOrder={handleSelectOrder}
        onUpdateStatus={handleUpdateStatus}
        onUpdatePaymentStatus={handleUpdatePaymentStatus}
        onUpdateShippingStatus={handleUpdateShippingStatus}
      />
    </div>
  );
}