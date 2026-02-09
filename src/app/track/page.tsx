// app/track/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  CheckCircle,
  Truck,
  MapPin,
  Clock,
  Search,
  Copy,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useLazyTrackOrderQuery, type PublicTrackingData } from "@/features/courierApi";

export default function TrackOrderPage() {
  const [trackingId, setTrackingId] = useState("");
  const [trackOrder, { data, isLoading, error }] = useLazyTrackOrderQuery();

  const handleTrack = () => {
    if (trackingId.trim()) {
      trackOrder({ trackingId: trackingId.trim() });
    }
  };

  const trackingData = data?.data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Track Your Order</h1>
          <p className="text-muted-foreground">
            Enter your tracking ID to see real-time delivery status
          </p>
        </div>

        {/* Tracking Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enter Tracking ID</CardTitle>
            <CardDescription>
              You can find your tracking ID in the order confirmation email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="e.g., PATH123456 or RDX789012"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                  className="text-lg"
                />
              </div>
              <Button onClick={handleTrack} disabled={isLoading || !trackingId.trim()} size="lg">
                {isLoading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Tracking...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Track Order
                  </>
                )}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Order not found. Please check your tracking ID and try again.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Tracking Results */}
        {trackingData && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Order Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Order Status</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      Tracking ID: {trackingData.trackingId}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(trackingData.trackingId);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-lg py-2 px-4">
                    {trackingData.courierName}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Current Status */}
                  <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <StatusIcon status={trackingData.status} />
                    <div className="flex-1">
                      <p className="text-lg font-semibold">{formatStatus(trackingData.status)}</p>
                      <p className="text-sm text-muted-foreground">
                        {trackingData.courierStatus}
                      </p>
                    </div>
                  </div>

                  {/* Delivery Location */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Delivering to:</span>
                    <span className="font-medium">{trackingData.recipientCity}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Timeline</CardTitle>
                <CardDescription>Track your order's journey</CardDescription>
              </CardHeader>
              <CardContent>
                <OrderTimeline history={trackingData.trackingHistory} />
              </CardContent>
            </Card>

            {/* Delivery Status Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <DeliverySteps currentStatus={trackingData.status} />
              </CardContent>
            </Card>

            {/* Help Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  If you have any questions about your delivery, please contact our support team.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button variant="outline" size="sm">
                    <Package className="w-4 h-4 mr-2" />
                    View Order Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sample Tracking IDs (for demo) */}
        {!trackingData && !isLoading && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Need a tracking ID?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your tracking ID is sent via email and SMS after your order is confirmed.
                Check your inbox or contact support for assistance.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ==================== STATUS ICON ====================
function StatusIcon({ status }: { status: string }) {
  const iconMap: Record<string, any> = {
    PENDING_PICKUP: Clock,
    READY_FOR_PICKUP: Package,
    PICKED_UP: Truck,
    IN_TRANSIT: Truck,
    OUT_FOR_DELIVERY: Truck,
    DELIVERED: CheckCircle,
  };

  const Icon = iconMap[status] || Package;
  const colorMap: Record<string, string> = {
    PENDING_PICKUP: "text-yellow-600",
    READY_FOR_PICKUP: "text-blue-600",
    PICKED_UP: "text-purple-600",
    IN_TRANSIT: "text-purple-600",
    OUT_FOR_DELIVERY: "text-orange-600",
    DELIVERED: "text-green-600",
  };

  return (
    <div className={`p-3 rounded-full bg-background ${colorMap[status] || "text-gray-600"}`}>
      <Icon className="w-6 h-6" />
    </div>
  );
}

// ==================== FORMAT STATUS ====================
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING_PICKUP: "Order Confirmed",
    READY_FOR_PICKUP: "Ready for Pickup",
    PICKED_UP: "Picked Up by Courier",
    IN_TRANSIT: "In Transit",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered Successfully",
    RETURNED: "Returned to Sender",
    CANCELLED: "Order Cancelled",
  };

  return statusMap[status] || status;
}

// ==================== ORDER TIMELINE ====================
function OrderTimeline({ history }: { history: Array<{ status: string; message: string; timestamp: string }> }) {
  return (
    <div className="space-y-4">
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No tracking updates available yet
        </p>
      ) : (
        history.map((update, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full ${
                  index === 0 ? "bg-primary" : "bg-muted-foreground"
                }`}
              />
              {index < history.length - 1 && (
                <div className="w-0.5 h-full min-h-[40px] bg-muted-foreground/30" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <p className="font-medium">{update.message}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(update.timestamp).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ==================== DELIVERY STEPS ====================
function DeliverySteps({ currentStatus }: { currentStatus: string }) {
  const steps = [
    { status: "PENDING_PICKUP", label: "Order Placed", icon: Package },
    { status: "PICKED_UP", label: "Picked Up", icon: Truck },
    { status: "IN_TRANSIT", label: "In Transit", icon: Truck },
    { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: Truck },
    { status: "DELIVERED", label: "Delivered", icon: CheckCircle },
  ];

  const currentIndex = steps.findIndex((step) => step.status === currentStatus);

  return (
    <div className="space-y-2">
      {steps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div
            key={step.status}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              isCurrent ? "bg-primary/10 border border-primary/20" : ""
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <step.icon className="w-4 h-4" />
            </div>
            <p
              className={`font-medium ${
                isCompleted ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </p>
            {isCurrent && (
              <Badge variant="default" className="ml-auto">
                Current
              </Badge>
            )}
            {isCompleted && !isCurrent && (
              <CheckCircle className="w-4 h-4 text-primary ml-auto" />
            )}
          </div>
        );
      })}
    </div>
  );
}