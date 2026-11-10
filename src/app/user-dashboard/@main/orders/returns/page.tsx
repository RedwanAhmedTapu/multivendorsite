"use client";

// Customer returns — NOT AVAILABLE ONLINE YET.
//
// There is no backend for customer return requests (no API, no record), so
// this page must never pretend a request was submitted. It used to show a
// form whose "Submit" only waited 1.2 s and then displayed "Return request
// submitted" with a made-up reference number — nothing was sent anywhere.
// Until the returns workflow exists, customers are pointed to FinixMart
// support with their order number.

import Link from "next/link";
import { ArrowLeft, Headset, Info, RotateCcw } from "lucide-react";

export default function ReturnOrderPage() {
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/user-dashboard/orders"
          aria-label="Back to my orders"
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-base font-semibold text-slate-800">Returns</h1>
      </div>

      <section className="bg-white border border-slate-100 rounded-2xl p-8 text-center" aria-labelledby="returns-unavailable-title">
        <div className="w-14 h-14 rounded-3xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <RotateCcw className="w-7 h-7 text-amber-500" aria-hidden="true" />
        </div>
        <h2 id="returns-unavailable-title" className="text-base font-semibold text-slate-800 mb-2">
          Return requests can&apos;t be submitted online yet
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
          To return an item from a delivered order, please contact FinixMart support and include your order number. Our team will
          tell you whether the item can be returned and how.
        </p>

        <div className="mt-5 flex items-start gap-2 text-left bg-slate-50 rounded-xl px-4 py-3">
          <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="text-xs text-slate-500 leading-relaxed">
            Nothing is submitted from this page, so no return has been requested yet.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link
            href="/help-center"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 px-5 py-2.5 rounded-xl transition-colors"
          >
            <Headset className="w-4 h-4" aria-hidden="true" />
            Contact support
          </Link>
          <Link
            href="/user-dashboard/orders"
            className="text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-xl transition-colors"
          >
            My orders
          </Link>
        </div>
      </section>
    </div>
  );
}
