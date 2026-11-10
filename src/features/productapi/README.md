# productapi/

RTK Query client for the Product module, split to mirror the backend's
`PublicProductController` / `VendorProductController` / `AdminProductController`
three-way split — one shared cache, one `reducerPath`, three endpoint files.

```
productapi/
  productApiBase.ts     createApi({ reducerPath: "productApi" }), empty endpoints, shared tagTypes
  commonProductApi.ts    public storefront + logged-in-user endpoints (injectEndpoints)
  vendorProductApi.ts    vendor dashboard endpoints (injectEndpoints)
  adminProductApi.ts     admin dashboard endpoints (injectEndpoints)
  types.ts               shared response/pagination/SEO/statistics types
  index.ts                barrel export — import everything from here
```

## Why one base + three inject files (not three separate `createApi`s)

RTK Query requires one `reducerPath` per Redux slice. Three separate
`createApi` calls would mean three reducers, three middlewares, and no
shared cache between e.g. a vendor updating a product and the admin list
reflecting it. `injectEndpoints()` lets each role file add its endpoints
to the *same* slice, so tag invalidation crosses files — e.g. approving a
product in `adminProductApi.ts` invalidates `Products/{id}`, which a
`commonProductApi.ts` product-detail query subscribed to will pick up
automatically.

## Usage

```ts
import { useGetProductBySlugQuery } from "@/productapi"; // common
import { useCreateProductMutation } from "@/productapi"; // vendor
import { useApproveProductMutation } from "@/productapi"; // admin
```

Everything is re-exported from `index.ts`, so a single import path covers
all three roles — you don't need to know which file an endpoint lives in.

## Pagination — cursor (public) vs offset (vendor/admin)

The backend uses cursor pagination for public/storefront traffic
(`CursorPage<T>` — `{ items, pagination: { hasNext, nextCursor, limit } }`)
and offset pagination for vendor/admin dashboards (`OffsetPage<T>` —
`{ items, pagination: { currentPage, totalPages, totalItems, hasNext, hasPrevious, limit } }`).
`commonProductApi.ts` queries return `CursorPage<Product>`;
`vendorProductApi.ts`/`adminProductApi.ts` list queries return
`OffsetPage<Product>`. Use `isOffsetPagination()` from `types.ts` if you
ever need to branch on which shape you got.

`getProducts` (common) keeps the same infinite-scroll cache-merge pattern
as the original file — first page (no `cursor`) replaces the cache, every
subsequent page appends.

## Key behavior changes vs. the original single-file `productApi.ts`

- **Product detail is fetched by slug, not id**: `useGetProductBySlugQuery(slug)`
  hits `GET /products/:slug` and returns the full SEO-optimized payload —
  `seo`, `breadcrumb`, `reviewSummary`, and `redirectedFrom` (non-null when
  the slug you passed has since changed and the backend followed slug
  history to find the product).
- **Vendor delete is a soft delete**: `useDeleteProductMutation` now
  returns `{ id, scheduledPurgeAt }` instead of `null` — the product is
  gone from listings immediately but not permanently deleted for 90 days.
  Show `scheduledPurgeAt` in a toast/undo banner. Pair with
  `useRestoreProductMutation` and `useGetVendorTrashQuery` to build an
  undo/trash UI.
- **Admin delete is separate and permanent**: `useForceDeleteProductMutation`
  (admin-only) — no grace period, matches `DELETE /products/admin/:id`.
- **Approval auto-generates SEO**: `useApproveProductMutation` and
  `useUpdateProductStatusMutation({ status: "ACTIVE" })` both hit backend
  endpoints that publish SEO metadata as a side effect — nothing extra to
  call from the client.
- **New discovery endpoints**: featured, new-arrivals, trending,
  best-selling, flash-sale, discounted, related, similar, recently-viewed
  — each a thin cached query in `commonProductApi.ts`.
- **New vendor endpoints**: `useGetVendorTrashQuery` /
  `useRestoreProductMutation` (soft-delete grace period),
  `useGetVendorMonthlyTrendsQuery`, `useUploadProductImagesMutation` /
  `useUploadProductVideoMutation` (multipart, build the `FormData`
  yourself and pass it straight in).
- **New admin endpoints**: `useBulkApproveProductsMutation` /
  `useBulkRejectProductsMutation`, `useGetPendingApprovalQuery`,
  `useFilterProductsAdminQuery`, `useRestoreProductAdminMutation`.

## Example: upload then create

```ts
const [uploadImages] = useUploadProductImagesMutation();
const [createProduct] = useCreateProductMutation();

async function handleSubmit(files: File[], rest: CreateProductData) {
  const formData = new FormData();
  files.forEach((f) => formData.append("images", f));

  const { urls } = await uploadImages(formData).unwrap();
  await createProduct({
    ...rest,
    images: urls.map((url, i) => ({ url, sortOrder: i })),
  }).unwrap();
}
```

## Example: vendor soft-delete with undo

```tsx
const [deleteProduct] = useDeleteProductMutation();
const [restoreProduct] = useRestoreProductMutation();

async function handleDelete(id: string) {
  const { scheduledPurgeAt } = await deleteProduct(id).unwrap();
  toast(`Deleted. Permanently removed on ${new Date(scheduledPurgeAt).toLocaleDateString()}.`, {
    action: { label: "Undo", onClick: () => restoreProduct(id) },
  });
}
```
