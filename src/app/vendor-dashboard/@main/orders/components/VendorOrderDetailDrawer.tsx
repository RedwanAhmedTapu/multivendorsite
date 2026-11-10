"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Phone,
  User,
  Package,
  Truck,
  CreditCard,
  Calendar,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  Info,
  PackageCheck,
  ShieldCheck,
  Printer,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  FulfillmentStatusBadge,
  CourierStatusBadge,
} from "@/components/orders/OrderStatusBadge";
import {
  useGetVendorOrderByIdQuery,
  useUpdateVendorOrderStatusMutation,
  useMarkVendorOrderForDeliveryMutation,
  useConfirmVendorCodOrderMutation,
  useConfirmVendorReturnReceiptMutation,
  useGetVendorOrderShippingLabelQuery,
  type VendorAllowedStatus,
} from "@/features/vendorOrderApi";
import { VENDOR_NOTE_COPY, vendorActionError } from "@/lib/orders/vendor-order-actions";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

function fmtCurrency(n?: number) {
  if (n === undefined) return "—";
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2">
      <div className="text-slate-400">{icon}</div>
      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">{title}</h4>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="-m-3 inline-flex size-11 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-teal-600 sm:-m-2 sm:size-7"
    >
      {copied ? <Check className="w-3 h-3 text-teal-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

/**
 * Opens a new tab with a printable HTML shipping label for one shipment
 * and triggers the browser print dialog automatically. No external
 * library needed — works for any number of shipments since each is
 * printed independently (one physical label per parcel).
 */
function printShippingLabel(params: {
  orderNumber: string;
  vendorStoreName: string;
  pickupAddressLine?: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  courierProviderName: string;
  trackingId?: string;
  codAmount: number;
  itemWeight: number;
  itemQuantity: number;
  itemDescription?: string;
  shipmentLabel?: string; // e.g. "Shipment 1 of 2"
}) {
  const win = window.open("", "_blank", "width=420,height=650");
  if (!win) {
    toast.error("Popup blocked — please allow popups to print the label");
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Shipping Label — ${params.orderNumber}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            padding: 16px;
            width: 340px;
            margin: 0 auto;
            color: #000;
          }
          .label-box { border: 2px solid #000; padding: 12px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .big { font-size: 18px; font-weight: bold; }
          .small { font-size: 11px; color: #333; }
          .section-title { font-size: 10px; text-transform: uppercase; color: #555; margin-bottom: 2px; }
          .value { font-size: 14px; font-weight: 600; }
          .cod-box { border: 1px solid #000; padding: 6px; text-align: center; margin-top: 8px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="label-box">
          ${params.shipmentLabel ? `<p class="small" style="text-align:center;margin:0 0 6px;">${params.shipmentLabel}</p>` : ""}
          <div class="row">
            <span class="big">${params.courierProviderName}</span>
            <span class="small">${params.trackingId ? "#" + params.trackingId : ""}</span>
          </div>
          <div class="divider"></div>

          <p class="section-title">From</p>
          <p class="value">${params.vendorStoreName}</p>
          ${params.pickupAddressLine ? `<p class="small">${params.pickupAddressLine}</p>` : ""}

          <div class="divider"></div>

          <p class="section-title">To</p>
          <p class="value">${params.recipientName}</p>
          <p class="small">${params.recipientPhone}</p>
          <p class="small">${params.recipientAddress}</p>

          <div class="divider"></div>

          <div class="row small">
            <span>Order: ${params.orderNumber}</span>
            <span>Qty: ${params.itemQuantity}</span>
          </div>
          <div class="row small">
            <span>Weight: ${params.itemWeight} kg</span>
          </div>
          ${params.itemDescription ? `<p class="small">${params.itemDescription}</p>` : ""}

          ${
            params.codAmount > 0
              ? `<div class="cod-box"><p class="section-title" style="margin:0;">Collect (COD)</p><p class="big">৳${params.codAmount.toLocaleString()}</p></div>`
              : `<p class="small" style="text-align:center;margin-top:8px;">Prepaid — No COD</p>`
          }
        </div>
        <script>
          window.onload = function () { window.print(); };
        </script>
      </body>
    </html>
  `);
  win.document.close();
}

// Simple status-only transitions (no extra data needed)
const SIMPLE_PIPELINE: Record<string, { to: VendorAllowedStatus; label: string; color: string }> = {
  CONFIRMED: { to: "PROCESSING", label: "Start Processing", color: "bg-indigo-600 hover:bg-indigo-700" },
  PROCESSING: { to: "PACKAGING", label: "Mark as Packaging", color: "bg-violet-600 hover:bg-violet-700" },
};

// ── Mark-for-delivery dialog ──────────────────────────────────────────────────
// warehouseId is no longer collected here: the backend now books a courier
// per warehouse automatically from the order's stock allocations, so there
// is nothing for the vendor to pick manually.

function MarkForDeliveryDialog({
  vendorOrderId,
  open,
  onOpenChange,
}: {
  vendorOrderId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [markForDelivery, { isLoading }] = useMarkVendorOrderForDeliveryMutation();

  const handleSubmit = async () => {
    try {
      await markForDelivery({
        vendorOrderId,
        specialInstruction: instruction || undefined,
      }).unwrap();
      toast.success("Courier booked — shipping label ready");
      onOpenChange(false);
    } catch (err) {
      toast.error(vendorActionError(err, "Courier booking failed. Please try again."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Truck className="w-4 h-4 text-sky-600" />
            Ship this order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-xs text-slate-500">
            Courier pickup will be booked automatically for every warehouse this
            order's items are stocked in — one shipment per warehouse, no need
            to pick one manually.
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs">Special instruction (optional)</Label>
            <Textarea
              placeholder="e.g. Fragile, handle with care"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-sky-600 hover:bg-sky-700 gap-2">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Book Courier & Ship
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── COD manual-confirm dialog (fallback / exception path only) ──────────────

function ConfirmCodDialog({
  vendorOrderId,
  open,
  onOpenChange,
}: {
  vendorOrderId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [confirmCod, { isLoading }] = useConfirmVendorCodOrderMutation();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Enter who verified the customer");
      return;
    }
    try {
      await confirmCod({ vendorOrderId, confirmedByName: name.trim(), note: note || undefined }).unwrap();
      toast.success("Order confirmed");
      onOpenChange(false);
    } catch (err) {
      toast.error(vendorActionError(err, "Couldn't confirm the order."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            Manually confirm COD order
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-slate-500 -mt-2">
          Automated verification didn't clear this order. Only use this after
          you've personally verified the customer by phone.
        </p>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Verified by</Label>
            <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note (optional)</Label>
            <Textarea placeholder="Any relevant note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-amber-600 hover:bg-amber-700 gap-2">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Return-receipt confirm dialog ─────────────────────────────────────────────

function ConfirmReturnDialog({
  vendorOrderId,
  open,
  onOpenChange,
}: {
  vendorOrderId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [sellable, setSellable] = useState<boolean | null>(null);
  const [note, setNote] = useState("");
  const [confirmReturn, { isLoading }] = useConfirmVendorReturnReceiptMutation();

  const handleSubmit = async () => {
    if (sellable === null) {
      toast.error("Select whether the item is sellable");
      return;
    }
    try {
      await confirmReturn({ vendorOrderId, sellable, note: note || undefined }).unwrap();
      toast.success("Return receipt confirmed");
      onOpenChange(false);
    } catch (err) {
      toast.error(vendorActionError(err, "Couldn't confirm the return."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <PackageCheck className="w-4 h-4 text-orange-600" />
            Confirm returned parcel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex gap-2">
            <Button
              variant={sellable === true ? "default" : "outline"}
              className={sellable === true ? "bg-emerald-600 hover:bg-emerald-700 flex-1" : "flex-1"}
              onClick={() => setSellable(true)}
            >
              Sellable
            </Button>
            <Button
              variant={sellable === false ? "default" : "outline"}
              className={sellable === false ? "bg-rose-600 hover:bg-rose-700 flex-1" : "flex-1"}
              onClick={() => setSellable(false)}
            >
              Damaged
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note (optional)</Label>
            <Textarea placeholder="Condition details" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-orange-600 hover:bg-orange-700 gap-2">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Shipping label dialog (view + print, one card per shipment) ─────────────

function ShippingLabelDialog({
  vendorOrderId,
  orderNumber,
  open,
  onOpenChange,
}: {
  vendorOrderId: string;
  orderNumber?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data, isLoading, isError } = useGetVendorOrderShippingLabelQuery(vendorOrderId, {
    skip: !open,
  });
  const label = data?.data;
  const shipments = label?.courierOrders ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Printer className="w-4 h-4 text-slate-700" />
            Shipping Label{shipments.length > 1 ? "s" : ""}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading label…
          </div>
        ) : isError || !label ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
            <AlertTriangle className="w-6 h-6 opacity-40" />
            <p className="text-sm">Shipping label not available yet.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {shipments.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No active shipment found.</p>
            )}
            {shipments.map((co, idx) => (
              <div key={co.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    {shipments.length > 1 && (
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        Shipment {idx + 1} of {shipments.length}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-slate-800">
                      {co.courier_providers?.displayName || co.courier_providers?.name || "Courier"}
                    </p>
                  </div>
                  <CourierStatusBadge status={co.status} size="sm" />
                </div>

                <div className="text-xs text-slate-500 space-y-1 mb-3">
                  <p>To: <span className="text-slate-700 font-medium">{co.recipientName}</span></p>
                  <p>{co.recipientPhone}</p>
                  <p>{co.recipientAddress}</p>
                  <p>
                    Qty: {co.itemQuantity} · Weight: {co.itemWeight}kg
                    {co.codAmount > 0 && <> · COD: {fmtCurrency(co.codAmount)}</>}
                  </p>
                </div>

                <Button
                  size="sm"
                  className="w-full gap-2 bg-slate-800 hover:bg-slate-900"
                  onClick={() =>
                    printShippingLabel({
                      orderNumber: orderNumber ?? label.orderId,
                      vendorStoreName: label.vendor?.storeName ?? "Store",
                      pickupAddressLine: label.vendor?.pickupAddress?.detailsAddress,
                      recipientName: co.recipientName,
                      recipientPhone: co.recipientPhone,
                      recipientAddress: co.recipientAddress,
                      courierProviderName: co.courier_providers?.displayName || co.courier_providers?.name || "Courier",
                      trackingId: co.courierTrackingId,
                      codAmount: co.codAmount,
                      itemWeight: co.itemWeight,
                      itemQuantity: co.itemQuantity,
                      itemDescription: co.itemDescription,
                      shipmentLabel: shipments.length > 1 ? `Shipment ${idx + 1} of ${shipments.length}` : undefined,
                    })
                  }
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print This Label
                </Button>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────

interface Props {
  vendorOrderId: string | null;
  onClose: () => void;
}

export function VendorOrderDetailDrawer({ vendorOrderId, onClose }: Props) {
  const { data, isLoading, isError, error, refetch } = useGetVendorOrderByIdQuery(vendorOrderId!, { skip: !vendorOrderId });
  const loadStatus = (error as { status?: number | string } | undefined)?.status;
  const order = data?.data;

  const [updateStatus, { isLoading: updating }] = useUpdateVendorOrderStatusMutation();
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [codDialogOpen, setCodDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);

  // Backend now returns an array (a vendor order can ship from more than
  // one warehouse, one CourierOrder per warehouse). We treat the most
  // recent one as "active" for status/next-action logic, but the Courier
  // section below renders all of them.
  const courierOrders = order?.courierOrders ?? [];
  const activeCourierOrder = courierOrders[0];

  // What the store may do comes from the backend (vendorActions — the same
  // rules the action endpoints enforce; they re-check). Anything not offered
  // is explained by a note instead of a button that would be refused.
  const vendorActions = order?.vendorActions;
  const notes = vendorActions?.notes ?? [];
  const simpleStep = order && vendorActions?.nextStatus ? SIMPLE_PIPELINE[order.status] : undefined;
  const needsShipping = !!vendorActions?.canMarkForDelivery;
  const needsCodOverride = !!vendorActions?.canConfirmCod;
  const needsReturnConfirm = !!vendorActions?.canConfirmReturn;
  const canViewLabel = courierOrders.length > 0;

  const handleSimpleUpdate = async () => {
    if (!order || !simpleStep) return;
    try {
      await updateStatus({ vendorOrderId: order.id, status: simpleStep.to }).unwrap();
      toast.success(`Order moved to ${simpleStep.to.toLowerCase()}`);
    } catch (err) {
      toast.error(vendorActionError(err, "Couldn't update the order status."));
    }
  };

  return (
    <>
      <Sheet open={!!vendorOrderId} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col gap-0 p-0 overflow-hidden [&>button:last-child]:top-2 [&>button:last-child]:right-2 [&>button:last-child]:flex [&>button:last-child]:size-11 [&>button:last-child]:items-center [&>button:last-child]:justify-center [&>button:last-child]:rounded-lg [&>button:last-child]:text-white [&>button:last-child>svg]:size-5">
          {/* Header */}
          <SheetHeader className="pl-6 pr-14 py-4 bg-gradient-to-br from-teal-800 to-teal-900 flex-shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle className="text-white font-bold text-lg font-mono">
                  #{order?.order.orderNumber || (vendorOrderId?.slice(-8).toUpperCase() ?? "—")}
                </SheetTitle>
                <p className="text-teal-300 text-xs mt-0.5">{order ? fmtDate(order.createdAt) : "Loading…"}</p>
              </div>
              {order && (
                <div className="flex min-w-0 flex-col items-end gap-1.5">
                  <OrderStatusBadge status={order.status} size="md" />
                  <div className="flex flex-wrap justify-end gap-1">
                    <PaymentStatusBadge status={order.order.paymentStatus} />
                    <FulfillmentStatusBadge status={order.fulfillmentStatus} />
                  </div>
                </div>
              )}
            </div>

            {/* Action zone */}
            {order && (
              <div className="mt-3 pt-3 border-t border-teal-700 space-y-2">
                {notes.map((n) => (
                  <div key={n} role="note" className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2">
                    <p className="text-amber-300 text-[11px] uppercase tracking-wide font-semibold">{VENDOR_NOTE_COPY[n].title}</p>
                    <p className="text-amber-100/90 text-xs mt-0.5 leading-relaxed">{VENDOR_NOTE_COPY[n].body}</p>
                  </div>
                ))}

                {needsCodOverride && (
                  <>
                    <p className="text-amber-300 text-[11px] uppercase tracking-wide font-semibold">
                      Held for verification
                    </p>
                    <Button
                      className="w-full h-11 sm:h-9 text-sm font-semibold text-white gap-2 bg-amber-600 hover:bg-amber-700"
                      onClick={() => setCodDialogOpen(true)}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Manually Confirm COD
                    </Button>
                  </>
                )}

                {simpleStep && (
                  <>
                    <p className="text-teal-400 text-[11px] uppercase tracking-wide font-semibold">Next Step</p>
                    <Button
                      className={`w-full h-11 sm:h-9 text-sm font-semibold text-white gap-2 ${simpleStep.color}`}
                      onClick={handleSimpleUpdate}
                      disabled={updating}
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      {simpleStep.label}
                    </Button>
                  </>
                )}

                {needsShipping && (
                  <>
                    <p className="text-teal-400 text-[11px] uppercase tracking-wide font-semibold">Next Step</p>
                    <Button
                      className="w-full h-11 sm:h-9 text-sm font-semibold text-white gap-2 bg-sky-600 hover:bg-sky-700"
                      onClick={() => setShipDialogOpen(true)}
                    >
                      <Truck className="w-4 h-4" />
                      Book Courier & Ship
                    </Button>
                  </>
                )}

                {needsReturnConfirm && (
                  <>
                    <p className="text-orange-300 text-[11px] uppercase tracking-wide font-semibold">
                      Parcel returned by courier
                    </p>
                    <Button
                      className="w-full h-11 sm:h-9 text-sm font-semibold text-white gap-2 bg-orange-600 hover:bg-orange-700"
                      onClick={() => setReturnDialogOpen(true)}
                    >
                      <PackageCheck className="w-4 h-4" />
                      Confirm Return Receipt
                    </Button>
                  </>
                )}

                {/* Print label — available any time a courier order exists */}
                {canViewLabel && (
                  <Button
                    variant="outline"
                    className="w-full h-11 sm:h-9 text-sm font-semibold gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
                    onClick={() => setLabelDialogOpen(true)}
                  >
                    <Printer className="w-4 h-4" />
                    View / Print Shipping Label{courierOrders.length > 1 ? "s" : ""}
                  </Button>
                )}

                {!simpleStep && !needsShipping && !needsCodOverride && notes.length === 0 && !needsReturnConfirm && !canViewLabel &&
                  ["SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"].includes(order.status) && (
                    <div className="flex items-center gap-2 text-teal-400 text-xs">
                      <Info className="w-3.5 h-3.5 flex-shrink-0" />
                      {order.status === "SHIPPED"
                        ? "Order handed to courier. Awaiting delivery."
                        : order.status === "DELIVERED"
                        ? "Order successfully delivered."
                        : "No further actions available for this order."}
                    </div>
                )}
              </div>
            )}
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading order…
              </div>
            ) : isError && loadStatus !== 404 ? (
              <div role="alert" className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
                <AlertTriangle className="w-8 h-8 text-red-400" aria-hidden />
                <p className="text-sm font-medium text-slate-700">
                  {loadStatus === 403 ? "You don't have access to this order." : "Couldn't load this order."}
                </p>
                {loadStatus !== 403 ? (
                  <Button type="button" variant="outline" onClick={() => refetch()} className="h-11 gap-2 sm:h-9">
                    <RefreshCw className="w-4 h-4" aria-hidden />
                    Try again
                  </Button>
                ) : null}
              </div>
            ) : !order ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                <AlertTriangle className="w-8 h-8 opacity-40" />
                <p className="text-sm">Order not found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {/* Items */}
                <section className="px-6 py-5">
                  <SectionTitle icon={<Package className="w-4 h-4" />} title={`Items (${order.items.length})`} />
                  <div className="mt-3 space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {item.variant.product.images?.[0]?.url ? (
                            <img src={item.variant.product.images[0].url} alt={item.variant.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.variant.product.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">SKU: {item.variant.sku}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Qty: <span className="font-semibold">{item.quantity}</span>
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-slate-900 font-mono">{fmtCurrency(item.price * item.quantity)}</p>
                          <p className="text-[10px] text-slate-400">{fmtCurrency(item.price)} each</p>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between pt-2 px-1">
                      <span className="text-xs text-slate-500">Subtotal</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">{fmtCurrency(order.subtotal)}</span>
                    </div>
                    {order.shippingCost > 0 && (
                      <div className="flex items-center justify-between px-1 -mt-1">
                        <span className="text-xs text-slate-500">Shipping</span>
                        <span className="text-xs text-slate-700 font-mono">{fmtCurrency(order.shippingCost)}</span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Customer & Address */}
                <section className="px-6 py-5">
                  <SectionTitle icon={<User className="w-4 h-4" />} title="Customer" />
                  <div className="mt-3 space-y-2">
                    {order.order.user && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {order.order.user.name?.[0]?.toUpperCase() || "G"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800">{order.order.user.name || "Guest"}</p>
                          <p className="text-xs text-slate-400 truncate">{order.order.user.email}</p>
                        </div>
                        {order.order.user.phone && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Phone className="w-3 h-3" />
                            {order.order.user.phone}
                          </div>
                        )}
                      </div>
                    )}

                    {order.order.address && (
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs space-y-0.5 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-slate-700">{order.order.address.receiverFullName}</p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-500">{order.order.address.phone}</span>
                                <CopyButton value={order.order.address.phone} />
                              </div>
                            </div>
                            <p className="text-slate-500">
                              {order.order.address.address}
                              {order.order.address.landmark && `, near ${order.order.address.landmark}`}
                            </p>
                            <p className="text-slate-400">
                              {[order.order.address.city, order.order.address.zone, order.order.address.state]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Payment (read-only) */}
                <section className="px-6 py-5">
                  <SectionTitle icon={<CreditCard className="w-4 h-4" />} title="Payment" />
                  <div className="mt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-[11px] text-slate-500 mb-1">Payment Status</p>
                        <PaymentStatusBadge status={order.order.paymentStatus} size="md" />
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-[11px] text-slate-500 mb-1">Order Total</p>
                        <p className="text-sm font-bold text-slate-900 font-mono">{fmtCurrency(order.order.totalAmount == null ? undefined : Number(order.order.totalAmount))}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 px-1">
                      <Info className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-slate-400">
                        Payment is managed by the platform. Contact support for payment issues.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Courier — renders every shipment (one per warehouse the
                    order was allocated from), not just the first one. */}
                <section className="px-6 py-5">
                  <SectionTitle icon={<Truck className="w-4 h-4" />} title="Courier" />
                  {courierOrders.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {courierOrders.map((co, idx) => (
                        <div key={co.id} className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                          {courierOrders.length > 1 && (
                            <p className="text-[10px] font-semibold text-blue-400 mb-1">
                              Shipment {idx + 1} of {courierOrders.length}
                            </p>
                          )}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-800">
                                {co.courier_providers?.displayName || co.courier_providers?.name || "Courier"}
                              </span>
                            </div>
                            <CourierStatusBadge status={co.status} size="md" />
                          </div>
                          {(co.bookingState === "IN_FLIGHT" || co.bookingState === "NEEDS_RECONCILIATION") && (
                            <p className="text-[11px] font-semibold text-amber-700 mt-1">
                              {co.bookingState === "IN_FLIGHT"
                                ? "Booking in progress — not yet confirmed by the courier"
                                : "Needs reconciliation — contact support before booking again"}
                            </p>
                          )}
                          {co.courierTrackingId && (
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-blue-700 font-mono">#{co.courierTrackingId}</p>
                              <CopyButton value={co.courierTrackingId} />
                            </div>
                          )}
                          <p className="text-[10px] text-blue-500 mt-1">Last update: {fmtDate(co.lastStatusUpdate)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                      <Truck className="w-4 h-4 opacity-40" />
                      No courier assigned yet. Ship the order once it's packaged.
                    </div>
                  )}
                </section>

                {/* Timeline */}
                <section className="px-6 py-5">
                  <SectionTitle icon={<Calendar className="w-4 h-4" />} title="Timeline" />
                  <div className="mt-3 relative">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />
                    <div className="space-y-3">
                      {[
                        { label: "Order placed", date: order.order.createdAt, done: true },
                        { label: "Confirmed", date: order.order.confirmedAt, done: order.status !== "PENDING" },
                        { label: "Processing", date: null, done: ["PROCESSING", "PACKAGING", "SHIPPED", "DELIVERED"].includes(order.status) },
                        { label: "Packaging", date: null, done: ["PACKAGING", "SHIPPED", "DELIVERED"].includes(order.status) },
                        { label: "Shipped", date: order.shippedAt, done: ["SHIPPED", "DELIVERED"].includes(order.status) },
                        { label: "Delivered", date: order.deliveredAt, done: order.status === "DELIVERED" },
                      ].map(({ label, date, done }) => (
                        <div key={label} className="flex items-center gap-3 relative">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 z-10 ${done ? "bg-teal-500 border-teal-500" : "bg-white border-slate-300"}`} />
                          <span className={`text-xs flex-1 ${done ? "text-slate-700 font-medium" : "text-slate-400"}`}>{label}</span>
                          {date && <span className="text-[10px] text-slate-400 font-mono">{fmtDate(date)}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* Physical Returns (1C-7B G2 contract — display only; creation stays
              in the vendor confirm-return flow above) */}
          {!!order && order.returns.length > 0 && (
            <section className="px-6 py-4 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                Physical Returns ({order.returns.length})
              </h3>
              {order.returns.map((vr) => (
                <div key={vr.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-700">…{vr.id.slice(-12)}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${vr.condition === "SELLABLE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                        {vr.condition === "SELLABLE" ? "Sellable" : "Damaged"}
                      </span>
                      <span className="text-[11px] text-slate-500">{vr.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Confirmed</span>
                    <span className="text-slate-700">{vr.confirmedAt ? new Date(vr.confirmedAt).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" }) : "—"}</span>
                  </div>
                  {vr.refund ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Refund</span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> linked — {vr.refund.status}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Refund</span>
                      <span className="text-slate-400">not linked to a refund yet</span>
                    </div>
                  )}
                  <div className="rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100">
                          <th className="text-left font-medium px-2 py-1.5">Order item</th>
                          <th className="text-left font-medium px-2 py-1.5">Variant</th>
                          <th className="text-right font-medium px-2 py-1.5">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vr.items.map((it) => (
                          <tr key={it.id} className="border-b border-slate-100 last:border-0">
                            <td className="px-2 py-1.5 font-mono text-slate-600">…{it.orderItemId.slice(-10)}</td>
                            <td className="px-2 py-1.5 font-mono text-slate-600">…{it.variantId.slice(-10)}</td>
                            <td className="px-2 py-1.5 text-right font-semibold text-slate-900">{it.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between gap-2">
            <p className="text-[11px] text-slate-400 font-mono truncate">{vendorOrderId?.slice(-16)}</p>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-11 sm:h-8 text-xs flex-shrink-0">
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {order && (
        <>
          <MarkForDeliveryDialog vendorOrderId={order.id} open={shipDialogOpen} onOpenChange={setShipDialogOpen} />
          <ConfirmCodDialog vendorOrderId={order.id} open={codDialogOpen} onOpenChange={setCodDialogOpen} />
          <ConfirmReturnDialog vendorOrderId={order.id} open={returnDialogOpen} onOpenChange={setReturnDialogOpen} />
          <ShippingLabelDialog
            vendorOrderId={order.id}
            orderNumber={order.order.orderNumber}
            open={labelDialogOpen}
            onOpenChange={setLabelDialogOpen}
          />
        </>
      )}
    </>
  );
}