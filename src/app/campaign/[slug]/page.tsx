// app/campaign/[slug]/page.tsx
import { Metadata } from "next";
import CampaignClient from "./CampaignClient";

type Props = {
  params: Promise<{ slug: string }>;
};

async function fetchCampaign(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/public/${slug}`, {
      next: { revalidate: 60 }, // campaigns change more often than a vendor storefront
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await fetchCampaign(slug);

  const title = campaign?.title ? `${campaign.title} | FinixMart` : "Campaign | FinixMart";
  const description = campaign?.heroSubtitle || `Check out ${campaign?.title || "this campaign"} on FinixMart.`;
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/campaign/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "FinixMart",
      images: campaign?.heroImage ? [{ url: campaign.heroImage, alt: campaign.title }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: campaign?.heroImage ? [campaign.heroImage] : [],
    },
    alternates: { canonical: url },
  };
}

export default async function CampaignPage({ params }: Props) {
  const { slug } = await params;
  return <CampaignClient slug={slug} />;
}