import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  Brand,
  CreateBrandData,
  UpdateBrandData,
  BrandStatus,
} from "../types/brand";
import baseQueryWithReauth from "./baseQueryWithReauth";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface GetMyBrandsParams {
  status?: BrandStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

interface GetAllBrandsParams {
  status?: BrandStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// ======================
// Brand catalog types (searchable brand-name list, distinct from the
// vendor brand-approval workflow above)
// ======================
interface BrandCatalogEntry {
  id: string;
  name: string;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface GetBrandCatalogParams {
  search?: string;
  limit?: number;
}

interface BulkCreateBrandCatalogResult {
  submitted: number;
  uniqueSubmitted: number;
  created: number;
  skipped: number;
}

export const brandApi = createApi({
  reducerPath: "brandApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Brands", "VendorBrands", "AdminBrands", "BrandCatalog"],

  endpoints: (builder) => ({
    // ======================
    // GET VENDOR'S OWN BRANDS
    // ======================
    getMyBrands: builder.query<
      {
        brands: Brand[];
        pagination: PaginationMeta;
      },
      GetMyBrandsParams | void
    >({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();

        Object.entries(params ?? {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, value.toString());
          }
        });

        const queryString = queryParams.toString();
        return {
          url: `/brands/vendor/my-brands${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      transformResponse: (response: ApiResponse<Brand[]>) => {
        return {
          brands: response.data,
          pagination: response.pagination as PaginationMeta,
        };
      },
      providesTags: (result) => {
        if (!result?.brands) {
          return [{ type: "Brands" as const }];
        }

        return [
          { type: "VendorBrands" as const, id: "LIST" },
          ...result.brands.map((brand) => ({
            type: "Brands" as const,
            id: brand.id,
          })),
        ];
      },
    }),

    // ======================
    // GET VENDOR'S SINGLE BRAND (ownership verified)
    // ======================
    getMyBrandById: builder.query<Brand, string>({
      query: (id) => `/brands/vendor/${id}`,
      transformResponse: (response: ApiResponse<Brand>) => response.data,
      providesTags: (result, error, id) => [{ type: "Brands", id }],
    }),

    // ======================
    // UPLOAD BRAND AUTHENTICATION DOCUMENT
    // ======================
    uploadBrandDocument: builder.mutation<{ url: string }, FormData>({
      query: (formData) => ({
        url: "/brands/vendor/upload-document",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: ApiResponse<{ url: string }>) =>
        response.data,
    }),
    // ======================
    // DELETE BRAND AUTHENTICATION DOCUMENT
    // ======================
    deleteBrandDocument: builder.mutation<{ message: string }, { key: string }>(
      {
        query: ({ key }) => ({
          url: "/brands/vendor/delete-document",
          method: "DELETE",
          body: { key },
        }),
        transformResponse: (response: ApiResponse<null>) => ({
          message: response.message ?? "Document deleted",
        }),
      },
    ),

    // ======================
    // CREATE BRAND
    // ======================
    createBrand: builder.mutation<Brand, CreateBrandData>({
      query: (body) => ({
        url: "/brands/vendor",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<Brand>) => response.data,
      invalidatesTags: [{ type: "VendorBrands", id: "LIST" }, "Brands"],
    }),

    // ======================
    // UPDATE BRAND
    // ======================
    updateBrand: builder.mutation<Brand, { id: string; data: UpdateBrandData }>(
      {
        query: ({ id, data }) => ({
          url: `/brands/vendor/${id}`,
          method: "PUT",
          body: data,
        }),
        transformResponse: (response: ApiResponse<Brand>) => response.data,
        invalidatesTags: (result, error, { id }) => [
          { type: "Brands", id },
          { type: "VendorBrands", id: "LIST" },
          "Brands",
        ],
      },
    ),

    // ======================
    // DELETE BRAND
    // ======================
    deleteBrand: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/brands/vendor/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<null>) => response,
      invalidatesTags: (result, error, id) => [
        { type: "Brands", id },
        { type: "VendorBrands", id: "LIST" },
        "Brands",
      ],
    }),

    // ======================
    // GET ALL BRANDS (Admin view - all statuses)
    // ======================
    getAllBrands: builder.query<
      {
        brands: Brand[];
        pagination: PaginationMeta;
      },
      GetAllBrandsParams | void
    >({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();

        Object.entries(params ?? {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, value.toString());
          }
        });

        const queryString = queryParams.toString();
        return {
          url: `/brands/admin/all${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      transformResponse: (response: ApiResponse<Brand[]>) => {
        return {
          brands: response.data,
          pagination: response.pagination as PaginationMeta,
        };
      },
      providesTags: (result) => {
        if (!result?.brands) {
          return [{ type: "AdminBrands" as const }];
        }

        return [
          { type: "AdminBrands" as const, id: "LIST" },
          ...result.brands.map((brand) => ({
            type: "Brands" as const,
            id: brand.id,
          })),
        ];
      },
    }),

    // ======================
    // GET BRANDS PENDING APPROVAL
    // ======================
    getPendingBrands: builder.query<Brand[], void>({
      query: () => ({
        url: "/brands/admin/pending",
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<Brand[]>) => response.data,
      providesTags: [{ type: "AdminBrands", id: "PENDING" }],
    }),

    // ======================
    // GET BRANDS BY VENDOR ID (Admin view)
    // ======================
    getBrandsByVendorId: builder.query<
      Brand[],
      { vendorId: string; status?: BrandStatus }
    >({
      query: ({ vendorId, status }) => {
        const params = new URLSearchParams();
        if (status) params.append("status", status);
        const queryString = params.toString();
        return `/brands/admin/vendor/${vendorId}${
          queryString ? `?${queryString}` : ""
        }`;
      },
      transformResponse: (response: ApiResponse<Brand[]>) => response.data,
      providesTags: (result, error, { vendorId }) => [
        { type: "AdminBrands", id: vendorId },
        "Brands",
      ],
    }),

    // ======================
    // GET BRAND BY ID (Admin view)
    // ======================
    getBrandById: builder.query<Brand, string>({
      query: (id) => `/brands/admin/${id}`,
      transformResponse: (response: ApiResponse<Brand>) => response.data,
      providesTags: (result, error, id) => [{ type: "Brands", id }],
    }),

    // ======================
    // APPROVE BRAND
    // ======================
    approveBrand: builder.mutation<Brand, string>({
      query: (id) => ({
        url: `/brands/admin/${id}/approve`,
        method: "PATCH",
      }),
      transformResponse: (response: ApiResponse<Brand>) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: "Brands", id },
        { type: "AdminBrands", id: "LIST" },
        { type: "AdminBrands", id: "PENDING" },
        { type: "VendorBrands", id: "LIST" },
        "Brands",
      ],
    }),

    // ======================
    // REJECT BRAND
    // ======================
    rejectBrand: builder.mutation<Brand, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/brands/admin/${id}/reject`,
        method: "PATCH",
        body: { reason },
      }),
      transformResponse: (response: ApiResponse<Brand>) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "Brands", id },
        { type: "AdminBrands", id: "LIST" },
        { type: "AdminBrands", id: "PENDING" },
        { type: "VendorBrands", id: "LIST" },
        "Brands",
      ],
    }),

    // ======================
    // GET BRAND CATALOG (searchable brand-name list — vendor + admin)
    // GET /brands/catalog?search=sam&limit=50
    // ======================
    getBrandCatalog: builder.query<
      BrandCatalogEntry[],
      GetBrandCatalogParams | void
    >({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();

        Object.entries(params ?? {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, value.toString());
          }
        });

        const queryString = queryParams.toString();
        return {
          url: `/brands/catalog${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      transformResponse: (response: ApiResponse<BrandCatalogEntry[]>) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              { type: "BrandCatalog" as const, id: "LIST" },
              ...result.map((entry) => ({
                type: "BrandCatalog" as const,
                id: entry.id,
              })),
            ]
          : [{ type: "BrandCatalog" as const, id: "LIST" }],
    }),

    // ======================
    // ADD A SINGLE BRAND NAME TO THE CATALOG (Admin)
    // POST /brands/admin/catalog  body: { name }
    // ======================
    createBrandCatalogEntry: builder.mutation<BrandCatalogEntry, { name: string }>({
      query: (body) => ({
        url: "/brands/admin/catalog",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<BrandCatalogEntry>) =>
        response.data,
      invalidatesTags: [{ type: "BrandCatalog", id: "LIST" }],
    }),

    // ======================
    // BULK ADD BRAND NAMES TO THE CATALOG (Admin)
    // POST /brands/admin/catalog/bulk  body: { names: string[] }
    // ======================
    bulkCreateBrandCatalogEntries: builder.mutation<
      BulkCreateBrandCatalogResult,
      { names: string[] }
    >({
      query: (body) => ({
        url: "/brands/admin/catalog/bulk",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<BulkCreateBrandCatalogResult>) =>
        response.data,
      invalidatesTags: [{ type: "BrandCatalog", id: "LIST" }],
    }),

    // ======================
    // REMOVE A BRAND NAME FROM THE CATALOG (Admin)
    // DELETE /brands/admin/catalog/:id
    // ======================
    deleteBrandCatalogEntry: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/brands/admin/catalog/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<null>) => response,
      invalidatesTags: (result, error, id) => [
        { type: "BrandCatalog", id },
        { type: "BrandCatalog", id: "LIST" },
      ],
    }),
  }),
});

// ======================
// Export hooks
// ======================
export const {
  // Vendor query hooks
  useGetMyBrandsQuery,
  useGetMyBrandByIdQuery,

  // Vendor mutation hooks
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
  useUploadBrandDocumentMutation,
  useDeleteBrandDocumentMutation,

  // Admin query hooks
  useGetAllBrandsQuery,
  useGetPendingBrandsQuery,
  useGetBrandsByVendorIdQuery,
  useGetBrandByIdQuery,

  // Admin mutation hooks
  useApproveBrandMutation,
  useRejectBrandMutation,

  // Brand catalog query hooks (vendor + admin)
  useGetBrandCatalogQuery,

  // Brand catalog mutation hooks (admin)
  useCreateBrandCatalogEntryMutation,
  useBulkCreateBrandCatalogEntriesMutation,
  useDeleteBrandCatalogEntryMutation,
} = brandApi;