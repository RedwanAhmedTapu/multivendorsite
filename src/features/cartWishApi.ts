// features/cartWishApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

/* ==================== REQUEST TYPES ==================== */

export interface AddToCartRequest {
  productId: string;
  variantId: string;
  quantity: number;
  notes?: string;
  /** Business Advisor entry point (allowlisted server-side; ignored by the cart itself). */
  source?: "PRODUCT_PAGE" | "QUICK_VIEW" | "BUY_NOW" | "CART" | "WISHLIST";
}

export interface UpdateCartItemRequest {
  quantity?: number;
  isSelected?: boolean;
  notes?: string;
}

export interface ToggleAllItemsRequest {
  isSelected: boolean;
}

export interface MergeGuestCartRequest {
  guestSessionId: string;
}

export interface AddToWishlistRequest {
  productId: string;
  variantId?: string;
  priority?: number;
  notes?: string;
  notifyOnDiscount?: boolean;
  notifyOnRestock?: boolean;
}

export interface UpdateWishlistItemRequest {
  priority?: number;
  notes?: string;
  notifyOnDiscount?: boolean;
  notifyOnRestock?: boolean;
}

export interface MoveToCartRequest {
  quantity?: number;
}

export interface CalculateDeliveryFeesRequest {
  userAddressId: string;
  selectedItemIds?: string[];
  codEnabled?: boolean;
}

/* ==================== RESPONSE TYPES ==================== */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

/* ---------- CART TYPES ---------- */
// NOTE: ProductVariant schema has NO `stock` or `weight` field anymore.
// Stock is derived server-side from WarehouseStock (quantity - reserved - damaged)
// and exposed as `availableStock` / `isInStock` on cart & wishlist items.
// Weight is derived server-side from Product.warranty and is not exposed per-item here.

export interface CartItemImage {
  url: string;
  altText?: string | null;
}

export interface CartItemProduct {
  id: string;
  name: string;
  slug: string;
  vendorId: string;
  // 1C-22: read-only display fields from the cart API (vendor group header
  // + image fallback). See cartWish.service.ts -> getCart.
  vendor?: { storeName: string };
  images?: CartItemImage[];
}

export interface CartItemVariant {
  id: string;
  sku: string;
  price: number;
  specialPrice: number | null;
  availability: boolean | null;
  images?: CartItemImage[];
  // 1C-22: variant options (e.g. Color -> Black) for the cart line
  attributes?: Array<{
    attributeValue: { value: string; attribute: { name: string } };
  }>;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  compareAtPrice: number | null;
  isSelected: boolean;
  notes: string | null;
  addedAt: string;
  updatedAt: string;

  // Server-computed fields (see cartWish.service.ts -> getCart)
  itemTotal: number;
  savings: number;
  isInStock: boolean;
  availableStock: number;

  products: CartItemProduct;
  product_variants: CartItemVariant;
}

export interface CartSummary {
  totalItems: number;
  selectedItems: number;
  subtotal: number;
  selectedSubtotal: number;
  items: CartItem[];
}

export interface SelectedItemsSummary {
  selectedItems: number;
  selectedItemsCount: number;
  subtotal: number;
  itemsByVendor: Array<{
    vendorId: string;
    items: CartItem[];
    subtotal: number;
  }>;
}

export interface CartCountResponse {
  totalItems: number;
  selectedItems: number;
}

/* ---------- WISHLIST TYPES ---------- */

export interface WishlistItem {
  id: string;
  productId: string;
  variantId: string | null;
  priority: number;
  notes: string | null;
  priceWhenAdded: number;
  notifyOnDiscount: boolean;
  notifyOnRestock: boolean;
  addedAt: string;

  // Server-computed fields (see cartWish.service.ts -> getWishlist)
  currentPrice: number;
  priceChange: number;
  priceChangePercent: string;
  isPriceDropped: boolean;
  isPriceIncreased: boolean;
  isInStock: boolean;

  products: CartItemProduct;
  product_variants: CartItemVariant | null;
}

export interface WishlistResponse {
  wishlistId: string;
  wishlistName: string;
  totalItems: number;
  items: WishlistItem[];
}

export interface WishlistCountResponse {
  count: number;
}

/* ---------- DELIVERY FEE TYPES ---------- */

export interface DeliveryFeeItem {
  id: string;
  productName: string;
  variantName: string;
  quantity: number;
  price: number;
  weight: number;
}

export interface VendorDeliveryCalculation {
  vendorId: string;
  vendorName: string;
  warehouseLocation?: string;
  warehouseLocationId?: string;
  deliveryLocation?: string;
  deliveryLocationId?: string;
  totalWeight?: number;

  courierProviderId?: string | null;
  courierProvider?: string | null;
  deliveryCharge: number;
  codCharge: number;
  shippingCost: number;
  estimatedDeliveryDays?: number | null;

  subtotal: number;
  codAmount?: number;

  items: DeliveryFeeItem[];

  error?: string;
}

/* ---------- CHECKOUT QUOTE (Phase 2, H-3) ---------- */
// POST /cart-wish/delivery-fees returns the server's checkout quote — the same
// computation order placement repeats (order.service buildCheckoutQuote):
// current selling prices, the reservation plan and per-warehouse delivery.

export interface CheckoutQuoteLine {
  cartItemId: string;
  variantId: string;
  vendorId: string;
  quantity: number;
  /** Price saved on the cart line when it was added. */
  cartPrice: number;
  /** Current selling price — what is charged. */
  price: number;
  lineTotal: number;
  changedSinceAdded: boolean;
}

export interface CheckoutQuoteShipment {
  warehouseId: string;
  warehouseName: string | null;
  locationName: string | null;
  weightKg: number;
  charge: number;
  courierProviderId: string;
  courierProvider: string;
  items: { cartItemId: string; quantity: number }[];
}

export interface CheckoutQuoteVendor {
  vendorId: string;
  vendorName: string;
  subtotal: number;
  shippingCost: number;
  shipments: CheckoutQuoteShipment[];
  error?: string;
}

export interface CheckoutQuote {
  /** Identifies exactly this quote; the order is placed with it. */
  quoteHash: string;
  userAddressId: string;
  lines: CheckoutQuoteLine[];
  vendors: CheckoutQuoteVendor[];
  subtotal: number;
  shippingTotal: number;
  grandTotal: number;
  complete: boolean;
  priceChanges: CheckoutQuoteLine[];
}

export type DeliveryFeesResponse = CheckoutQuote;

/* ==================== API ==================== */

export const cartWishApi = createApi({
  reducerPath: "cartWishApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Cart", "CartItem", "Wishlist", "WishlistItem", "DeliveryFees"],

  endpoints: (builder) => ({
    /* ==================== CART ==================== */

    getCart: builder.query<ApiResponse<CartSummary>, void>({
      query: () => "/cart-wish/cart",
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map((item) => ({
                type: "CartItem" as const,
                id: item.id,
              })),
              { type: "Cart" as const, id: "LIST" },
            ]
          : [{ type: "Cart" as const, id: "LIST" }],
    }),

    addToCart: builder.mutation<ApiResponse<CartItem>, AddToCartRequest>({
      query: (body) => ({
        url: "/cart-wish/cart/items",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Cart", id: "LIST" },
        { type: "Cart", id: "COUNT" },
        "DeliveryFees",
      ],
    }),

    updateCartItem: builder.mutation<
      ApiResponse<CartItem>,
      { itemId: string; data: UpdateCartItemRequest }
    >({
      query: ({ itemId, data }) => ({
        url: `/cart-wish/cart/items/${itemId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { itemId }) => [
        { type: "CartItem", id: itemId },
        { type: "Cart", id: "LIST" },
        { type: "Cart", id: "COUNT" },
        "DeliveryFees",
      ],
    }),

    removeFromCart: builder.mutation<SuccessResponse, string>({
      query: (itemId) => ({
        url: `/cart-wish/cart/items/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, itemId) => [
        { type: "CartItem", id: itemId },
        { type: "Cart", id: "LIST" },
        { type: "Cart", id: "COUNT" },
        "DeliveryFees",
      ],
    }),

    toggleItemSelection: builder.mutation<ApiResponse<CartItem>, string>({
      query: (itemId) => ({
        url: `/cart-wish/cart/items/${itemId}/toggle`,
        method: "POST",
      }),
      invalidatesTags: (result, error, itemId) => [
        { type: "CartItem", id: itemId },
        { type: "Cart", id: "LIST" },
        "DeliveryFees",
      ],
    }),

    toggleAllItems: builder.mutation<SuccessResponse, ToggleAllItemsRequest>({
      query: (body) => ({
        url: "/cart-wish/cart/toggle-all",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Cart", id: "LIST" }, "DeliveryFees"],
    }),

    clearCart: builder.mutation<SuccessResponse, void>({
      query: () => ({
        url: "/cart-wish/cart",
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Cart", id: "LIST" },
        { type: "Cart", id: "COUNT" },
        "DeliveryFees",
      ],
    }),

    getSelectedItems: builder.query<ApiResponse<SelectedItemsSummary>, void>({
      query: () => "/cart-wish/cart/selected",
      providesTags: [{ type: "Cart", id: "LIST" }],
    }),

    // NOTE: no pollingInterval baked in here — polling (if any) should be
    // opted into per-component, not forced globally by the API slice.
    getCartCount: builder.query<ApiResponse<CartCountResponse>, void>({
      query: () => "/cart-wish/cart/count",
      providesTags: [{ type: "Cart", id: "COUNT" }],
    }),

    mergeGuestCart: builder.mutation<SuccessResponse, MergeGuestCartRequest>({
      query: (body) => ({
        url: "/cart-wish/cart/merge",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Cart", id: "LIST" },
        { type: "Cart", id: "COUNT" },
        "DeliveryFees",
      ],
    }),

    /* ==================== DELIVERY FEES ==================== */

    calculateDeliveryFees: builder.mutation<
      ApiResponse<DeliveryFeesResponse>,
      CalculateDeliveryFeesRequest
    >({
      query: (body) => ({
        url: "/cart-wish/delivery-fees",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DeliveryFees"],
    }),

    /* ==================== WISHLIST ==================== */

    getWishlist: builder.query<ApiResponse<WishlistResponse>, void>({
      query: () => "/cart-wish/wishlist",
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map((item) => ({
                type: "WishlistItem" as const,
                id: item.id,
              })),
              { type: "Wishlist" as const, id: "LIST" },
            ]
          : [{ type: "Wishlist" as const, id: "LIST" }],
    }),

    addToWishlist: builder.mutation<
      ApiResponse<WishlistItem>,
      AddToWishlistRequest
    >({
      query: (body) => ({
        url: "/cart-wish/wishlist/items",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Wishlist", id: "LIST" },
        { type: "Wishlist", id: "COUNT" },
      ],
    }),

    updateWishlistItem: builder.mutation<
      ApiResponse<WishlistItem>,
      { itemId: string; data: UpdateWishlistItemRequest }
    >({
      query: ({ itemId, data }) => ({
        url: `/cart-wish/wishlist/items/${itemId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { itemId }) => [
        { type: "WishlistItem", id: itemId },
        { type: "Wishlist", id: "LIST" },
      ],
    }),

    removeFromWishlist: builder.mutation<SuccessResponse, string>({
      query: (itemId) => ({
        url: `/cart-wish/wishlist/items/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, itemId) => [
        { type: "WishlistItem", id: itemId },
        { type: "Wishlist", id: "LIST" },
        { type: "Wishlist", id: "COUNT" },
      ],
    }),

    moveToCart: builder.mutation<
      ApiResponse<CartItem>,
      { itemId: string; data?: MoveToCartRequest }
    >({
      query: ({ itemId, data }) => ({
        url: `/cart-wish/wishlist/items/${itemId}/move-to-cart`,
        method: "POST",
        body: data || {},
      }),
      invalidatesTags: (result, error, { itemId }) => [
        { type: "WishlistItem", id: itemId },
        { type: "Wishlist", id: "LIST" },
        { type: "Wishlist", id: "COUNT" },
        { type: "Cart", id: "LIST" },
        { type: "Cart", id: "COUNT" },
        "DeliveryFees",
      ],
    }),

    clearWishlist: builder.mutation<SuccessResponse, void>({
      query: () => ({
        url: "/cart-wish/wishlist",
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Wishlist", id: "LIST" },
        { type: "Wishlist", id: "COUNT" },
      ],
    }),

    getWishlistCount: builder.query<ApiResponse<WishlistCountResponse>, void>({
      query: () => "/cart-wish/wishlist/count",
      providesTags: [{ type: "Wishlist", id: "COUNT" }],
    }),

    checkInWishlist: builder.query<
      ApiResponse<{ inWishlist: boolean; itemId?: string }>,
      { productId: string; variantId?: string }
    >({
      query: ({ productId, variantId }) =>
        `/cart-wish/wishlist/check/${productId}${
          variantId ? `/${variantId}` : ""
        }`,
      providesTags: [{ type: "Wishlist", id: "LIST" }],
    }),
  }),
});

/* ==================== EXPORT HOOKS ==================== */

export const {
  // Cart hooks
  useGetCartQuery,
  useLazyGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useToggleItemSelectionMutation,
  useToggleAllItemsMutation,
  useClearCartMutation,
  useGetSelectedItemsQuery,
  useGetCartCountQuery,
  useMergeGuestCartMutation,

  // Delivery fees hook
  useCalculateDeliveryFeesMutation,

  // Wishlist hooks
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useUpdateWishlistItemMutation,
  useRemoveFromWishlistMutation,
  useMoveToCartMutation,
  useClearWishlistMutation,
  useGetWishlistCountQuery,
  useCheckInWishlistQuery,
  useLazyCheckInWishlistQuery,
} = cartWishApi;