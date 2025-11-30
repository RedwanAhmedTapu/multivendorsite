// app/admin/products/page.tsx
import { ProductsTable } from '@/components/admin/products/ProductsTable';
import { ProductsTableSkeleton } from '@/components/admin/products/ProductsTableSkeleton';
import { Suspense } from 'react';

export const metadata = {
  title: 'Products Management | Admin',
  description: 'Manage all products in the system',
};

export default function AdminProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products Management</h1>
        <p className="text-muted-foreground mt-2">
          View, search, filter, and manage all products across vendors
        </p>
      </div>

      <Suspense fallback={<ProductsTableSkeleton />}>
        <ProductsTable />
      </Suspense>
    </div>
  );
}

