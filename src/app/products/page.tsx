// app/products/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCategoriesServer, getProductsServer,searchProductsServer } from '@/lib/api-utils';
import { ServerBreadcrumb } from "@/components/seo/ServerBreadcrumb";
import { ProductListJsonLd } from "@/components/seo/ProductListJsonLd";
import { SharedProductCard } from "@/components/product/card/SharedProductCard";
import { ProductListingGrid, gridImageSizes } from "@/components/product/card/ProductListingGrid";
import { getPublishedProductCardConfig } from "@/lib/theme-utils";
import { FilterSidebar } from "@/components/product/filter/FilterSidebar"; 
import { Container } from "@/components/Container";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourstore.com';
  
  if (params.category) {
    return {
      title: `${params.category} - Buy Online at Best Prices | Your Store`,
      description: `Shop ${params.category} at best prices in Bangladesh.`,
      alternates: { canonical: `${siteUrl}/products?category=${params.category}` },
    };
  }

  return {
    title: 'All Products - Buy Online at Best Prices | Your Store',
    description: 'Browse our wide range of products with filters and categories.',
    alternates: { canonical: `${siteUrl}/products` },
  };
}

export const revalidate = 0; 

export default async function ProductsServerPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    ratings?: string;
    availability?: string;
    brands?: string;
    attrs?: string;
  }>;
}) {
  const params = await searchParams;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  // Category thakle redirect
  if (params.category) {
    redirect(`/category/${params.category}`);
  }

  // Published global card design (cached + tag-revalidated; the same fetch the
  // root layout makes). Its optional `grid` block drives this page's grid.
  const [categoriesData, cardConfig] = await Promise.all([getCategoriesServer(), getPublishedProductCardConfig()]);
  const categories = categoriesData.data || [];
  const listingGrid = cardConfig.grid ?? null;

  let productsResponse;

  // Search thakle alada endpoint
  if (params.search) {
    productsResponse = await searchProductsServer(params.search);
  } else {
    productsResponse = await getProductsServer({
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      ratings: params.ratings,
      availability: params.availability,
      brands: params.brands,
      attrs: params.attrs,
    });
  }

  const products = productsResponse.data || []; 
  const pagination = productsResponse.pagination || {};

  const findCategory = (cats: any[], slug: string): any => {
    for (const cat of cats) {
      if (cat.slug === slug) return cat;
      if (cat.children?.length) {
        const found = findCategory(cat.children, slug);
        if (found) return found;
      }
    }
    return null;
  };
  const currentCategory = params.category ? findCategory(categories, params.category) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductListJsonLd products={products} currentCategory={currentCategory} siteUrl={siteUrl} />

      <Container>
        <ServerBreadcrumb categories={categories} currentCategory={currentCategory} />

        <div className="flex gap-6 mt-6">
          
          {/* ✅ সমাধান: এখানে শুধু categorySlug পাস করবেন, কোনো ফাংশন পাস করবেন না */}
          <FilterSidebar 
            categorySlug={params.category || ''}
          />

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {currentCategory ? currentCategory.name : "All Products"}
              <span className="text-sm font-normal text-gray-500 ml-3">
                ({pagination.total || products.length} items)
              </span>
            </h1>

            {products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No products found for these filters.</p>
              </div>
            ) : (
              <ProductListingGrid grid={listingGrid}>
                {products.map((product: any) => (
                  <SharedProductCard
                    key={product.id}
                    product={product}
                    imageSizes={gridImageSizes(listingGrid)}
                  />
                ))}
              </ProductListingGrid>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}