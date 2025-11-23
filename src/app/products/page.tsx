// app/products/page.tsx (Server Component)
import { getCategoriesServer, getProductsServer } from '@/lib/api-utils';
import ProductsPage from './ProductsPageClient';

export const metadata = {
  title: 'Products - Our Store',
  description: 'Browse our wide range of products with filters and categories.',
  keywords: 'products, shop, buy, online store',
  openGraph: {
    title: 'Products - Our Store',
    description: 'Browse our wide range of products',
    type: 'website',
  },
};

export default async function ProductsServerPage() {
  // Fetch data on server
  const [categoriesData, productsData] = await Promise.all([
    getCategoriesServer(),
    getProductsServer(),
  ]);

  const categories = categoriesData.data || [];
  const products = productsData.data || [];

  // Generate static paths for popular categories (optional)
  const staticPaths = categories.map((category: any) => ({
    categoryId: category.id,
    categorySlug: category.slug,
  }));

  return (
    <ProductsPage 
      initialCategories={categories}
      initialProducts={products}
      staticPaths={staticPaths}
    />
  );
}