// components/seo/ProductListStructuredData.tsx
"use client";

import { useMemo } from "react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  images?: { url: string }[];
  variants?: {
    price?: number;
    specialPrice?: number;
    discount?: number;
  }[];
  brand?: {
    name: string;
  };
  reviewSummary?: {
    averageRating: number;
    totalReviews: number;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent?: Category | null;
}

interface ProductListStructuredDataProps {
  products: Product[];
  categories?: Category[];
  currentCategory?: Category | null;
  siteUrl: string;
  pageUrl: string;
}

export const ProductListStructuredData: React.FC<ProductListStructuredDataProps> = ({
  products,
  categories = [],
  currentCategory,
  siteUrl,
  pageUrl,
}) => {
  const structuredData = useMemo(() => {
    const data: Record<string, any> = {};

    // 1. ItemList Schema
    data.itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: currentCategory ? `${currentCategory.name} Products` : "All Products",
      description: currentCategory 
        ? `Browse our collection of ${currentCategory.name.toLowerCase()}`
        : "Browse our complete collection of products",
      numberOfItems: products.length,
      url: pageUrl,
      itemListElement: products.slice(0, 20).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.name,
          description: product.description?.substring(0, 200) || `Buy ${product.name} online`,
          image: product.images?.[0]?.url 
            ? `${siteUrl}${product.images[0].url}` 
            : undefined,
          url: `${siteUrl}/products/${product.slug}`,
          brand: product.brand ? {
            "@type": "Brand",
            name: product.brand.name,
          } : undefined,
          offers: {
            "@type": "Offer",
            price: product.variants?.[0]?.specialPrice || product.variants?.[0]?.price || 0,
            priceCurrency: "BDT",
            availability: "https://schema.org/InStock",
            seller: {
              "@type": "Organization",
              name: process.env.NEXT_PUBLIC_SITE_NAME || "Our Store",
            },
          },
          aggregateRating: product.reviewSummary?.totalReviews ? {
            "@type": "AggregateRating",
            ratingValue: product.reviewSummary.averageRating,
            reviewCount: product.reviewSummary.totalReviews,
            bestRating: 5,
          } : undefined,
        },
      })),
    };

    // 2. BreadcrumbList Schema
    const breadcrumbItems: any[] = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${siteUrl}/products`,
      },
    ];

    if (currentCategory) {
      const categoryPath: Category[] = [];
      let cat: Category | null | undefined = currentCategory;
      
      while (cat) {
        categoryPath.unshift(cat);
        cat = cat.parent || undefined;
      }

      categoryPath.forEach((cat, index) => {
        breadcrumbItems.push({
          "@type": "ListItem",
          position: breadcrumbItems.length + 1,
          name: cat.name,
          item: `${siteUrl}/products?category=${cat.slug}`,
        });
      });
    }

    data.breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    };

    // 3. CollectionPage Schema (if category page)
    if (currentCategory) {
      data.collectionPage = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: currentCategory.name,
        description: `Shop ${currentCategory.name.toLowerCase()} at best prices`,
        url: pageUrl,
        isPartOf: {
          "@type": "WebSite",
          name: process.env.NEXT_PUBLIC_SITE_NAME || "Our Store",
          url: siteUrl,
        },
        about: {
          "@type": "Thing",
          name: currentCategory.name,
        },
      };
    }

    return data;
  }, [products, categories, currentCategory, siteUrl, pageUrl]);

  return (
    <>
      {Object.values(structuredData).map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
    </>
  );
};