import { Metadata } from "next";
import { getCategoriesServer, getProductsServer } from '@/lib/api-utils';
import { ServerBreadcrumb } from "@/components/seo/ServerBreadcrumb";
import { ProductListJsonLd } from "@/components/seo/ProductListJsonLd";
import { SharedProductCard } from "@/components/product/card/SharedProductCard";
import { ProductListingGrid, gridImageSizes } from "@/components/product/card/ProductListingGrid";
import { getPublishedProductCardConfig } from "@/lib/theme-utils";
import { FilterSidebar } from "@/components/product/filter/FilterSidebar"; 
import { Container } from "@/components/Container";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourstore.com';
  
  return {
    title: `${decodeURIComponent(slug)} - Buy Online at Best Prices | Your Store`,
    description: `Shop ${decodeURIComponent(slug)} at best prices in Bangladesh.`,
    alternates: { canonical: `${siteUrl}/category/${slug}` },
  };
}

export const revalidate = 0; 

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
      search?: string;   
    minPrice?: string;
    maxPrice?: string;
    ratings?: string;
    availability?: string;
    brands?: string;
    attrs?: string;
  }>;
}) {
  const { slug } = await params;
  const filterParams = await searchParams;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  // Published global card design (cached + tag-revalidated; the same fetch the
  // root layout makes). Its optional `grid` block drives this page's grid.
  const [categoriesData, productsResponse, cardConfig] = await Promise.all([
    getCategoriesServer(),
    getProductsServer({
         search: filterParams.search,
      categorySlug: slug,
      minPrice: filterParams.minPrice,
      maxPrice: filterParams.maxPrice,
      ratings: filterParams.ratings,
      availability: filterParams.availability,
      brands: filterParams.brands,
      attrs: filterParams.attrs,
    }),
    getPublishedProductCardConfig(),
  ]);
  const listingGrid = cardConfig.grid ?? null;

  const categories = categoriesData.data || [];
  const products = productsResponse.data || []; 
  const pagination = productsResponse.pagination || {};

  const findCategory = (cats: any[], targetSlug: string): any => {
    for (const cat of cats) {
      if (cat.slug === targetSlug) return cat;
      if (cat.children?.length) {
        const found = findCategory(cat.children, targetSlug);
        if (found) return found;
      }
    }
    return null;
  };
  
  const currentCategory = findCategory(categories, slug);

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductListJsonLd products={products} currentCategory={currentCategory} siteUrl={siteUrl} />

      <Container>
        <ServerBreadcrumb categories={categories} currentCategory={currentCategory} />

        <div className="flex gap-6 mt-6">
          <FilterSidebar 
            categorySlug={slug}
          />

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {currentCategory ? currentCategory.name : decodeURIComponent(slug)}
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