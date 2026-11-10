// components/seo/ProductListJsonLd.tsx
// এটি Server Component (কোনো "use client" নেই)

export function ProductListJsonLd({ products, currentCategory, siteUrl }: any) {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: currentCategory ? `${currentCategory.name} Products` : "All Products",
    numberOfItems: products.length,
    itemListElement: products.map((product: any, index: number) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        image: product.images?.[0]?.url ? `${siteUrl}${product.images[0].url}` : undefined,
        url: `${siteUrl}/products/${product.slug}`,
        offers: {
          "@type": "Offer",
          price: product.variants?.[0]?.specialPrice || product.variants?.[0]?.price || 0,
          priceCurrency: "BDT",
          availability: "https://schema.org/InStock",
        },
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
    />
  );
}