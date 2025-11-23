"use client";

import React, { useState } from "react";
import { useApplyVoucherMutation } from "@/features/offerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const CheckoutPage: React.FC = () => {
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);

  const [applyVoucher, { isLoading: isApplying }] = useApplyVoucherMutation();

  const cartItems = [
    { productId: "prod-1", quantity: 2, price: 50, vendorId: "vendor-1" },
    { productId: "prod-2", quantity: 1, price: 30, vendorId: "vendor-1" },
  ];

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleApplyVoucher = async () => {
    try {
      const result = await applyVoucher({
        code: voucherCode,
        orderData: { items: cartItems, subtotal },
      }).unwrap();

      setAppliedDiscount(result.data?.discount || 0);
      setAppliedVoucher(result.data?.voucher);

      toast.success("Voucher applied successfully!");
    } catch (error: any) {
      toast.error(error?.data?.message || "Invalid voucher");
      console.error("Voucher error:", error);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedDiscount(0);
    setAppliedVoucher(null);
    setVoucherCode("");
    toast("Voucher removed");
  };

  const total = subtotal - appliedDiscount;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: ORDER SUMMARY */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {cartItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex justify-between border-b py-4"
                >
                  <div>
                    <p className="font-medium">Product {item.productId}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: VOUCHER + TOTAL */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apply Voucher</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter voucher code"
                  value={voucherCode}
                  onChange={(e) =>
                    setVoucherCode(e.target.value.toUpperCase())
                  }
                  disabled={isApplying || appliedVoucher}
                />
                <Button
                  onClick={handleApplyVoucher}
                  disabled={!voucherCode || appliedVoucher || isApplying}
                >
                  {isApplying ? "..." : "Apply"}
                </Button>
              </div>

              {appliedVoucher && (
                <div className="bg-green-50 border border-green-200 rounded p-3 flex justify-between">
                  <div>
                    <Badge className="mb-1">Applied</Badge>
                    <p className="font-medium text-green-800">
                      {appliedVoucher.title}
                    </p>
                    <p className="text-sm text-green-600">
                      {appliedVoucher.discountType === "PERCENTAGE"
                        ? `${appliedVoucher.discountValue}% off`
                        : `$${appliedVoucher.discountValue} off`}
                    </p>
                  </div>

                  <Button size="sm" variant="ghost" onClick={handleRemoveVoucher}>
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* TOTAL SECTION */}
          <Card>
            <CardHeader>
              <CardTitle>Total</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              {appliedDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${appliedDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <Button className="w-full" size="lg">
                Proceed to Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
