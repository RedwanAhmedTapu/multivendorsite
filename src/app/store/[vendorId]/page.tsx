// app/store/[vendorId]/page.tsx
import { Metadata } from "next";
import StorefrontClient from "./StorefrontClient";

type Props = {
  params: Promise<{ vendorId: string }>;
};

async function fetchVendorPublicInfo(vendorId: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/vendors/${vendorId}/public`, // ⚠️ আপনার actual public vendor endpoint বসান
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vendorId } = await params;
  const vendor = await fetchVendorPublicInfo(vendorId);

  const title = vendor?.storeName ? `${vendor.storeName} | FinixMart` : "Store | FinixMart";
  const description =
    vendor?.description || `Shop from ${vendor?.storeName || "this seller"} on FinixMart.`;
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/store/${vendorId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "FinixMart",
      images: vendor?.logo ? [{ url: vendor.logo, alt: vendor.storeName }] : [],
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: vendor?.logo ? [vendor.logo] : [],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function StorefrontPage({ params }: Props) {
  const { vendorId } = await params;
  const vendor = await fetchVendorPublicInfo(vendorId);

  const jsonLd = vendor
    ? {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: vendor.storeName,
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/store/${vendorId}`,
        logo: vendor.logo || undefined,
        description: vendor.description || undefined,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <StorefrontClient vendorId={vendorId} initialVendor={vendor} />
    </>
  );
}