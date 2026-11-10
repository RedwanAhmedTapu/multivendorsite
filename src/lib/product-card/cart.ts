// lib/product-card/cart.ts
//
// The product card's Add to Cart flow, React-free so it is unit tested with
// mocked calls (tests/product-card-cart.test.mjs). The card's hook
// (components/product/card/CardCartButton.tsx) injects the REAL pieces: the
// existing cartWishApi `addToCart` mutation, the existing LoginModal and
// sonner toasts. Same rules and messages as the product page's cart button
// (app/products/[id]/SingleProductClient.tsx, unchanged): login required —
// a signed-out click opens the login modal FIRST, for every card (single
// variant or not), and the original intent is retried after login;
// quantity 1; 401/403 → "Session expired" + login; other errors show the
// server's message (e.g. "Insufficient stock…"). The backend stays the
// authority for stock, price, variant ownership and authorization.

export interface CartTarget {
  productId: string;
  variantId: string;
}

export type CartNotify = (tone: "success" | "error" | "info", message: string) => void;

/**
 * What to do once a signed-out shopper has logged in: add the SAME displayed
 * variant they clicked (the backend re-validates it), or open the product page
 * when the displayed variant couldn't be identified — never a cart request
 * for the latter.
 */
export type CardCartRetry =
  | { kind: "add"; productId: string; variantId: string }
  | { kind: "viewProduct" };

export interface CardAddToCartDeps {
  /** Admin preview: never touches a cart. */
  preview: boolean;
  isAuthenticated: boolean;
  /** The real mutation, unwrapped (rejects on non-2xx), e.g. `(b) => addToCart(b).unwrap()`. */
  addToCart: (body: { productId: string; variantId: string; quantity: number; notes: string }) => Promise<unknown>;
  /** Opens the login modal; `retry` (if any) is run after a successful login. */
  requestLogin: (retry: CardCartRetry | null) => void;
  notify: CartNotify;
}

export type CardAddToCartResult = "preview" | "login" | "added" | "failed";

/** Error → shopper message, and whether to offer the login modal. Never throws. */
export function describeCartError(error: unknown): { message: string; login: boolean } {
  const e = (error && typeof error === "object" ? error : {}) as { status?: unknown; data?: unknown };
  const data = (e.data && typeof e.data === "object" ? e.data : {}) as { message?: unknown; error?: unknown };
  if (e.status === 401 || e.status === 403) return { message: "Session expired. Please login again.", login: true };
  if (typeof e.status !== "number") return { message: "Could not reach the server. Check your connection and try again.", login: false };
  const serverMessage = typeof data.message === "string" ? data.message : typeof data.error === "string" ? data.error : null;
  return { message: serverMessage || "Failed to add to cart", login: false };
}

/** Adds one unit of the target variant (signed-in), or asks for login first. */
export async function cardAddToCart(target: CartTarget, deps: CardAddToCartDeps): Promise<CardAddToCartResult> {
  if (deps.preview) {
    deps.notify("info", "Preview only — nothing was added to a cart.");
    return "preview";
  }
  if (!deps.isAuthenticated) {
    deps.requestLogin({ kind: "add", productId: target.productId, variantId: target.variantId });
    return "login";
  }
  try {
    await deps.addToCart({ productId: target.productId, variantId: target.variantId, quantity: 1, notes: "" });
    deps.notify("success", "Added to cart!");
    return "added";
  } catch (error) {
    const { message, login } = describeCartError(error);
    deps.notify("error", message);
    if (login) deps.requestLogin(null);
    return "failed";
  }
}

export const DEFAULT_ADD_TO_CART_LABEL = "Add to Cart";

/** Shown when the displayed variant can't be identified and the button opens the product page instead. */
export const VIEW_PRODUCT_MESSAGE = "Open the product page to add this item to your cart.";

export type CardCartClickAction =
  | { kind: "add"; productId: string; variantId: string }
  | { kind: "viewProduct" }
  | { kind: "outOfStock" }
  | { kind: "none" };

export type CardCartClickResult = CardAddToCartResult | "navigated" | "ignored";

/**
 * Everything a card's Add to Cart click can do, identical on every page that
 * renders the shared card (homepage, category, …):
 *   - admin preview → nothing (no navigation, no login modal, no request);
 *   - out of stock / none → nothing;
 *   - signed out → the login modal first, for EVERY clickable card; the
 *     original intent is retried after login (the same variant, or the
 *     product page);
 *   - signed in + "add" → the real cart mutation for the DISPLAYED variant
 *     (one or several variants alike) — no navigation;
 *   - signed in + "viewProduct" → the displayed variant couldn't be
 *     identified: open the product page, no request.
 */
export async function cardCartClick(
  action: CardCartClickAction,
  href: string,
  deps: CardAddToCartDeps & { navigate: (href: string) => void },
): Promise<CardCartClickResult> {
  if (action.kind === "outOfStock" || action.kind === "none") return "ignored";
  if (deps.preview) {
    deps.notify("info", "Preview only — nothing was added to a cart.");
    return "preview";
  }
  if (!deps.isAuthenticated) {
    // Login comes first everywhere — never a redirect just because the shopper is signed out.
    deps.requestLogin(action.kind === "add" ? { kind: "add", productId: action.productId, variantId: action.variantId } : { kind: "viewProduct" });
    return "login";
  }
  if (action.kind === "viewProduct") {
    deps.notify("info", VIEW_PRODUCT_MESSAGE);
    deps.navigate(href);
    return "navigated";
  }
  return cardAddToCart({ productId: action.productId, variantId: action.variantId }, deps);
}
