// /payment/failed — where the payment gateway sends the customer back. The screen
// shows the PERSISTED payment state only (see PaymentResultView); this route
// name is never treated as proof of the outcome.
import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentResultFallback, PaymentResultView } from "@/components/payment/PaymentResultView";

export const metadata: Metadata = { title: "Payment result", robots: { index: false, follow: false } };

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<PaymentResultFallback />}>
      <PaymentResultView landing="failed" />
    </Suspense>
  );
}
