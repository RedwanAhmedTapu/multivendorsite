// app/products/[id]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import SingleProductClient from "./SingleProductClient";

// ==========================================================
// Next.js 15 Update: params is now a Promise
// ==========================================================

type Props = {
  params: Promise<{ id: string }>; // Changed to Promise
};

// 1. DYNAMIC METADATA GENERATION
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // MUST AWAIT params in Next.js 15
  const { id: slug } = await params;
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${slug}`, {
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      return { title: 'Product Not Found' };
    }

    const json = await res.json();
    const product = json.data;
    const seo = product?.seo;

    const cleanDescription = seo?.metaDescription || product?.description?.replace(/<[^>]*>/g, '').substring(0, 160) || `Buy ${product?.name} at the best price.`;

    return {
      title: seo?.metaTitle || `${product?.name} | FinixMart`,
      description: cleanDescription,
      keywords: `${product?.name}, ${product?.brand?.name}, buy online, ${product?.category?.name}`,
      robots: seo?.robots ? {
        index: seo.robots.includes("INDEX"),
        follow: seo.robots.includes("FOLLOW"),
      } : { index: true, follow: true },
      openGraph: {
        title: seo?.ogTitle || product?.name,
        description: seo?.ogDescription || cleanDescription,
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/products/${slug}`,
        siteName: 'FinixMart',
        images: seo?.ogImage ? [{ url: seo.ogImage, alt: product?.name }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: seo?.twitterTitle || product?.name,
        description: seo?.twitterDescription || cleanDescription,
        images: [seo?.twitterImage || ''],
      },
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/products/${slug}`,
      },
    };
  } catch (error) {
    return { title: 'Product' };
  }
}

// 2. PAGE COMPONENT
export default async function ProductPage({ params }: Props) {
  // MUST AWAIT params in Next.js 15
  const { id: slug } = await params;

  let product = null;

  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/products/${slug}`;
    
    const res = await fetch(apiUrl, {
      cache: 'no-store',
    });

    console.log("📊 API Response Status:", res.status); 

    if (!res.ok) {
      console.error("❌ API returned error status:", res.status, res.statusText); 
      notFound();
    }

    const json = await res.json();
    product = json.data;
    console.log("📦 Fetched product data:", product);

    if (!product) {
      console.error("❌ API returned success but data is missing."); 
      notFound();
    }

    console.log("✅ Successfully fetched product:", product?.name); 

  } catch (error) {
    console.error("❌ Exception during fetch:", error); 
    notFound();
  }

  const jsonLd = product.seo?.schemaOverride?.jsonLd;
  const breadcrumbLd = product.seo?.schemaOverride?.breadcrumb;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {breadcrumbLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      )}

      <SingleProductClient initialProduct={product} />
    </>
  );
}