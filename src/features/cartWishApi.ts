import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

/* ==================== REQUEST TYPES ==================== */

export interface AddToCartRequest {
  productId: string;
  variantId: string;
  quantity: number;
  notes?: string;
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

export interface CartItemProduct {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string;
  vendorId: string;
}

export interface CartItemVariant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  variantImage: string;
  attributeValues: Record<string, string>;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  isSelected: boolean;
  itemTotal: number;
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
  itemsByVendor: any[];
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
  
  // Courier information
  courierProviderId?: string | null;
  courierProvider?: string | null;
  deliveryCharge: number;
  codCharge: number;
  shippingCost: number;
  estimatedDeliveryDays?: number | null;
  
  // Order summary
  subtotal: number;
  codAmount?: number;
  
  // Items
  items: DeliveryFeeItem[];
  
  // Error handling
  error?: string;
}

export interface DeliveryFeesResponse {
  deliveryCalculations: VendorDeliveryCalculation[];
  totalDeliveryFee: number;
  totalCodCharge: number;
  totalShippingCost: number;
  grandTotal: number;
}

/* ==================== API ==================== */

export const cartWishApi = createApi({
  reducerPath: "cartWishApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Cart", "CartItem", "Wishlist", "WishlistItem", "DeliveryFees"],

  endpoints: (builder) => ({

    /* ==================== CART ==================== */

    getCart: builder.query<ApiResponse<CartSummary>, void>({
      query: () => "/cart-wish/cart",
      providesTags: ["Cart", "CartItem"],
    }),

    addToCart: builder.mutation<ApiResponse<CartItem>, AddToCartRequest>({
      query: (body) => ({
        url: "/cart-wish/cart/items",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Cart", "CartItem", "DeliveryFees"],
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
      invalidatesTags: ["Cart", "CartItem", "DeliveryFees"],
    }),

    removeFromCart: builder.mutation<SuccessResponse, string>({
      query: (itemId) => ({
        url: `/cart-wish/cart/items/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cart", "CartItem", "DeliveryFees"],
    }),

    toggleItemSelection: builder.mutation<ApiResponse<CartItem>, string>({
      query: (itemId) => ({
        url: `/cart-wish/cart/items/${itemId}/toggle`,
        method: "POST",
      }),
      invalidatesTags: ["Cart", "CartItem", "DeliveryFees"],
    }),

    toggleAllItems: builder.mutation<SuccessResponse, ToggleAllItemsRequest>({
      query: (body) => ({
        url: "/cart-wish/cart/toggle-all",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Cart", "CartItem", "DeliveryFees"],
    }),

    clearCart: builder.mutation<SuccessResponse, void>({
      query: () => ({
        url: "/cart-wish/cart",
        method: "DELETE",
      }),
      invalidatesTags: ["Cart", "CartItem", "DeliveryFees"],
    }),

    getSelectedItems: builder.query<ApiResponse<SelectedItemsSummary>, void>({
      query: () => "/cart-wish/cart/selected",
      providesTags: ["Cart"],
    }),

    getCartCount: builder.query<ApiResponse<CartCountResponse>, void>({
      query: () => "/cart-wish/cart/count",
      providesTags: ["Cart"],
    }),

    mergeGuestCart: builder.mutation<SuccessResponse, MergeGuestCartRequest>({
      query: (body) => ({
        url: "/cart-wish/cart/merge",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Cart", "CartItem", "DeliveryFees"],
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
      providesTags: ["Wishlist", "WishlistItem"],
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
      invalidatesTags: ["Wishlist", "WishlistItem"],
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
      invalidatesTags: ["Wishlist", "WishlistItem"],
    }),

    removeFromWishlist: builder.mutation<SuccessResponse, string>({
      query: (itemId) => ({
        url: `/cart-wish/wishlist/items/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Wishlist", "WishlistItem"],
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
      invalidatesTags: ["Wishlist", "Cart", "CartItem", "DeliveryFees"],
    }),

    clearWishlist: builder.mutation<SuccessResponse, void>({
      query: () => ({
        url: "/cart-wish/wishlist",
        method: "DELETE",
      }),
      invalidatesTags: ["Wishlist", "WishlistItem"],
    }),

    getWishlistCount: builder.query<ApiResponse<WishlistCountResponse>, void>({
      query: () => "/cart-wish/wishlist/count",
      providesTags: ["Wishlist"],
    }),

    checkInWishlist: builder.query<
      ApiResponse<{ inWishlist: boolean; itemId?: string }>,
      { productId: string; variantId?: string }
    >({
      query: ({ productId, variantId }) =>
        `/cart-wish/wishlist/check/${productId}${
          variantId ? `/${variantId}` : ""
        }`,
      providesTags: ["Wishlist"],
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