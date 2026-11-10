"use client";

// components/checkout/PaymentMethodPicker.tsx
//
// Checkout payment choice (presentational): Cash on delivery, or Online via
// the admin's active gateway. The page owns the state and rules (online only
// when a gateway is active; locked once an order exists). Tiles stack until
// their container is ≥ 620px, and text wraps instead of being cut off.
import { CreditCard, Loader2, Wallet } from "lucide-react";
import type { ActiveGateway, GatewayCode } from "@/features/paymentApi";

export interface PaymentMethodPickerProps {
  selected: GatewayCode;
  onSelect: (code: GatewayCode) => void;
  locked: boolean;
  loadingGateway: boolean;
  onlineAvailable: boolean;
  activeGateway: ActiveGateway | null;
}

export function PaymentMethodPicker({ selected, onSelect, locked, loadingGateway, onlineAvailable, activeGateway }: PaymentMethodPickerProps) {
  const gatewayName = activeGateway?.displayName || activeGateway?.name || "";
  return (
    <div className="@container">
      {/* Side by side only when the section itself is wide enough (container query) —
          the viewport alone doesn't say how much room the column next to the summary has. */}
      <div role="radiogroup" aria-label="Payment method" className="grid gap-3 @min-[620px]:grid-cols-2">
        <PaymentTile
          selected={selected === "COD"}
          disabled={locked}
          onSelect={() => onSelect("COD")}
          icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
          title="Cash on delivery"
          detail="Pay when your order arrives"
        />
        <PaymentTile
          selected={selected === "ONLINE" && onlineAvailable}
          disabled={!onlineAvailable || locked}
          onSelect={() => onlineAvailable && onSelect("ONLINE")}
          icon={
            loadingGateway ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : activeGateway?.logo ? (
              <img src={activeGateway.logo} alt="" className="h-full w-full rounded object-contain" />
            ) : (
              <CreditCard className="h-5 w-5" aria-hidden="true" />
            )
          }
          title={loadingGateway ? "Checking payment options…" : onlineAvailable ? "Pay online" : "Online payment unavailable"}
          detail={loadingGateway ? "One moment" : onlineAvailable ? `via ${gatewayName}` : "No gateway configured"}
        />
      </div>
      {selected === "ONLINE" && onlineAvailable && (
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          You’ll be redirected to {gatewayName} to complete your payment — bKash, Nagad, cards and other options are chosen there.
        </p>
      )}
    </div>
  );
}

function PaymentTile({ selected, disabled, onSelect, icon, title, detail }: { selected: boolean; disabled: boolean; onSelect: () => void; icon: React.ReactNode; title: string; detail: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`flex h-full min-w-0 items-center gap-3 rounded-lg border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed ${
        selected ? "border-teal-700 bg-teal-50/50 ring-1 ring-teal-700" : disabled ? "border-stone-200 bg-stone-50 opacity-60" : "border-stone-200 bg-white hover:border-stone-300"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-stone-100 text-stone-600">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-stone-900">{title}</span>
        <span className="block text-xs leading-snug break-words text-stone-500">{detail}</span>
      </span>
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${selected ? "border-teal-700 bg-teal-700" : "border-stone-300"}`} aria-hidden="true">
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
    </button>
  );
}
