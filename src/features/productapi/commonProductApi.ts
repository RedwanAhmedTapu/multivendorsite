// productapi/commonProductApi.ts
import { productApiBase } from "./productApiBase";
import type {
  ApiResponse,
  CursorPage,
  PublicProductFilter,
  ProductDetailResponse,
  Product,
} from "./types";

/**
 * Maps to routes/product.routes.ts PUBLIC section + PublicProductController.
 * Everything here only ever returns approved (`ACTIVE`) + non-deleted
 * products. Listing/search/discovery endpoints are cursor-paginated.
 */
export const commonProductApi = productApiBase.injectEndpoints({
  
  endpoints: (builder) => ({
    // ======================
    // GET /products — cursor-paginated listing
    // ======================
    getProducts: builder.query<CursorPage<Product>, { cursor?: string; limit?: number; sortBy?: string } | void>({
      query: (params) => ({
        url: "/products",
        params: params ?? undefined,
      }),
      transformResponse: (response: ApiResponse<Product[]>) => ({
        items: response.data || [],
        pagination: {
          cursor: (response.pagination as any)?.nextCursor,
          nextCursor: (response.pagination as any)?.nextCursor,
          hasMore: (response.pagination as any)?.hasNext ?? false,
          hasNext: (response.pagination as any)?.hasNext ?? false,
          limit: (response.pagination as any)?.limit ?? 20,
          total: (response.pagination as any)?.total,
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((p) => ({ type: "Products" as const, id: p.id })),
              { type: "Products" as const, id: "PUBLIC_LIST" },
            ]
          : [{ type: "Products" as const, id: "PUBLIC_LIST" }],
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (currentCache, newItems, { arg }) => {
        if (!arg?.cursor) return newItems;
        return {
          items: [...currentCache.items, ...newItems.items],
          pagination: newItems.pagination,
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => currentArg?.cursor !== previousArg?.cursor,
    }),

    // ======================
    // POST /products/filter — combined filters, cursor-paginated
    // ======================
    filterProducts: builder.query<CursorPage<Product>, PublicProductFilter>({
      query: (filters) => ({
        url: "/products/filter",
        method: "POST",
        body: filters,
      }),
      transformResponse: (response: ApiResponse<Product[]>) => ({
        items: response.data || [],
        pagination: {
          cursor: (response.pagination as any)?.nextCursor,
          nextCursor: (response.pagination as any)?.nextCursor,
          hasMore: (response.pagination as any)?.hasNext ?? false,
          hasNext: (response.pagination as any)?.hasNext ?? false,
          limit: (response.pagination as any)?.limit ?? 20,
          total: (response.pagination as any)?.total,
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((p) => ({ type: "Products" as const, id: p.id })),
              { type: "Products" as const, id: "FILTERED_LIST" },
            ]
          : [{ type: "Products" as const, id: "FILTERED_LIST" }],
    }),

    // ======================
    // GET /products/category/:categoryId
    // ======================
    getProductsByCategory: builder.query<CursorPage<Product>, { categoryId: string; cursor?: string; limit?: number }>({
      query: ({ categoryId, ...params }) => ({
        url: `/products/category/${categoryId}`,
        params,
      }),
      transformResponse: (response: ApiResponse<Product[]>) => ({
        items: response.data || [],
        pagination: {
          cursor: (response.pagination as any)?.nextCursor,
          nextCursor: (response.pagination as any)?.nextCursor,
          hasMore: (response.pagination as any)?.hasNext ?? false,
          hasNext: (response.pagination as any)?.hasNext ?? false,
          limit: (response.pagination as any)?.limit ?? 20,
          total: (response.pagination as any)?.total,
        },
      }),
      providesTags: (result, error, { categoryId }) => [
        { type: "Products" as const, id: `CATEGORY_${categoryId}` },
      ],
    }),

    // ======================
    // GET /products/search?q=
    // ======================
    searchProducts: builder.query<
      Array<{ id: string; name: string; slug: string; rank?: number }>,
      { q: string; limit?: number }
    >({
      query: ({ q, limit }) => ({
        url: "/products/search",
        params: { q, limit },
      }),
      transformResponse: (response: ApiResponse<Array<{ id: string; name: string; slug: string; rank?: number }>>) => response.data,
      providesTags: ["Products"],
    }),

    // ======================
    // GET /products/featured
    // ======================
    getFeaturedProducts: builder.query<Product[], { limit?: number } | void>({
      query: (params) => ({ url: "/products/featured", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<Product[]>) => response.data,
      providesTags: [{ type: "Products", id: "FEATURED" }],
    }),

    // ======================
    // GET /products/new-arrivals
    // ======================
    getNewArrivals: builder.query<Product[], { limit?: number } | void>({
      query: (params) => ({ url: "/products/new-arrivals", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<Product[]>) => response.data,
      providesTags: [{ type: "Products", id: "NEW_ARRIVALS" }],
    }),

    // ======================
    // GET /products/trending
    // ======================
    getTrendingProducts: builder.query<Product[], { limit?: number } | void>({
      query: (params) => ({ url: "/products/trending", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<Product[]>) => response.data,
      providesTags: [{ type: "Products", id: "TRENDING" }],
    }),

    // ======================
    // GET /products/best-selling
    // ======================
    getBestSellingProducts: builder.query<Product[], { limit?: number } | void>({
      query: (params) => ({ url: "/products/best-selling", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<Product[]>) => response.data,
      providesTags: [{ type: "Products", id: "BEST_SELLING" }],
    }),

    // ======================
    // GET /products/flash-sale
    // ======================
    getFlashSaleProducts: builder.query<Product[], { limit?: number } | void>({
      query: (params) => ({ url: "/products/flash-sale", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<Product[]>) => response.data,
      providesTags: [{ type: "Products", id: "FLASH_SALE" }],
    }),

    // ======================
    // GET /products/discounted
    // ======================
    getDiscountedProducts: builder.query<Product[], { limit?: number } | void>({
      query: (params) => ({ url: "/products/discounted", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<Product[]>) => response.data,
      providesTags: [{ type: "Products", id: "DISCOUNTED" }],
    }),

    // ======================
    // GET /products/:productId/related
    // ======================
    getRelatedProducts: builder.query<Product[], { productId: string; limit?: number }>({
      query: ({ productId, limit }) => ({ url: `/products/${productId}/related`, params: { limit } }),
      transformResponse: (response: ApiResponse<Product[]>) => response.data,
      providesTags: (result, error, { productId }) => [
        { type: "Products", id: `RELATED_${productId}` },
      ],
    }),

    // ======================
    // GET /products/:productId/similar
    // ======================
    getSimilarProducts: builder.query<Product[], { productId: string; limit?: number }>({
      query: ({ productId, limit }) => ({ url: `/products/${productId}/similar`, params: { limit } }),
      transformResponse: (response: ApiResponse<Product[]>) => response.data,
      providesTags: (result, error, { productId }) => [
        { type: "Products", id: `SIMILAR_${productId}` },
      ],
    }),

    // ======================
    // GET /products/recently-viewed (auth required)
    // ======================
    getRecentlyViewed: builder.query<Product[], { limit?: number } | void>({
      query: (params) => ({ url: "/products/recently-viewed", params: params ?? undefined }),
      transformResponse: (response: ApiResponse<Product[]>) => response.data,
      providesTags: [{ type: "RecentlyViewed", id: "LIST" }],
    }),

    // ======================
    // GET /products/:slug — SEO product detail page
    // ======================
    getProductBySlug: builder.query<ProductDetailResponse, string>({
      query: (slug) => `/products/${slug}`,
      transformResponse: (response: ApiResponse<ProductDetailResponse>) => response.data,
      providesTags: (result, error, slug) => [
        { type: "Products" as const, id: slug },
        ...(result ? [{ type: "Products" as const, id: result.id }] : []),
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProductsQuery,
  useLazyGetProductsQuery,
  useFilterProductsQuery,
  useGetProductsByCategoryQuery,
  useSearchProductsQuery,
  useGetFeaturedProductsQuery,
  useGetNewArrivalsQuery,
  useGetTrendingProductsQuery,
  useGetBestSellingProductsQuery,
  useGetFlashSaleProductsQuery,
  useGetDiscountedProductsQuery,
  useGetRelatedProductsQuery,
  useGetSimilarProductsQuery,
  useGetRecentlyViewedQuery,
  useGetProductBySlugQuery,
  useLazyGetProductBySlugQuery,
  useLazySearchProductsQuery,
} = commonProductApi;