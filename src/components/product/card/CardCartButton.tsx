"use client";

// components/product/card/CardCartButton.tsx
//
// The shared card's opt-in Add to Cart control (config.show.addToCart). It is
// rendered by SharedProductCard OUTSIDE the product <Link>, so clicking it
// never navigates through the card link. Every card shows the SAME button
// with the configured label; what a click does depends on the product
// (lib/product-card/model.ts → cardCartAction, lib/product-card/cart.ts →
// cardCartClick):
//   signed out  → the existing login modal first, for every card (same on
//                 the homepage and category pages); after login the original
//                 intent is retried;
//   add         → the existing cartWishApi addToCart mutation (quantity 1)
//                 for the variant the card DISPLAYS (its price / id come from
//                 the same payload object) — also for multi-variant products;
//   viewProduct → the displayed variant can't be identified (e.g. campaign
//                 payloads without variant ids): no request, opens the
//                 product page — never an arbitrary variant;
//   outOfStock  → the button is disabled.
// The login modal is the existing LoginModal, loaded only when needed and
// mounted only while open. In the admin preview (`preview`) a click never
// navigates, never opens the login modal and never touches a cart.
import { useCallback, useRef, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import type { RootState } from "@/store/store";
import { useAddToCartMutation } from "@/features/cartWishApi";
import type { ProductCardConfig } from "@/lib/product-card/config";
import type { CardCartAction } from "@/lib/product-card/model";
import { cardCartClick, DEFAULT_ADD_TO_CART_LABEL, type CardCartRetry, type CartNotify } from "@/lib/product-card/cart";
import styles from "./SharedProductCard.module.css";

const LoginModal = dynamic(() => import("@/components/loginmodal/loginModal").then((m) => m.LoginModal), { ssr: false });

const notify: CartNotify = (tone, message) => {
  if (tone === "success") toast.success(message);
  else if (tone === "error") toast.error(message);
  else toast.info(message);
};

/** Button look from the validated addToCart config (bounded enums / #rrggbb / px). */
export function cartButtonLook(c: ProductCardConfig["addToCart"]): { className: string; style: CSSProperties } {
  const size = c.size === "sm" ? "h-8 text-xs" : "h-9 text-sm";
  const variant =
    c.variant === "filled"
      ? "bg-teal-600 text-white border border-transparent hover:bg-teal-700"
      : "bg-white text-teal-700 border border-teal-600 hover:bg-teal-50";
  const style: CSSProperties = { borderRadius: `${c.radius}px` };
  if (c.background) {
    style.backgroundColor = c.background;
    if (c.variant === "outline") style.borderColor = c.background;
  }
  if (c.text) style.color = c.text;
  return {
    className: `inline-flex w-full items-center justify-center gap-1.5 px-3 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${size} ${variant}`,
    style,
  };
}

/** Accessible name: the visible label plus what the click will do. */
function accessibleName(label: string, productName: string, action: Exclude<CardCartAction, { kind: "none" }>): string {
  if (action.kind === "outOfStock") return `${label}: ${productName} — out of stock`;
  if (action.kind === "viewProduct") return `${label}: ${productName} — opens the product page to add it`;
  return `${label}: ${productName}`;
}

export function CardCartButton({
  action,
  href,
  productName,
  config,
  preview = false,
}: {
  action: Exclude<CardCartAction, { kind: "none" }>;
  href: string;
  productName: string;
  config: ProductCardConfig["addToCart"];
  preview?: boolean;
}) {
  const router = useRouter();
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!user && !!accessToken;
  const [addToCart, { isLoading }] = useAddToCartMutation();
  const [loginOpen, setLoginOpen] = useState(false);
  const pendingRef = useRef<CardCartRetry | null>(null);

  const look = cartButtonLook(config);
  const label = config.label?.trim() || DEFAULT_ADD_TO_CART_LABEL;
  const outOfStock = action.kind === "outOfStock";

  const click = useCallback(
    (a: Exclude<CardCartAction, { kind: "none" }>, authed: boolean) =>
      cardCartClick(a, href, {
        preview,
        isAuthenticated: authed,
        addToCart: (body) => addToCart(body).unwrap(),
        requestLogin: (retry) => {
          pendingRef.current = retry;
          setLoginOpen(true);
        },
        navigate: (to) => router.push(to),
        notify,
      }),
    [preview, href, addToCart, router],
  );

  return (
    <div className={styles.action}>
      <button
        type="button"
        disabled={outOfStock || isLoading}
        aria-busy={isLoading || undefined}
        aria-label={accessibleName(label, productName, action)}
        title={outOfStock ? "Out of stock" : undefined}
        data-fm-cart={action.kind}
        data-fm-variant={action.kind === "add" ? action.variantId : undefined}
        data-fm-cart-preview={preview ? "" : undefined}
        className={look.className}
        style={look.style}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void click(action, isAuthenticated);
        }}
      >
        {isLoading ? "Adding…" : label}
      </button>
      {loginOpen && !preview && (
        <LoginModal
          isOpen
          onClose={() => {
            pendingRef.current = null; // dismissed — drop the pending add
            setLoginOpen(false);
          }}
          onLoginSuccess={() => {
            toast.success("Login successful!");
            setLoginOpen(false);
            const retry = pendingRef.current;
            pendingRef.current = null;
            // next tick, so the fresh token is in the store (same as the product page);
            // "add" adds the same displayed variant, "viewProduct" opens the product page (no request)
            if (retry) setTimeout(() => void click(retry, true), 0);
          }}
          message="Please login to continue"
        />
      )}
    </div>
  );
}
